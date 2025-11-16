// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./CreatorToken.sol";
import "./CreatorTokenFactory.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PredictionMarket
 * @dev Mercado de predicciones con sistema de cooldown y reportes
 * - Los creadores crean predicciones
 * - Los usuarios apuestan con tokens del creador
 * - Sistema de cooldown tras resolución
 * - Sistema de reportes con umbral dinámico
 * - Verificación humana antes de pago final
 */
contract PredictionMarket is Ownable, ReentrancyGuard {
    
    // Estados de una predicción
    enum PredictionStatus {
        Active,         // Aceptando apuestas
        Closed,         // Cerrada, no acepta más apuestas
        Cooldown,       // En período de cooldown para reportes
        UnderReview,    // Bajo revisión por reportes excesivos
        Confirmed,      // Confirmada por verificador, lista para pago
        Disputed,       // Disputada y revertida
        Cancelled       // Cancelada
    }
    
    // Estructura de una opción de apuesta
    struct BetOption {
        string description;
        uint256 totalAmount;     // Total apostado en esta opción
        uint256 totalBettors;    // Número de apostadores
    }
    
    // Estructura de una apuesta individual
    struct Bet {
        address bettor;
        uint256 optionIndex;
        uint256 amount;
        bool claimed;
    }
    
    // Estructura de una predicción
    struct Prediction {
        uint256 id;
        address creator;
        address creatorToken;
        string title;
        string description;
        BetOption[] options;
        uint256 createdAt;
        uint256 closesAt;
        uint256 resolvedAt;
        PredictionStatus status;
        uint256 winningOption;
        uint256 cooldownEndsAt;
        uint256 reportCount;
        uint256 totalPool;
    }
    
    // Configuración del sistema
    uint256 public cooldownDuration = 10 minutes;
    uint256 public reportThresholdPercentage = 7; // 7% de participantes
    uint256 public minReportsRequired = 5;
    
    // Referencia al factory
    CreatorTokenFactory public factory;
    
    // Storage
    mapping(uint256 => Prediction) public predictions;
    mapping(uint256 => mapping(address => Bet[])) public userBets; // predictionId => user => bets
    mapping(uint256 => mapping(address => bool)) public hasReported; // predictionId => user => hasReported
    
    uint256 public nextPredictionId = 1;
    
    // Eventos
    event PredictionCreated(
        uint256 indexed predictionId,
        address indexed creator,
        address indexed creatorToken,
        string title,
        uint256 closesAt
    );
    
    event BetPlaced(
        uint256 indexed predictionId,
        address indexed bettor,
        uint256 optionIndex,
        uint256 amount
    );
    
    event PredictionClosed(uint256 indexed predictionId, uint256 timestamp);
    
    event PredictionResolved(
        uint256 indexed predictionId,
        uint256 winningOption,
        PredictionStatus status,
        uint256 timestamp
    );
    
    event CooldownStarted(uint256 indexed predictionId, uint256 endsAt);
    
    event OutcomeReported(
        uint256 indexed predictionId,
        address indexed reporter,
        uint256 reportCount,
        uint256 timestamp
    );
    
    event UnderReview(uint256 indexed predictionId, uint256 timestamp);
    
    event OutcomeConfirmed(uint256 indexed predictionId, uint256 timestamp);
    
    event OutcomeDisputed(uint256 indexed predictionId, string reason, uint256 timestamp);
    
    event RewardClaimed(
        uint256 indexed predictionId,
        address indexed winner,
        uint256 amount
    );
    
    event ConfigUpdated(string parameter, uint256 oldValue, uint256 newValue);
    
    constructor(address factoryAddress) Ownable(msg.sender) {
        require(factoryAddress != address(0), "Invalid factory address");
        factory = CreatorTokenFactory(factoryAddress);
    }
    
    /**
     * @dev Crea una nueva predicción
     * @param creatorToken Token del creador a usar para apuestas
     * @param title Título de la predicción
     * @param description Descripción
     * @param optionDescriptions Descripciones de las opciones (mínimo 2)
     * @param duration Duración en segundos hasta el cierre
     */
    function createPrediction(
        address creatorToken,
        string memory title,
        string memory description,
        string[] memory optionDescriptions,
        uint256 duration
    ) external returns (uint256) {
        require(optionDescriptions.length >= 2, "Need at least 2 options");
        require(optionDescriptions.length <= 10, "Too many options");
        // duration = 0 significa predicción indefinida (sin tiempo límite)
        require(duration == 0 || (duration >= 1 minutes && duration <= 365 days), "Invalid duration");
        
        // Verificar que el creador tenga un token y no esté baneado
        require(factory.isCreatorActive(msg.sender), "Creator is not active or banned");
        require(
            factory.getCreatorToken(msg.sender) == creatorToken,
            "Token does not belong to creator"
        );
        
        uint256 predictionId = nextPredictionId++;
        Prediction storage pred = predictions[predictionId];
        
        pred.id = predictionId;
        pred.creator = msg.sender;
        pred.creatorToken = creatorToken;
        pred.title = title;
        pred.description = description;
        pred.createdAt = block.timestamp;
        // Si duration = 0, la predicción es indefinida (sin tiempo límite)
        pred.closesAt = duration == 0 ? type(uint256).max : block.timestamp + duration;
        pred.status = PredictionStatus.Active;
        
        // Crear las opciones
        for (uint256 i = 0; i < optionDescriptions.length; i++) {
            pred.options.push(BetOption({
                description: optionDescriptions[i],
                totalAmount: 0,
                totalBettors: 0
            }));
        }
        
        emit PredictionCreated(
            predictionId,
            msg.sender,
            creatorToken,
            title,
            pred.closesAt
        );
        
        return predictionId;
    }
    
    /**
     * @dev Realiza una apuesta en una predicción
     * @param predictionId ID de la predicción
     * @param optionIndex Índice de la opción elegida
     * @param amount Cantidad de tokens a apostar
     */
    function placeBet(
        uint256 predictionId,
        uint256 optionIndex,
        uint256 amount
    ) external nonReentrant {
        Prediction storage pred = predictions[predictionId];
        
        require(pred.id != 0, "Prediction does not exist");
        require(pred.status == PredictionStatus.Active, "Prediction not active");
        // Validar tiempo: si closesAt es max, es indefinida; si no, verificar que no haya expirado
        require(pred.closesAt == type(uint256).max || block.timestamp < pred.closesAt, "Prediction closed");
        require(optionIndex < pred.options.length, "Invalid option");
        require(amount > 0, "Amount must be greater than 0");
        
        // El creador NO puede apostar en su propia predicción
        require(msg.sender != pred.creator, "Creator cannot bet on own prediction");
        
        // Verificar que el creador no esté baneado
        require(factory.isCreatorActive(pred.creator), "Creator is banned");
        
        // Transferir tokens del apostador al contrato
        CreatorToken token = CreatorToken(pred.creatorToken);
        require(
            token.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );
        
        // Registrar la apuesta
        userBets[predictionId][msg.sender].push(Bet({
            bettor: msg.sender,
            optionIndex: optionIndex,
            amount: amount,
            claimed: false
        }));
        
        // Actualizar estadísticas
        pred.options[optionIndex].totalAmount += amount;
        pred.options[optionIndex].totalBettors += 1;
        pred.totalPool += amount;
        
        emit BetPlaced(predictionId, msg.sender, optionIndex, amount);
    }
    
    /**
     * @dev Cierra una predicción (solo el creador o cuando expire)
     * @param predictionId ID de la predicción
     */
    function closePrediction(uint256 predictionId) external {
        Prediction storage pred = predictions[predictionId];
        
        require(pred.id != 0, "Prediction does not exist");
        require(pred.status == PredictionStatus.Active, "Prediction not active");
        // El creador puede cerrar manualmente, o se cierra automáticamente cuando expira
        require(
            msg.sender == pred.creator || (pred.closesAt != type(uint256).max && block.timestamp >= pred.closesAt),
            "Not authorized or not expired"
        );
        
        pred.status = PredictionStatus.Closed;
        
        emit PredictionClosed(predictionId, block.timestamp);
    }
    
    /**
     * @dev Resuelve una predicción declarando el ganador (solo el creador)
     * Inicia el período de cooldown
     * @param predictionId ID de la predicción
     * @param winningOptionIndex Índice de la opción ganadora
     */
    function resolvePrediction(
        uint256 predictionId,
        uint256 winningOptionIndex
    ) external {
        Prediction storage pred = predictions[predictionId];
        
        require(pred.id != 0, "Prediction does not exist");
        require(msg.sender == pred.creator, "Only creator can resolve");
        require(pred.status == PredictionStatus.Closed, "Prediction must be closed");
        require(winningOptionIndex < pred.options.length, "Invalid option");
        
        pred.winningOption = winningOptionIndex;
        pred.status = PredictionStatus.Cooldown;
        pred.resolvedAt = block.timestamp;
        pred.cooldownEndsAt = block.timestamp + cooldownDuration;
        
        emit PredictionResolved(predictionId, winningOptionIndex, PredictionStatus.Cooldown, block.timestamp);
        emit CooldownStarted(predictionId, pred.cooldownEndsAt);
    }
    
    /**
     * @dev Reporta el resultado de una predicción durante el cooldown
     * @param predictionId ID de la predicción
     */
    function reportOutcome(uint256 predictionId) external {
        Prediction storage pred = predictions[predictionId];
        
        require(pred.id != 0, "Prediction does not exist");
        require(pred.status == PredictionStatus.Cooldown, "Not in cooldown period");
        require(block.timestamp < pred.cooldownEndsAt, "Cooldown period ended");
        require(!hasReported[predictionId][msg.sender], "Already reported");
        require(userBets[predictionId][msg.sender].length > 0, "Must have participated");
        
        hasReported[predictionId][msg.sender] = true;
        pred.reportCount++;
        
        emit OutcomeReported(predictionId, msg.sender, pred.reportCount, block.timestamp);
        
        // Verificar si se alcanzó el umbral
        uint256 totalParticipants = _getTotalParticipants(predictionId);
        uint256 threshold = _calculateReportThreshold(totalParticipants);
        
        if (pred.reportCount >= threshold) {
            pred.status = PredictionStatus.UnderReview;
            emit UnderReview(predictionId, block.timestamp);
        }
    }
    
    /**
     * @dev Confirma automáticamente una predicción si el cooldown terminó
     * Cualquiera puede llamar esta función para confirmar automáticamente
     * @param predictionId ID de la predicción
     */
    function autoConfirmOutcome(uint256 predictionId) external {
        Prediction storage pred = predictions[predictionId];
        
        require(pred.id != 0, "Prediction does not exist");
        require(pred.status == PredictionStatus.Cooldown, "Not in cooldown");
        require(block.timestamp >= pred.cooldownEndsAt, "Cooldown not finished");
        
        pred.status = PredictionStatus.Confirmed;
        
        emit OutcomeConfirmed(predictionId, block.timestamp);
    }
    
    /**
     * @dev Confirma el resultado tras revisión humana (solo owner)
     * @param predictionId ID de la predicción
     */
    function confirmOutcome(uint256 predictionId) external onlyOwner {
        Prediction storage pred = predictions[predictionId];
        
        require(pred.id != 0, "Prediction does not exist");
        require(
            pred.status == PredictionStatus.Cooldown || pred.status == PredictionStatus.UnderReview,
            "Invalid status for confirmation"
        );
        
        pred.status = PredictionStatus.Confirmed;
        
        emit OutcomeConfirmed(predictionId, block.timestamp);
    }
    
    /**
     * @dev Marca el resultado como fraudulento y procesa reembolsos (solo owner)
     * @param predictionId ID de la predicción
     * @param reason Razón de la disputa
     */
    function flagFraud(uint256 predictionId, string memory reason) external onlyOwner {
        Prediction storage pred = predictions[predictionId];
        
        require(pred.id != 0, "Prediction does not exist");
        require(
            pred.status == PredictionStatus.Cooldown || pred.status == PredictionStatus.UnderReview,
            "Invalid status"
        );
        
        pred.status = PredictionStatus.Disputed;
        
        // Banear al creador
        factory.banCreator(pred.creator, reason);
        
        emit OutcomeDisputed(predictionId, reason, block.timestamp);
    }
    
    /**
     * @dev Reclama recompensas si ganaste
     * @param predictionId ID de la predicción
     */
    function claimReward(uint256 predictionId) external nonReentrant {
        Prediction storage pred = predictions[predictionId];
        
        require(pred.id != 0, "Prediction does not exist");
        
        // Si está en Cooldown y el cooldown terminó, confirmar automáticamente
        if (pred.status == PredictionStatus.Cooldown && block.timestamp >= pred.cooldownEndsAt) {
            pred.status = PredictionStatus.Confirmed;
            emit OutcomeConfirmed(predictionId, block.timestamp);
        }
        
        require(pred.status == PredictionStatus.Confirmed, "Prediction not confirmed");
        
        Bet[] storage bets = userBets[predictionId][msg.sender];
        require(bets.length > 0, "No bets found");
        
        uint256 totalReward = 0;
        
        for (uint256 i = 0; i < bets.length; i++) {
            if (!bets[i].claimed && bets[i].optionIndex == pred.winningOption) {
                bets[i].claimed = true;
                totalReward += _calculateReward(predictionId, bets[i].amount);
            }
        }
        
        require(totalReward > 0, "No rewards to claim");
        
        // Transferir recompensa
        CreatorToken token = CreatorToken(pred.creatorToken);
        require(token.transfer(msg.sender, totalReward), "Transfer failed");
        
        emit RewardClaimed(predictionId, msg.sender, totalReward);
    }
    
    /**
     * @dev Reclama reembolso en caso de disputa
     * @param predictionId ID de la predicción
     */
    function claimRefund(uint256 predictionId) external nonReentrant {
        Prediction storage pred = predictions[predictionId];
        
        require(pred.id != 0, "Prediction does not exist");
        require(pred.status == PredictionStatus.Disputed, "Not disputed");
        
        Bet[] storage bets = userBets[predictionId][msg.sender];
        require(bets.length > 0, "No bets found");
        
        uint256 totalRefund = 0;
        
        for (uint256 i = 0; i < bets.length; i++) {
            if (!bets[i].claimed) {
                bets[i].claimed = true;
                totalRefund += bets[i].amount;
            }
        }
        
        require(totalRefund > 0, "No refund to claim");
        
        // Transferir reembolso
        CreatorToken token = CreatorToken(pred.creatorToken);
        require(token.transfer(msg.sender, totalRefund), "Transfer failed");
        
        emit RewardClaimed(predictionId, msg.sender, totalRefund);
    }
    
    /**
     * @dev Calcula la recompensa para una apuesta ganadora
     */
    function _calculateReward(uint256 predictionId, uint256 betAmount) internal view returns (uint256) {
        Prediction storage pred = predictions[predictionId];
        
        uint256 winningPool = pred.options[pred.winningOption].totalAmount;
        uint256 losingPool = pred.totalPool - winningPool;
        
        if (losingPool == 0) {
            // Si no hubo perdedores, devolver la apuesta
            return betAmount;
        }
        
        // Los ganadores reciben TODO el pool de perdedores proporcionalmente
        // Recompensa = apuesta + proporción del pool de perdedores
        uint256 reward = betAmount + ((betAmount * losingPool) / winningPool);
        
        return reward;
    }
    
    /**
     * @dev Obtiene el total de participantes únicos
     */
    function _getTotalParticipants(uint256 predictionId) internal view returns (uint256) {
        Prediction storage pred = predictions[predictionId];
        uint256 total = 0;
        
        for (uint256 i = 0; i < pred.options.length; i++) {
            total += pred.options[i].totalBettors;
        }
        
        return total;
    }
    
    /**
     * @dev Calcula el umbral de reportes necesarios
     */
    function _calculateReportThreshold(uint256 totalParticipants) internal view returns (uint256) {
        uint256 percentageThreshold = (totalParticipants * reportThresholdPercentage) / 100;
        
        if (percentageThreshold < minReportsRequired) {
            return minReportsRequired;
        }
        
        return percentageThreshold;
    }
    
    /**
     * @dev Configuración del cooldown (solo owner)
     */
    function setCooldownDuration(uint256 newDuration) external onlyOwner {
        require(newDuration >= 1 minutes && newDuration <= 1 days, "Invalid duration");
        emit ConfigUpdated("cooldownDuration", cooldownDuration, newDuration);
        cooldownDuration = newDuration;
    }
    
    /**
     * @dev Configuración del umbral de reportes (solo owner)
     */
    function setReportThreshold(uint256 newPercentage, uint256 newMinReports) external onlyOwner {
        require(newPercentage > 0 && newPercentage <= 50, "Invalid percentage");
        require(newMinReports > 0, "Invalid min reports");
        
        emit ConfigUpdated("reportThresholdPercentage", reportThresholdPercentage, newPercentage);
        emit ConfigUpdated("minReportsRequired", minReportsRequired, newMinReports);
        
        reportThresholdPercentage = newPercentage;
        minReportsRequired = newMinReports;
    }
    
    /**
     * @dev Obtiene información de una predicción
     */
    function getPredictionInfo(uint256 predictionId) external view returns (
        address creator,
        address creatorToken,
        string memory title,
        PredictionStatus status,
        uint256 totalPool,
        uint256 closesAt,
        uint256 optionsCount
    ) {
        Prediction storage pred = predictions[predictionId];
        require(pred.id != 0, "Prediction does not exist");
        
        return (
            pred.creator,
            pred.creatorToken,
            pred.title,
            pred.status,
            pred.totalPool,
            pred.closesAt,
            pred.options.length
        );
    }
    
    /**
     * @dev Obtiene las apuestas de un usuario en una predicción
     */
    function getUserBets(uint256 predictionId, address user) external view returns (Bet[] memory) {
        return userBets[predictionId][user];
    }
    
    /**
     * @dev Obtiene una opción de apuesta
     */
    function getBetOption(uint256 predictionId, uint256 optionIndex) external view returns (
        string memory description,
        uint256 totalAmount,
        uint256 totalBettors
    ) {
        Prediction storage pred = predictions[predictionId];
        require(pred.id != 0, "Prediction does not exist");
        require(optionIndex < pred.options.length, "Invalid option");
        
        BetOption storage option = pred.options[optionIndex];
        return (option.description, option.totalAmount, option.totalBettors);
    }
}

