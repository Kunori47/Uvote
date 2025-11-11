# Uvote - Guía del Backend (Smart Contracts)

## 📋 Arquitectura del Sistema

Sistema de predicciones descentralizado sobre Moonbeam/Polkadot donde cada creador tiene su propia moneda (token ERC20) que los usuarios compran para participar en predicciones.

### Contratos Principales

```
CreatorTokenFactory (Hub Central)
    ↓
    ├─→ CreatorToken (ERC20 individual por creador)
    ├─→ PredictionMarket (Gestión de predicciones)
    └─→ TokenExchange (Compra/Venta de tokens)
```

---

## 🔧 Contratos

### 1. CreatorToken.sol
**Token ERC20 individual para cada creador (ej: "Ibaisitos")**

**Características:**
- Precio fijo en DEV/GLMR establecido por el creador
- Restricción de cambio de precio (1 vez cada X días, configurable)
- Solo contratos autorizados pueden mintear/quemar
- Helpers para calcular conversiones

**Funciones principales:**
```solidity
// Cambiar precio (con cooldown)
updatePrice(uint256 newPrice)

// Configurar intervalo de actualización
setPriceUpdateInterval(uint256 newInterval)

// Verificar si puede actualizar precio
canUpdatePrice() returns (bool, uint256)

// Calcular conversiones
calculateTokensForWei(uint256 weiAmount) returns (uint256)
calculateWeiForTokens(uint256 tokenAmount) returns (uint256)

// Mintear/Quemar (solo autorizados)
mint(address to, uint256 amount)
burn(address from, uint256 amount)
```

---

### 2. CreatorTokenFactory.sol
**Fábrica y registro central de tokens de creadores**

**Características:**
- Despliega nuevos tokens de creadores
- Mantiene registro de creadores (activos/baneados)
- Gestiona permisos para contratos del sistema
- Control de acceso centralizado

**Funciones principales:**
```solidity
// Crear token de creador
createCreatorToken(string name, string symbol, uint256 initialPrice) returns (address)

// Gestión de creadores
banCreator(address creator, string reason)
unbanCreator(address creator)
isCreatorActive(address creator) returns (bool)

// Configuración
setAuthorizedContract(address contractAddress, bool authorized)
setDefaultPriceUpdateInterval(uint256 newInterval)

// Consultas
getCreatorToken(address creator) returns (address)
getTokenCreator(address tokenAddress) returns (address)
getAllTokens(uint256 offset, uint256 limit) returns (address[])
```

---

### 3. PredictionMarket.sol
**Sistema de predicciones con cooldown y reportes**

**Características:**
- Creación de predicciones por creadores
- Sistema de apuestas con tokens del creador
- **Cooldown de 10 minutos** tras resolución
- **Sistema de reportes** con umbral dinámico (7% de participantes, mín. 5)
- **Verificación humana** antes de pago final
- Reembolsos automáticos en caso de fraude
- Cálculo de recompensas proporcional

**Estados de una predicción:**
```
Active → Closed → Cooldown → [UnderReview] → Confirmed
                                    ↓
                                Disputed (reembolso)
```

**Funciones principales:**
```solidity
// Crear predicción
createPrediction(
    address creatorToken,
    string title,
    string description,
    string[] optionDescriptions,
    uint256 duration,
    uint256 creatorFee
) returns (uint256)

// Apostar
placeBet(uint256 predictionId, uint256 optionIndex, uint256 amount)

// Cerrar predicción
closePrediction(uint256 predictionId)

// Resolver (creador)
resolvePrediction(uint256 predictionId, uint256 winningOptionIndex)

// Reportar durante cooldown
reportOutcome(uint256 predictionId)

// Verificación humana (admin)
confirmOutcome(uint256 predictionId)
flagFraud(uint256 predictionId, string reason)

// Reclamar
claimReward(uint256 predictionId)
claimRefund(uint256 predictionId)

// Configuración (admin)
setCooldownDuration(uint256 newDuration)
setReportThreshold(uint256 newPercentage, uint256 newMinReports)
```

