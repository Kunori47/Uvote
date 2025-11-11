# Scripts de Interacción - Uvote

Este directorio contiene scripts para desplegar, configurar e interactuar con el sistema Uvote.

---

## 📋 Scripts Disponibles

### 1. deploy-system.ts (Ignition Module)
**Descripción**: Módulo de Hardhat Ignition para desplegar todos los contratos del sistema.

**Uso**:
```bash
# Deploy en red local
npx hardhat ignition deploy ignition/modules/deploy-system.ts

# Deploy en Moonbase Alpha (testnet)
npx hardhat ignition deploy ignition/modules/deploy-system.ts --network moonbase
```

**Qué despliega**:
- CreatorTokenFactory
- PredictionMarket
- TokenExchange

---

### 2. setup-permissions.ts
**Descripción**: Configura los permisos entre contratos después del deploy.

**Pre-requisito**: Actualizar las direcciones de contratos en el script.

**Uso**:
```bash
npx hardhat run scripts/setup-permissions.ts --network moonbase
```

**Qué hace**:
- Autoriza PredictionMarket en Factory
- Autoriza TokenExchange en Factory
- Verifica las configuraciones

---

### 3. interact-demo.ts
**Descripción**: Script de demostración que ejecuta un flujo completo del sistema.

**Pre-requisito**: 
- Sistema desplegado
- Actualizar direcciones en el script
- Tener DEV en la cuenta

**Uso**:
```bash
npx hardhat run scripts/interact-demo.ts --network moonbase
```

**Flujo que ejecuta**:
1. Crea un token de creador
2. Autoriza contratos para mint/burn
3. Compra tokens con DEV
4. Crea una predicción
5. Realiza una apuesta

---

### 4. check-system.ts
**Descripción**: Verifica el estado actual del sistema desplegado.

**Pre-requisito**: Actualizar direcciones en el script.

**Uso**:
```bash
npx hardhat run scripts/check-system.ts --network moonbase
```

**Información que muestra**:
- Estado de Factory (tokens creados, owner, configuración)
- Estado de Market (predicciones, cooldown, umbrales)
- Estado de Exchange (fees, balance, owner)
- Tu token de creador (si existe)
- Autorizaciones del sistema

---

### 5. deploy-moonbeam.ts (Existente)
**Descripción**: Script de deploy antiguo, considera usar `deploy-system.ts` en su lugar.

---

## 🚀 Flujo de Deployment Completo

### 1. Preparación
```bash
# Verificar balance en Moonbase
npx hardhat run scripts/check-balance.ts --network moonbase

# O manualmente:
curl https://rpc.api.moonbase.moonbeam.network \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getBalance","params":["TU_ADDRESS","latest"],"id":1}'
```

### 2. Deployment
```bash
# Compilar contratos
npm run compile

# Desplegar en Moonbase
npx hardhat ignition deploy ignition/modules/deploy-system.ts --network moonbase

# IMPORTANTE: Guardar las direcciones que muestre el deploy
```

### 3. Configuración
```bash
# Actualizar direcciones en scripts/setup-permissions.ts
# Editar: FACTORY_ADDRESS, PREDICTION_MARKET_ADDRESS, TOKEN_EXCHANGE_ADDRESS

# Ejecutar configuración
npx hardhat run scripts/setup-permissions.ts --network moonbase
```

### 4. Verificación
```bash
# Actualizar direcciones en scripts/check-system.ts

# Verificar estado
npx hardhat run scripts/check-system.ts --network moonbase
```

### 5. Demo (Opcional)
```bash
# Actualizar direcciones en scripts/interact-demo.ts

# Ejecutar demostración
npx hardhat run scripts/interact-demo.ts --network moonbase
```

---

## 🔑 Configuración de Variables

### Archivo `.env`
Crear un archivo `.env` en la raíz del proyecto con:

```env
# Moonbase Alpha Testnet
MOONBASE_PRIVATE_KEY=tu_private_key_aqui
```

### Hardhat Config
Las variables se cargan automáticamente en `hardhat.config.ts`:

```typescript
networks: {
  moonbase: {
    type: "http",
    url: "https://rpc.api.moonbase.moonbeam.network",
    accounts: [configVariable("MOONBASE_PRIVATE_KEY")],
    chainId: 1287,
  }
}
```

---

## 🧪 Testing en Moonbase Alpha

### Obtener DEV (tokens de testnet)
1. Visitar: https://faucet.moonbeam.network/
2. Conectar wallet
3. Seleccionar Moonbase Alpha
4. Solicitar tokens DEV

### Block Explorer
- URL: https://moonbase.moonscan.io/
- Usar para verificar transacciones y contratos

### RPC Endpoints
- HTTP: https://rpc.api.moonbase.moonbeam.network
- WebSocket: wss://wss.api.moonbase.moonbeam.network
- Chain ID: 1287

---

## 📝 Notas Importantes

### Direcciones de Contratos
Después del deploy, **actualizar las direcciones** en estos archivos:
- `scripts/setup-permissions.ts`
- `scripts/check-system.ts`
- `scripts/interact-demo.ts`

Las direcciones se ven así:
```typescript
const DEPLOYED_ADDRESSES = {
  factory: "0xYourFactoryAddress",
  market: "0xYourMarketAddress",
  exchange: "0xYourExchangeAddress",
};
```

### Gas y Fees
- Moonbase Alpha es gratis (usa tokens DEV de testnet)
- Gas limit recomendado: 5,000,000 para deploys
- Gas price: Se ajusta automáticamente

### Errores Comunes

#### "insufficient funds"
- Solución: Obtener más DEV del faucet

#### "nonce too low"
- Solución: Esperar unos segundos y reintentar

#### "replacement fee too low"
- Solución: Aumentar `gasPrice` manualmente

#### "execution reverted"
- Revisar que las direcciones estén actualizadas
- Verificar que tengas permisos (owner)
- Comprobar balances suficientes

---

## 🔧 Troubleshooting

### Ver logs detallados
```bash
npx hardhat run scripts/tu-script.ts --network moonbase --show-stack-traces
```

### Verificar transacción
```bash
# Usar el hash de transacción en:
https://moonbase.moonscan.io/tx/TU_TX_HASH
```

### Limpiar cache
```bash
npx hardhat clean
npm run compile
```

---

## 📚 Recursos

- [Hardhat Docs](https://hardhat.org/docs)
- [Moonbeam Docs](https://docs.moonbeam.network/)
- [Moonbase Block Explorer](https://moonbase.moonscan.io/)
- [Faucet Moonbase](https://faucet.moonbeam.network/)

---

**Última actualización**: 2025-01-08  
**Versión**: 1.0.0

