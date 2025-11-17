# 🚀 Guía de Deploy a Moonbeam/Moonbase

Esta guía explica cómo desplegar el sistema Uvote a Moonbeam (mainnet) o Moonbase Alpha (testnet) y configurar el frontend para usar DOT en lugar de ETH.

## 📋 Prerequisitos

1. **Wallet con fondos**:
   - Para Moonbase Alpha: Obtener tokens DEV del [faucet](https://faucet.moonbeam.network/)
   - Para Moonbeam: Tener GLMR en tu wallet

2. **Variables de entorno**:
   - Crear archivo `.env` en la raíz del proyecto con tu private key

## 🔧 Configuración Inicial

### 1. Configurar Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```env
# Para deploy en Moonbase Alpha (testnet)
MOONBASE_PRIVATE_KEY=tu_private_key_aqui

# Para deploy en Moonbeam (mainnet) - opcional
MOONBEAM_PRIVATE_KEY=tu_private_key_aqui
```

**⚠️ IMPORTANTE**: Nunca commitees el archivo `.env` al repositorio. Está en `.gitignore`.

### 2. Compilar Contratos

```bash
npm run compile
```

## 🚀 Deploy a Moonbase Alpha (Testnet)

### Paso 1: Verificar Balance

```bash
npx hardhat run scripts/check-balance.ts --network moonbase
```

Si no tienes fondos, obtén tokens DEV del [faucet de Moonbase](https://faucet.moonbeam.network/).

### Paso 2: Desplegar Contratos

```bash
npx hardhat ignition deploy ignition/modules/deploy-system.ts --network moonbase
```

Este comando desplegará los tres contratos:
- `CreatorTokenFactory`
- `PredictionMarket`
- `TokenExchange`

**📝 IMPORTANTE**: Guarda las direcciones que se muestren en la salida. Las necesitarás para el siguiente paso.

### Paso 3: Configurar Permisos

Editar `scripts/setup-permissions.ts` y actualizar las direcciones:

```typescript
const DEPLOYED_ADDRESSES = {
  factory: "0x...", // Dirección del CreatorTokenFactory
  market: "0x...",  // Dirección del PredictionMarket
  exchange: "0x...", // Dirección del TokenExchange
};
```

Luego ejecutar:

```bash
npx hardhat run scripts/setup-permissions.ts --network moonbase
```

### Paso 4: Verificar Deploy

```bash
npx hardhat run scripts/check-system.ts --network moonbase
```

## 🌐 Configurar Frontend para Moonbase/Moonbeam

### Paso 1: Crear Archivo `.env` en `frontend/`

Crear `frontend/.env` con la siguiente configuración:

**Para Moonbase Alpha (testnet):**
```env
VITE_NETWORK=moonbase
VITE_MOONBASE_CHAIN_ID=1287
VITE_MOONBASE_RPC_URL=https://rpc.api.moonbase.moonbeam.network
VITE_MOONBASE_FACTORY_ADDRESS=0x...
VITE_MOONBASE_PREDICTION_MARKET_ADDRESS=0x...
VITE_MOONBASE_TOKEN_EXCHANGE_ADDRESS=0x...
```

**Para Moonbeam (mainnet):**
```env
VITE_NETWORK=moonbeam
VITE_MOONBEAM_CHAIN_ID=1284
VITE_MOONBEAM_RPC_URL=https://rpc.api.moonbeam.network
VITE_MOONBEAM_FACTORY_ADDRESS=0x...
VITE_MOONBEAM_PREDICTION_MARKET_ADDRESS=0x...
VITE_MOONBEAM_TOKEN_EXCHANGE_ADDRESS=0x...
```

**Para desarrollo local (Hardhat):**
```env
VITE_NETWORK=local
# Las direcciones por defecto se usarán automáticamente
```

### Paso 2: Reconstruir Frontend

```bash
cd frontend
npm run build
```

O para desarrollo:

```bash
cd frontend
npm run dev
```

## 🔄 Conversión ETH → DOT

### Conceptos Importantes

1. **Valores numéricos NO cambian**: 
   - Tanto ETH como DOT usan 18 decimales
   - `1 ETH = 1 DOT` en términos de wei/planck
   - `ethers.parseEther("1.0")` funciona igual para ambos

2. **Lo que SÍ cambia**:
   - **Chain ID**: 31337 (local) → 1287 (Moonbase) → 1284 (Moonbeam)
   - **RPC URL**: `http://127.0.0.1:8545` → `https://rpc.api.moonbase.moonbeam.network`
   - **Símbolo de moneda**: `ETH` → `DOT` (en la UI)
   - **Direcciones de contratos**: Nuevas direcciones después del deploy

### Código Automático

El sistema ahora detecta automáticamente la red y:
- Usa las direcciones de contratos correctas
- Muestra "DOT" en lugar de "ETH" cuando está en Moonbase/Moonbeam
- Se conecta al RPC correcto

## 📝 Resumen de Cambios

### Backend (Smart Contracts)
- ✅ Ya configurado en `hardhat.config.ts`
- ✅ Scripts de deploy listos
- ✅ No requiere cambios en los contratos

### Frontend
- ✅ `contracts.ts` ahora usa variables de entorno
- ✅ Detecta automáticamente la red
- ✅ Muestra "DOT" cuando está en Moonbase/Moonbeam
- ✅ Todas las referencias a "ETH" ya fueron cambiadas a "DOT" en la UI

## 🧪 Testing

### En Moonbase Alpha

1. Conectar MetaMask a Moonbase Alpha (Chain ID: 1287)
2. Obtener tokens DEV del faucet
3. Probar crear un token de creador
4. Probar crear una predicción
5. Probar apostar en una predicción

### Verificar en Block Explorer

- **Moonbase Alpha**: https://moonbase.moonscan.io/
- **Moonbeam**: https://moonscan.io/

## 🔍 Troubleshooting

### Error: "insufficient funds"
- Solución: Obtener más tokens del faucet (Moonbase) o comprar GLMR (Moonbeam)

### Error: "nonce too low"
- Solución: Esperar unos segundos y reintentar

### Frontend no se conecta a la red correcta
- Verificar que `VITE_NETWORK` esté configurado correctamente
- Verificar que las direcciones de contratos estén correctas
- Limpiar cache: `npm run build` nuevamente

### Los valores se muestran incorrectos
- Recordar: Los valores numéricos son los mismos (1 ETH = 1 DOT en wei)
- Solo cambia el símbolo mostrado en la UI

## 📚 Recursos

- [Moonbeam Docs](https://docs.moonbeam.network/)
- [Moonbase Block Explorer](https://moonbase.moonscan.io/)
- [Moonbeam Block Explorer](https://moonscan.io/)
- [Faucet Moonbase](https://faucet.moonbeam.network/)