---

### 4. TokenExchange.sol
**Exchange para comprar/vender tokens de creadores**

**Características:**
- Compra de tokens con DEV/GLMR (mintea nuevos)
- Venta de tokens por DEV/GLMR (quema tokens)
- Fee de plataforma (1% por defecto)
- Verifica que el creador no esté baneado
- Liquidez proporcionada por el contrato

**Funciones principales:**
```solidity
// Comprar tokens con DEV/GLMR
buyTokens(address creatorToken) payable

// Vender tokens por DEV/GLMR
sellTokens(address creatorToken, uint256 tokenAmount)

// Calcular precios
calculateBuyAmount(address creatorToken, uint256 nativeAmount) returns (uint256, uint256)
calculateSellAmount(address creatorToken, uint256 tokenAmount) returns (uint256, uint256)

// Administración
setPlatformFee(uint256 newFee)
withdrawFees(address payable recipient)
emergencyWithdraw(address payable recipient, uint256 amount)
```

---

## 🚀 Despliegue

### 1. Compilar contratos
```bash
npm run compile
```

### 2. Desplegar en red local
```bash
npx hardhat ignition deploy scripts/deploy-system.ts
```

### 3. Desplegar en Moonbase (testnet)
```bash
npx hardhat ignition deploy scripts/deploy-system.ts --network moonbase
```

### 4. Configurar permisos
Después del deploy, actualizar las direcciones en `scripts/setup-permissions.ts` y ejecutar:
```bash
npx hardhat run scripts/setup-permissions.ts --network <network>
```

---

## 🔄 Flujo Completo del Sistema

### 1. Creador registra su token
```javascript
// Creador llama a Factory
factory.createCreatorToken(
  "Ibaisitos",           // nombre
  "IBAI",                // símbolo
  ethers.parseEther("0.01"), // precio: 0.01 DEV por token
);
```

### 2. Usuario compra tokens del creador
```javascript
// Usuario compra con DEV/GLMR
tokenExchange.buyTokens(ibaiTokenAddress, {
  value: ethers.parseEther("1") // 1 DEV
});
// Recibe ~99 Ibaisitos (después de fee)
```

### 3. Creador crea predicción
```javascript
predictionMarket.createPrediction(
  ibaiTokenAddress,
  "¿Gana el Madrid?",
  "Partido Madrid vs Barcelona",
  ["Sí", "No"],
  3600, // 1 hora
  5     // 5% fee para el creador
);
```

### 4. Usuarios apuestan
```javascript
// Usuario aprueba tokens
ibaiToken.approve(predictionMarketAddress, amount);

// Usuario apuesta
predictionMarket.placeBet(
  predictionId,
  0,      // opción "Sí"
  ethers.parseUnits("50", 18) // 50 tokens
);
```

### 5. Creador resuelve
```javascript
// Creador cierra
predictionMarket.closePrediction(predictionId);

// Creador declara ganador
predictionMarket.resolvePrediction(predictionId, 0); // "Sí" ganó

// Se inicia cooldown de 10 minutos
```

### 6. Período de reportes (cooldown)
```javascript
// Si usuarios detectan fraude, reportan
predictionMarket.reportOutcome(predictionId);

// Si se alcanza umbral → UnderReview
```

### 7. Verificación humana
```javascript
// Admin revisa y confirma o disputa
predictionMarket.confirmOutcome(predictionId);
// O si hay fraude:
predictionMarket.flagFraud(predictionId, "Resultado incorrecto");
```

### 8. Usuarios reclaman
```javascript
// Si confirmado, ganadores reclaman
predictionMarket.claimReward(predictionId);

// Si disputado, todos reclaman reembolso
predictionMarket.claimRefund(predictionId);
```

### 9. Usuario canjea tokens
```javascript
// Usuario vende tokens por DEV/GLMR
ibaiToken.approve(tokenExchangeAddress, amount);
tokenExchange.sellTokens(ibaiTokenAddress, amount);
```

