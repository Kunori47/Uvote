// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CreatorToken
 * @dev Token ERC20 para cada creador (ej: "Ibaisitos")
 * - Tiene un precio fijo en la moneda nativa (DEV/GLMR)
 * - El creador puede cambiar el precio (con reconversión)
 * - Solo contratos autorizados pueden hacer mint/burn
 */
contract CreatorToken is ERC20, Ownable {
    
    // Precio del token en wei (1 token = X wei de DEV/GLMR)
    uint256 public tokenPrice;
    
    // Direcciones autorizadas para hacer mint/burn (PredictionMarket, Exchange)
    mapping(address => bool) public authorizedMinters;
    
    // Control de cambio de precio
    uint256 public lastPriceUpdate;
    uint256 public priceUpdateInterval; // Intervalo mínimo entre cambios de precio (en segundos)
    
    // Evento cuando cambia el precio
    event PriceUpdated(uint256 oldPrice, uint256 newPrice, uint256 timestamp);
    
    // Evento cuando se autoriza/desautoriza un minter
    event MinterAuthorized(address indexed minter, bool authorized);
    
    // Evento cuando se cambia el intervalo de actualización de precio
    event PriceUpdateIntervalChanged(uint256 oldInterval, uint256 newInterval);
    
    /**
     * @dev Constructor
     * @param name Nombre del token (ej: "Ibaisitos")
     * @param symbol Símbolo del token (ej: "IBAI")
     * @param initialPrice Precio inicial en wei
     * @param creator Dirección del creador (será el owner)
     * @param updateInterval Intervalo mínimo entre cambios de precio en segundos (ej: 30 días = 2592000)
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialPrice,
        address creator,
        uint256 updateInterval
    ) ERC20(name, symbol) Ownable(creator) {
        require(initialPrice > 0, "Price must be greater than 0");
        require(creator != address(0), "Invalid creator address");
        require(updateInterval > 0, "Update interval must be greater than 0");
        
        tokenPrice = initialPrice;
        lastPriceUpdate = block.timestamp;
        priceUpdateInterval = updateInterval;
    }
    
    /**
     * @dev Autoriza o desautoriza una dirección para hacer mint/burn
     * Solo el creador puede llamar esta función
     */
    function setAuthorizedMinter(address minter, bool authorized) external onlyOwner {
        require(minter != address(0), "Invalid minter address");
        authorizedMinters[minter] = authorized;
        emit MinterAuthorized(minter, authorized);
    }
    
    /**
     * @dev Cambia el precio del token
     * Solo puede llamarse después de que haya transcurrido el intervalo mínimo
     * @param newPrice Nuevo precio en wei
     */
    function updatePrice(uint256 newPrice) external onlyOwner {
        require(newPrice > 0, "Price must be greater than 0");
        require(newPrice != tokenPrice, "Price is the same");
        require(
            block.timestamp >= lastPriceUpdate + priceUpdateInterval,
            "Price update cooldown not elapsed"
        );
        
        uint256 oldPrice = tokenPrice;
        tokenPrice = newPrice;
        lastPriceUpdate = block.timestamp;
        
        emit PriceUpdated(oldPrice, newPrice, block.timestamp);
    }
    
    /**
     * @dev Cambia el intervalo mínimo entre actualizaciones de precio
     * Solo el creador puede llamar esta función
     * @param newInterval Nuevo intervalo en segundos
     */
    function setPriceUpdateInterval(uint256 newInterval) external onlyOwner {
        require(newInterval > 0, "Interval must be greater than 0");
        require(newInterval != priceUpdateInterval, "Interval is the same");
        
        uint256 oldInterval = priceUpdateInterval;
        priceUpdateInterval = newInterval;
        
        emit PriceUpdateIntervalChanged(oldInterval, newInterval);
    }
    
    /**
     * @dev Verifica si el creador puede actualizar el precio
     * @return bool true si puede actualizar, false si está en cooldown
     * @return uint256 tiempo restante en segundos hasta poder actualizar (0 si ya puede)
     */
    function canUpdatePrice() external view returns (bool, uint256) {
        uint256 nextUpdateTime = lastPriceUpdate + priceUpdateInterval;
        
        if (block.timestamp >= nextUpdateTime) {
            return (true, 0);
        } else {
            return (false, nextUpdateTime - block.timestamp);
        }
    }
    
    /**
     * @dev Calcula cuántos tokens se obtienen por una cantidad de wei
     * @param weiAmount Cantidad de wei
     * @return Cantidad de tokens (en unidades de token, no decimales)
     */
    function calculateTokensForWei(uint256 weiAmount) public view returns (uint256) {
        require(weiAmount > 0, "Amount must be greater than 0");
        // weiAmount / tokenPrice da la cantidad de tokens
        // Multiplicamos por 10**decimals() para obtener la cantidad con decimales
        return (weiAmount * 10**decimals()) / tokenPrice;
    }
    
    /**
     * @dev Calcula cuántos wei se necesitan para una cantidad de tokens
     * @param tokenAmount Cantidad de tokens (en unidades completas con decimales)
     * @return Cantidad de wei necesaria
     */
    function calculateWeiForTokens(uint256 tokenAmount) public view returns (uint256) {
        require(tokenAmount > 0, "Amount must be greater than 0");
        // tokenAmount * tokenPrice / 10**decimals() da los wei necesarios
        return (tokenAmount * tokenPrice) / 10**decimals();
    }
    
    /**
     * @dev Mintea tokens a una dirección
     * Solo contratos autorizados pueden llamar esta función
     */
    function mint(address to, uint256 amount) external {
        require(authorizedMinters[msg.sender], "Not authorized to mint");
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Amount must be greater than 0");
        
        _mint(to, amount);
    }
    
    /**
     * @dev Quema tokens de una dirección
     * Solo contratos autorizados pueden llamar esta función
     */
    function burn(address from, uint256 amount) external {
        require(authorizedMinters[msg.sender], "Not authorized to burn");
        require(from != address(0), "Cannot burn from zero address");
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(from) >= amount, "Insufficient balance");
        
        _burn(from, amount);
    }
    
    /**
     * @dev Información del token
     */
    function getTokenInfo() external view returns (
        string memory name_,
        string memory symbol_,
        uint256 totalSupply_,
        uint256 price_,
        address creator_
    ) {
        return (
            name(),
            symbol(),
            totalSupply(),
            tokenPrice,
            owner()
        );
    }
}


