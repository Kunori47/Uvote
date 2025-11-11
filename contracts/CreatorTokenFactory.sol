// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./CreatorToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CreatorTokenFactory
 * @dev Fábrica para crear y gestionar tokens de creadores
 * - Despliega nuevos CreatorTokens
 * - Mantiene registro de creadores y sus tokens
 * - Gestiona el estado de los creadores (activo/baneado)
 * - Coordina permisos con otros contratos (PredictionMarket, Exchange)
 */
contract CreatorTokenFactory is Ownable {
    
    // Estructura para la información del creador
    struct CreatorInfo {
        address tokenAddress;
        address creatorAddress;
        bool isActive;
        bool isBanned;
        uint256 createdAt;
        uint256 bannedAt;
        string reason; // Razón del baneo si aplica
    }
    
    // Mapeo de creador a su información
    mapping(address => CreatorInfo) public creators;
    
    // Lista de todos los tokens creados
    address[] public allTokens;
    
    // Mapeo de dirección de token a creador
    mapping(address => address) public tokenToCreator;
    
    // Contratos autorizados para operaciones especiales (PredictionMarket, Exchange)
    mapping(address => bool) public authorizedContracts;
    
    // Configuración por defecto para nuevos tokens
    uint256 public defaultPriceUpdateInterval = 30 days; // 30 días por defecto
    
    // Eventos
    event CreatorTokenCreated(
        address indexed creator,
        address indexed tokenAddress,
        string name,
        string symbol,
        uint256 initialPrice,
        uint256 timestamp
    );
    
    event CreatorBanned(
        address indexed creator,
        address indexed tokenAddress,
        string reason,
        uint256 timestamp
    );
    
    event CreatorUnbanned(
        address indexed creator,
        address indexed tokenAddress,
        uint256 timestamp
    );
    
    event ContractAuthorized(address indexed contractAddress, bool authorized);
    
    event DefaultPriceUpdateIntervalChanged(uint256 oldInterval, uint256 newInterval);
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Crea un nuevo token para un creador
     * @param name Nombre del token
     * @param symbol Símbolo del token
     * @param initialPrice Precio inicial en wei
     * @return tokenAddress Dirección del token creado
     */
    function createCreatorToken(
        string memory name,
        string memory symbol,
        uint256 initialPrice
    ) external returns (address) {
        require(!creators[msg.sender].isActive, "Creator already has a token");
        require(initialPrice > 0, "Initial price must be greater than 0");
        
        // Crear el nuevo token
        CreatorToken newToken = new CreatorToken(
            name,
            symbol,
            initialPrice,
            msg.sender,
            defaultPriceUpdateInterval
        );
        
        address tokenAddress = address(newToken);
        
        // Registrar el creador
        creators[msg.sender] = CreatorInfo({
            tokenAddress: tokenAddress,
            creatorAddress: msg.sender,
            isActive: true,
            isBanned: false,
            createdAt: block.timestamp,
            bannedAt: 0,
            reason: ""
        });
        
        // Añadir a la lista de tokens
        allTokens.push(tokenAddress);
        tokenToCreator[tokenAddress] = msg.sender;
        
        // Autorizar contratos autorizados para mint/burn en el nuevo token
        _authorizeContractsForToken(tokenAddress);
        
        emit CreatorTokenCreated(
            msg.sender,
            tokenAddress,
            name,
            symbol,
            initialPrice,
            block.timestamp
        );
        
        return tokenAddress;
    }
    
    /**
     * @dev Autoriza contratos previamente marcados como autorizados en el nuevo token
     * @param tokenAddress Dirección del token
     */
    function _authorizeContractsForToken(address tokenAddress) internal {
        CreatorToken token = CreatorToken(tokenAddress);
        
        // Recorremos los contratos autorizados (en una implementación real,
        // deberías mantener un array de direcciones autorizadas)
        // Por ahora, esto se hará manualmente después del deploy
    }
    
    /**
     * @dev Banea a un creador (solo el owner del factory puede hacerlo)
     * @param creator Dirección del creador a banear
     * @param reason Razón del baneo
     */
    function banCreator(address creator, string memory reason) external onlyOwner {
        require(creators[creator].isActive, "Creator does not exist");
        require(!creators[creator].isBanned, "Creator is already banned");
        
        creators[creator].isBanned = true;
        creators[creator].bannedAt = block.timestamp;
        creators[creator].reason = reason;
        
        emit CreatorBanned(
            creator,
            creators[creator].tokenAddress,
            reason,
            block.timestamp
        );
    }
    
    /**
     * @dev Desbanea a un creador
     * @param creator Dirección del creador a desbanear
     */
    function unbanCreator(address creator) external onlyOwner {
        require(creators[creator].isActive, "Creator does not exist");
        require(creators[creator].isBanned, "Creator is not banned");
        
        creators[creator].isBanned = false;
        creators[creator].bannedAt = 0;
        creators[creator].reason = "";
        
        emit CreatorUnbanned(
            creator,
            creators[creator].tokenAddress,
            block.timestamp
        );
    }
    
    /**
     * @dev Autoriza o desautoriza un contrato para operaciones especiales
     * @param contractAddress Dirección del contrato
     * @param authorized true para autorizar, false para desautorizar
     */
    function setAuthorizedContract(address contractAddress, bool authorized) external onlyOwner {
        require(contractAddress != address(0), "Invalid contract address");
        authorizedContracts[contractAddress] = authorized;
        emit ContractAuthorized(contractAddress, authorized);
    }
    
    /**
     * @dev Configura el intervalo por defecto para actualizaciones de precio
     * @param newInterval Nuevo intervalo en segundos
     */
    function setDefaultPriceUpdateInterval(uint256 newInterval) external onlyOwner {
        require(newInterval > 0, "Interval must be greater than 0");
        
        uint256 oldInterval = defaultPriceUpdateInterval;
        defaultPriceUpdateInterval = newInterval;
        
        emit DefaultPriceUpdateIntervalChanged(oldInterval, newInterval);
    }
    
    /**
     * @dev Verifica si un creador está activo y no baneado
     * @param creator Dirección del creador
     * @return bool true si está activo y no baneado
     */
    function isCreatorActive(address creator) external view returns (bool) {
        return creators[creator].isActive && !creators[creator].isBanned;
    }
    
    /**
     * @dev Obtiene información completa de un creador
     * @param creator Dirección del creador
     */
    function getCreatorInfo(address creator) external view returns (
        address tokenAddress,
        bool isActive,
        bool isBanned,
        uint256 createdAt,
        uint256 bannedAt,
        string memory reason
    ) {
        CreatorInfo memory info = creators[creator];
        return (
            info.tokenAddress,
            info.isActive,
            info.isBanned,
            info.createdAt,
            info.bannedAt,
            info.reason
        );
    }
    
    /**
     * @dev Obtiene el token de un creador
     * @param creator Dirección del creador
     * @return address Dirección del token
     */
    function getCreatorToken(address creator) external view returns (address) {
        require(creators[creator].isActive, "Creator does not exist");
        return creators[creator].tokenAddress;
    }
    
    /**
     * @dev Obtiene el creador de un token
     * @param tokenAddress Dirección del token
     * @return address Dirección del creador
     */
    function getTokenCreator(address tokenAddress) external view returns (address) {
        return tokenToCreator[tokenAddress];
    }
    
    /**
     * @dev Obtiene el número total de tokens creados
     * @return uint256 Cantidad de tokens
     */
    function getTotalTokens() external view returns (uint256) {
        return allTokens.length;
    }
    
    /**
     * @dev Obtiene todos los tokens creados (paginado para evitar gas excesivo)
     * @param offset Índice inicial
     * @param limit Cantidad máxima a retornar
     * @return address[] Array de direcciones de tokens
     */
    function getAllTokens(uint256 offset, uint256 limit) external view returns (address[] memory) {
        require(offset < allTokens.length, "Offset out of bounds");
        
        uint256 end = offset + limit;
        if (end > allTokens.length) {
            end = allTokens.length;
        }
        
        uint256 size = end - offset;
        address[] memory result = new address[](size);
        
        for (uint256 i = 0; i < size; i++) {
            result[i] = allTokens[offset + i];
        }
        
        return result;
    }
}