---

## 🛡️ Sistema Anti-Fraude

### Mecanismos de Protección

1. **Cooldown de 10 minutos**
   - Tras resolverse, nadie puede canjear tokens
   - Permite que usuarios reporten resultados incorrectos

2. **Umbral de reportes dinámico**
   - 7% de participantes o mínimo 5 reportes
   - Se calcula automáticamente según participación

3. **Verificación humana**
   - Admin revisa casos con muchos reportes
   - Puede confirmar o marcar como fraude

4. **Consecuencias del fraude**
   - Creador es baneado automáticamente
   - Su token queda inutilizable
   - Usuarios reciben reembolso completo
   - No puede crear nuevas predicciones

5. **Fondos en custodia**
   - Todos los fondos quedan en el contrato
   - No se liberan hasta confirmación

---

## ⚙️ Configuración del Sistema

### Parámetros configurables (admin)

**PredictionMarket:**
```solidity
setCooldownDuration(600);        // 10 minutos
setReportThreshold(7, 5);         // 7%, mínimo 5
```

**TokenExchange:**
```solidity
setPlatformFee(1);                // 1%
```

**CreatorTokenFactory:**
```solidity
setDefaultPriceUpdateInterval(2592000); // 30 días
```

---

## 📊 Eventos Importantes

### Para monitoreo frontend/backend

```solidity
// Factory
CreatorTokenCreated(address creator, address tokenAddress, ...)
CreatorBanned(address creator, string reason, ...)

// PredictionMarket
PredictionCreated(uint256 predictionId, ...)
BetPlaced(uint256 predictionId, address bettor, ...)
CooldownStarted(uint256 predictionId, uint256 endsAt)
OutcomeReported(uint256 predictionId, address reporter, ...)
UnderReview(uint256 predictionId, ...)
OutcomeConfirmed(uint256 predictionId, ...)
OutcomeDisputed(uint256 predictionId, string reason, ...)

// TokenExchange
TokensPurchased(address buyer, address token, ...)
TokensSold(address seller, address token, ...)
```

---

## 🧪 Testing

### Próximos pasos
- Crear tests unitarios para cada contrato
- Tests de integración del flujo completo
- Tests de casos extremos (fraude, gas limits, etc.)

```bash
npm run test
```

---

## 📝 Próximas Mejoras

1. **Sistema de reputación**
   - Score para creadores basado en historial
   - Creadores confiables pueden tener menor cooldown

2. **Oráculo descentralizado**
   - Integrar Chainlink para eventos verificables
   - Reducir dependencia de verificación humana

3. **Staking para resolvers**
   - Permitir que terceros resuelvan con stake
   - Slashing en caso de fraude

4. **Pool de liquidez**
   - En lugar de mint/burn, usar pool AMM
   - Mejor para grandes volúmenes

5. **Gobernanza**
   - DAO para decisiones del sistema
   - Votación de parámetros

---

## 🔐 Seguridad

### Consideraciones implementadas
- ✅ ReentrancyGuard en funciones críticas
- ✅ Checks-Effects-Interactions pattern
- ✅ Validación de permisos (Ownable)
- ✅ Verificación de estados antes de operaciones
- ✅ Eventos para trazabilidad
- ✅ Optimizador habilitado (viaIR)

### Recomendaciones antes de producción
- [ ] Auditoría de seguridad profesional
- [ ] Tests exhaustivos (100% coverage)
- [ ] Deploy en testnet y testing real
- [ ] Bug bounty program
- [ ] Plan de emergencia y pausas

---

## 📞 Contacto y Soporte

Para dudas sobre la implementación, revisar:
1. Comentarios en el código fuente
2. Este documento
3. Tests (cuando estén implementados)

---

**Estado:** ✅ Contratos implementados y compilados
**Siguiente paso:** Testing y despliegue en Moonbase testnet

