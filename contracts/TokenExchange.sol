// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./CreatorToken.sol";
import "./CreatorTokenFactory.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title TokenExchange
 * @dev Exchange para intercambiar tokens de creadores por la moneda nativa (DEV/GLMR)
 * - Compra de tokens de creadores con DEV/GLMR (mint)
 * - Venta de tokens de creadores por DEV/GLMR (burn)
 * - Precio fijo establecido por el creador en su token
 * - Verifica que el creador no esté baneado antes de permitir transacciones
 */
contract TokenExchange is Ownable, ReentrancyGuard {
    
    // Referencia al factory
    CreatorTokenFactory public factory;
    
    // Fee de la plataforma en basis points (ej: 100 = 1%, 10000 = 100%)
    uint256 public platformFee = 100; // 1% por defecto
    
    // Distribución de fondos en basis points (10000 = 100%)
    uint256 public constant CREATOR_SHARE = 200; // 2% para el creador
    uint256 public constant PLATFORM_SHARE = 100; // 1% fee de plataforma
    uint256 public constant LIQUIDITY_SHARE = 9700; // 97% para reserva de liquidez
    
    // Acumulado de fees para retirar
    uint256 public accumulatedFees;

    // Ganancias acumuladas por cada creador (en moneda nativa)
    mapping(address => uint256) public creatorEarnings;
    
    // Reserva de liquidez por token (dirección del token => cantidad en wei)
    mapping(address => uint256) public tokenLiquidityReserve;
    
    // Reserva disponible para retiro por creador (dirección del creador => cantidad en wei)
    mapping(address => uint256) public creatorReserve;
    
    // Eventos
    event TokensPurchased(
        address indexed buyer,
        address indexed creatorToken,
        uint256 tokensAmount,
        uint256 nativeAmount,
        uint256 fee
    );
    
    event TokensSold(
        address indexed seller,
        address indexed creatorToken,
        uint256 tokensAmount,
        uint256 nativeAmount,
        uint256 fee
    );
    
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    
    event FeesWithdrawn(address indexed recipient, uint256 amount);
    
    event LiquidityReserved(
        address indexed creatorToken,
        uint256 amount,
        uint256 totalReserve
    );
    
    event CreatorReserveAdded(
        address indexed creator,
        address indexed creatorToken,
        uint256 amount,
        uint256 totalReserve
    );
    
    event CreatorReserveWithdrawn(
        address indexed creator,
        uint256 amount
    );
    
    constructor(address factoryAddress) Ownable(msg.sender) {
        require(factoryAddress != address(0), "Invalid factory address");
        factory = CreatorTokenFactory(factoryAddress);
    }
    
    /**
     * @dev Compra tokens de creador con la moneda nativa
     * Se mintean nuevos tokens según el precio establecido por el creador
     * @param creatorToken Dirección del token del creador
     */
    function buyTokens(address creatorToken) external payable nonReentrant {
        require(msg.value > 0, "Must send native currency");
        
        // Obtener el creador del token
        address creator = factory.getTokenCreator(creatorToken);
        require(creator != address(0), "Token not registered");
        
        // Verificar que el creador no esté baneado
        require(factory.isCreatorActive(creator), "Creator is banned");
        
        CreatorToken token = CreatorToken(creatorToken);
        
        // Calcular distribución: 2% creador, 1% fee, 97% reserva
        uint256 amountForCreator = (msg.value * CREATOR_SHARE) / 10000;
        uint256 fee = (msg.value * PLATFORM_SHARE) / 10000;
        uint256 liquidityReserve = (msg.value * LIQUIDITY_SHARE) / 10000;
        
        // Verificar que la suma sea correcta (puede haber pequeñas diferencias por redondeo)
        require(amountForCreator + fee + liquidityReserve <= msg.value, "Distribution calculation error");
        
        // Calcular cantidad de tokens a recibir (basado en el total enviado)
        uint256 tokensToMint = token.calculateTokensForWei(msg.value);
        require(tokensToMint > 0, "Amount too small");
        
        // Acumular fee de la plataforma
        accumulatedFees += fee;
        
        // Enviar dinero al creador (2%)
        (bool success, ) = payable(creator).call{value: amountForCreator}("");
        require(success, "Transfer to creator failed");

        // Registrar ganancias del creador
        creatorEarnings[creator] += amountForCreator;
        
        // Agregar a la reserva del creador (97% va a reserva, pero el creador puede retirar su parte)
        creatorReserve[creator] += liquidityReserve;
        
        // Agregar a la reserva de liquidez del token
        tokenLiquidityReserve[creatorToken] += liquidityReserve;
        
        // Emitir eventos
        emit LiquidityReserved(creatorToken, liquidityReserve, tokenLiquidityReserve[creatorToken]);
        emit CreatorReserveAdded(creator, creatorToken, liquidityReserve, creatorReserve[creator]);
        
        // Mintear tokens al comprador
        token.mint(msg.sender, tokensToMint);
        
        emit TokensPurchased(
            msg.sender,
            creatorToken,
            tokensToMint,
            msg.value,
            fee
        );
    }
    
    /**
     * @dev Vende tokens de creador por moneda nativa
     * Se queman los tokens y se envía DEV/GLMR al vendedor
     * @param creatorToken Dirección del token del creador
     * @param tokenAmount Cantidad de tokens a vender
     */
    function sellTokens(
        address creatorToken,
        uint256 tokenAmount
    ) external nonReentrant {
        require(tokenAmount > 0, "Amount must be greater than 0");
        
        // Obtener el creador del token
        address creator = factory.getTokenCreator(creatorToken);
        require(creator != address(0), "Token not registered");
        
        // Verificar que el creador no esté baneado
        require(factory.isCreatorActive(creator), "Creator is banned");
        
        CreatorToken token = CreatorToken(creatorToken);
        
        // Verificar que el vendedor tenga suficientes tokens
        require(token.balanceOf(msg.sender) >= tokenAmount, "Insufficient balance");
        
        // Calcular cantidad de moneda nativa a recibir
        uint256 nativeAmount = token.calculateWeiForTokens(tokenAmount);
        require(nativeAmount > 0, "Amount too small");
        
        // Calcular fee de la plataforma
        uint256 fee = (nativeAmount * platformFee) / 10000;
        uint256 amountAfterFee = nativeAmount - fee;
        
        // Verificar que haya suficiente reserva de liquidez para este token
        require(tokenLiquidityReserve[creatorToken] >= amountAfterFee, "Insufficient liquidity reserve");
        
        // Transferir tokens del vendedor al contrato
        require(
            token.transferFrom(msg.sender, address(this), tokenAmount),
            "Transfer failed"
        );
        
        // Quemar los tokens
        token.burn(address(this), tokenAmount);
        
        // Acumular fee
        accumulatedFees += fee;
        
        // Reducir la reserva de liquidez del token
        uint256 tokenReserveBefore = tokenLiquidityReserve[creatorToken];
        tokenLiquidityReserve[creatorToken] -= amountAfterFee;
        
        // Reducir proporcionalmente la reserva disponible del creador
        // Si el creador tiene reserva disponible, la reducimos proporcionalmente
        if (creatorReserve[creator] > 0 && tokenReserveBefore > 0) {
            // Calcular reducción proporcional
            uint256 creatorReserveReduction = (creatorReserve[creator] * amountAfterFee) / tokenReserveBefore;
            // Asegurar que no reduzcamos más de lo que hay
            if (creatorReserveReduction > creatorReserve[creator]) {
                creatorReserveReduction = creatorReserve[creator];
            }
            creatorReserve[creator] -= creatorReserveReduction;
        }
        
        // Enviar moneda nativa al vendedor desde la reserva
        (bool success, ) = payable(msg.sender).call{value: amountAfterFee}("");
        require(success, "Native transfer failed");
        
        emit TokensSold(
            msg.sender,
            creatorToken,
            tokenAmount,
            nativeAmount,
            fee
        );
    }
    
    /**
     * @dev Calcula cuántos tokens se recibirían por una cantidad de moneda nativa
     * @param creatorToken Dirección del token del creador
     * @param nativeAmount Cantidad de moneda nativa
     * @return tokensAmount Cantidad de tokens que se recibirían
     * @return fee Fee de la plataforma
     */
    function calculateBuyAmount(
        address creatorToken,
        uint256 nativeAmount
    ) external view returns (uint256 tokensAmount, uint256 fee) {
        require(nativeAmount > 0, "Amount must be greater than 0");
        
        CreatorToken token = CreatorToken(creatorToken);
        
        // El fee es 1% (PLATFORM_SHARE)
        fee = (nativeAmount * PLATFORM_SHARE) / 10000;
        
        // Los tokens se calculan basados en el total enviado (no en amountAfterFee)
        // Esto es consistente con buyTokens() que usa msg.value para calcular tokens
        tokensAmount = token.calculateTokensForWei(nativeAmount);
        
        return (tokensAmount, fee);
    }
    
    /**
     * @dev Calcula cuánta moneda nativa se recibiría por una cantidad de tokens
     * @param creatorToken Dirección del token del creador
     * @param tokenAmount Cantidad de tokens
     * @return nativeAmount Cantidad de moneda nativa que se recibiría
     * @return fee Fee de la plataforma
     */
    function calculateSellAmount(
        address creatorToken,
        uint256 tokenAmount
    ) external view returns (uint256 nativeAmount, uint256 fee) {
        require(tokenAmount > 0, "Amount must be greater than 0");
        
        CreatorToken token = CreatorToken(creatorToken);
        
        uint256 totalNative = token.calculateWeiForTokens(tokenAmount);
        fee = (totalNative * platformFee) / 10000;
        nativeAmount = totalNative - fee;
        
        return (nativeAmount, fee);
    }
    
    /**
     * @dev Actualiza el fee de la plataforma (solo owner)
     * @param newFee Nuevo fee en porcentaje (0-10%)
     */
    function setPlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "Fee too high (max 10% = 1000 basis points)");
        
        emit PlatformFeeUpdated(platformFee, newFee);
        platformFee = newFee;
    }
    
    /**
     * @dev Retira los fees acumulados (solo owner)
     * @param recipient Dirección que recibirá los fees
     */
    function withdrawFees(address payable recipient) external onlyOwner {
        require(recipient != address(0), "Invalid recipient");
        require(accumulatedFees > 0, "No fees to withdraw");
        
        uint256 amount = accumulatedFees;
        accumulatedFees = 0;
        
        (bool success, ) = recipient.call{value: amount}("");
        require(success, "Transfer failed");
        
        emit FeesWithdrawn(recipient, amount);
    }
    
    /**
     * @dev Permite al creador retirar su parte de la reserva de liquidez
     * El creador puede retirar hasta el monto disponible en creatorReserve
     * También reduce la reserva de liquidez del token correspondiente
     * @param amount Cantidad a retirar (0 = retirar todo)
     */
    function withdrawCreatorReserve(uint256 amount) external nonReentrant {
        require(creatorReserve[msg.sender] > 0, "No reserve available");
        
        // Obtener el token del creador
        address creatorToken = factory.getCreatorToken(msg.sender);
        require(creatorToken != address(0), "Creator has no token");
        
        uint256 availableReserve = creatorReserve[msg.sender];
        uint256 withdrawAmount = amount == 0 ? availableReserve : amount;
        
        require(withdrawAmount > 0, "Amount must be greater than 0");
        require(withdrawAmount <= availableReserve, "Insufficient reserve");
        require(address(this).balance >= withdrawAmount, "Insufficient contract balance");
        
        // Verificar que haya suficiente reserva de liquidez del token
        // El creador no puede retirar más de lo que hay en la reserva del token
        uint256 tokenReserve = tokenLiquidityReserve[creatorToken];
        if (withdrawAmount > tokenReserve) {
            withdrawAmount = tokenReserve;
        }
        
        // Reducir la reserva del creador
        creatorReserve[msg.sender] -= withdrawAmount;
        
        // Reducir la reserva de liquidez del token
        tokenLiquidityReserve[creatorToken] -= withdrawAmount;
        
        // Enviar ETH al creador
        (bool success, ) = payable(msg.sender).call{value: withdrawAmount}("");
        require(success, "Transfer failed");
        
        emit CreatorReserveWithdrawn(msg.sender, withdrawAmount);
    }
    
    /**
     * @dev Permite al contrato recibir moneda nativa
     */
    receive() external payable {
        // Permite agregar liquidez al contrato
    }
    
    /**
     * @dev Retira moneda nativa del contrato (solo owner, para emergencias)
     * @param recipient Dirección que recibirá los fondos
     * @param amount Cantidad a retirar
     */
    function emergencyWithdraw(address payable recipient, uint256 amount) external onlyOwner {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than 0");
        require(address(this).balance >= amount, "Insufficient balance");
        
        (bool success, ) = recipient.call{value: amount}("");
        require(success, "Transfer failed");
    }
    
    /**
     * @dev Obtiene el balance de moneda nativa del contrato
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Obtiene la reserva de liquidez disponible para un token
     * @param creatorToken Dirección del token
     * @return uint256 Cantidad de wei disponible en la reserva
     */
    function getTokenLiquidityReserve(address creatorToken) external view returns (uint256) {
        return tokenLiquidityReserve[creatorToken];
    }
    
    /**
     * @dev Obtiene la reserva disponible para retiro de un creador
     * @param creator Dirección del creador
     * @return uint256 Cantidad de wei disponible para retiro
     */
    function getCreatorReserve(address creator) external view returns (uint256) {
        return creatorReserve[creator];
    }
}

