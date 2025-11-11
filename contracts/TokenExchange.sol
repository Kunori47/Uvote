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
    
    // Fee de la plataforma en % (ej: 1 = 1%)
    uint256 public platformFee = 1;
    
    // Acumulado de fees para retirar
    uint256 public accumulatedFees;
    
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
        
        // Calcular fee de la plataforma
        uint256 fee = (msg.value * platformFee) / 100;
        uint256 amountAfterFee = msg.value - fee;
        
        // Calcular cantidad de tokens a recibir
        uint256 tokensToMint = token.calculateTokensForWei(amountAfterFee);
        require(tokensToMint > 0, "Amount too small");
        
        // Acumular fee
        accumulatedFees += fee;
        
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
        uint256 fee = (nativeAmount * platformFee) / 100;
        uint256 amountAfterFee = nativeAmount - fee;
        
        // Verificar que el contrato tenga suficiente balance
        require(address(this).balance >= amountAfterFee, "Insufficient contract balance");
        
        // Transferir tokens del vendedor al contrato
        require(
            token.transferFrom(msg.sender, address(this), tokenAmount),
            "Transfer failed"
        );
        
        // Quemar los tokens
        token.burn(address(this), tokenAmount);
        
        // Acumular fee
        accumulatedFees += fee;
        
        // Enviar moneda nativa al vendedor
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
        
        fee = (nativeAmount * platformFee) / 100;
        uint256 amountAfterFee = nativeAmount - fee;
        tokensAmount = token.calculateTokensForWei(amountAfterFee);
        
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
        fee = (totalNative * platformFee) / 100;
        nativeAmount = totalNative - fee;
        
        return (nativeAmount, fee);
    }
    
    /**
     * @dev Actualiza el fee de la plataforma (solo owner)
     * @param newFee Nuevo fee en porcentaje (0-10%)
     */
    function setPlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= 10, "Fee too high (max 10%)");
        
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
}

