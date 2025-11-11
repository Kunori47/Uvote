# 🚀 Guía de Deployment - Moonbase Alpha

## Pre-requisitos

### 1. Obtener tokens DEV (testnet)

Necesitas fondos de testnet para pagar el gas del deployment.

**Opciones**:

**A) Faucet oficial de Moonbeam**
1. Visita: https://faucet.moonbeam.network/
2. Conecta tu wallet (MetaMask u otra compatible)
3. Selecciona "Moonbase Alpha"
4. Solicita tokens DEV
5. Espera ~30 segundos a recibir

**B) Faucet alternativo**
- https://apps.moonbeam.network/moonbase-alpha/faucet

**Verifica tu balance**:
```bash
# Usando cast (Foundry)
cast balance TU_ADDRESS --rpc-url https://rpc.api.moonbase.moonbeam.network

# O desde Hardhat
npx hardhat run scripts/check-balance.ts --network moonbase
```

---

### 2. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# Moonbase Alpha Private Key
MOONBASE_PRIVATE_KEY=tu_private_key_aqui_sin_0x
```

⚠️ **IMPORTANTE**:
- NO incluir el prefijo `0x` en la private key
- NO commitear el archivo `.env` a git (ya está en `.gitignore`)
- Usar una cuenta de testnet, NO usar keys de mainnet

**Obtener tu private key**:
- MetaMask: Account Details → Export Private Key
- Asegúrate de que sea una cuenta que SOLO uses para testnet

---

### 3. Verificar Configuración de Red

El archivo `hardhat.config.ts` ya tiene configurada la red Moonbase:

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

## Proceso de Deployment

### Paso 1: Compilar Contratos

```bash
npm run compile
```

Deberías ver:
```
Compiled 4 Solidity files with solc 0.8.28
```

---

### Paso 2: Ejecutar Deployment

```bash
npx hardhat ignition deploy ignition/modules/UvoteSystem.ts --network moonbase
```

**Qué esperar**:
- El proceso tomará ~2-5 minutos
- Se desplegarán 3 contratos: Factory, Market, Exchange
- Verás las direcciones de cada contrato
- Se creará un archivo de deployment en `ignition/deployments/`

**Salida esperada**:
```
Hardhat Ignition 🚀

Deploying [ UvoteSystem ]

Batch #1
  Executed CreatorTokenFactory

Batch #2
  Executed PredictionMarket

Batch #3
  Executed TokenExchange

[ UvoteSystem ] successfully deployed 🚀

Deployed Addresses

UvoteSystem#CreatorTokenFactory - 0x...
UvoteSystem#PredictionMarket - 0x...
UvoteSystem#TokenExchange - 0x...
```

⚠️ **GUARDAR ESTAS DIRECCIONES** - Las necesitarás para los siguientes pasos.

---

### Paso 3: Guardar Addresses

Crea un archivo `deployed-addresses.json`:

```json
{
  "network": "moonbase",
  "chainId": 1287,
  "deployedAt": "2025-01-08",
  "contracts": {
    "CreatorTokenFactory": "0x...",
    "PredictionMarket": "0x...",
    "TokenExchange": "0x..."
  },
  "deployer": "0x..."
}
```

---

### Paso 4: Configurar Permisos

Edita `scripts/setup-permissions.ts` y actualiza las direcciones:

```typescript
const FACTORY_ADDRESS = "0x..."; // Tu Factory
const PREDICTION_MARKET_ADDRESS = "0x..."; // Tu Market
const TOKEN_EXCHANGE_ADDRESS = "0x..."; // Tu Exchange
```

Ejecuta la configuración:

```bash
npx hardhat run scripts/setup-permissions.ts --network moonbase
```

**Salida esperada**:
```
Configurando permisos del sistema...

1. Autorizando PredictionMarket...
✅ PredictionMarket autorizado

2. Autorizando TokenExchange...
✅ TokenExchange autorizado

📋 Verificando configuración:
- PredictionMarket autorizado: true
- TokenExchange autorizado: true

✅ Configuración completada!
```

---

### Paso 5: Verificar Deployment

Edita `scripts/check-system.ts` con las direcciones y ejecuta:

```bash
npx hardhat run scripts/check-system.ts --network moonbase
```

**Salida esperada**:
```
🔍 Uvote - Verificación del Sistema
=====================================

📦 CreatorTokenFactory
  Dirección: 0x...
  Owner: 0x...
  Total tokens creados: 0
  ...

✅ Verificación completada
```

---

### Paso 6: Verificar en Block Explorer

Visita https://moonbase.moonscan.io/ y busca cada dirección:

**Para cada contrato**:
1. Pega la dirección en el buscador
2. Verifica que aparezca el contrato
3. Revisa las transacciones del deployment

**Opcional - Verificar código fuente**:
```bash
npx hardhat verify --network moonbase DIRECCION_CONTRATO [ARGS_CONSTRUCTOR]
```

Ejemplo:
```bash
# Factory (sin args)
npx hardhat verify --network moonbase 0xTuFactoryAddress

# Market (necesita factory address)
npx hardhat verify --network moonbase 0xTuMarketAddress "0xTuFactoryAddress"

# Exchange (necesita factory address)
npx hardhat verify --network moonbase 0xTuExchangeAddress "0xTuFactoryAddress"
```

---

## Testing Post-Deployment

### Test 1: Verificar Estado Inicial

```bash
npx hardhat run scripts/check-system.ts --network moonbase
```

Verifica:
- ✅ Owners correctos
- ✅ Contratos autorizados
- ✅ Configuraciones por defecto

---

### Test 2: Demo Completa (Opcional)

Si quieres probar el flujo completo:

1. Edita `scripts/interact-demo.ts` con las direcciones
2. Ejecuta:
```bash
npx hardhat run scripts/interact-demo.ts --network moonbase
```

Esto:
- Crea un token de creador
- Compra tokens con DEV
- Crea una predicción
- Realiza una apuesta

⚠️ **Nota**: Esto consumirá DEV de tu wallet.

---

## Troubleshooting

### Error: "insufficient funds for gas"
**Solución**: Obtén más DEV del faucet

### Error: "nonce too low"
**Solución**: Espera 30 segundos y reintenta

### Error: "MOONBASE_PRIVATE_KEY not found"
**Solución**: 
1. Verifica que existe el archivo `.env`
2. Verifica que la variable está bien escrita
3. Reinicia el terminal

### Error: "replacement fee too low"
**Solución**: La transacción anterior aún está pendiente. Espera o aumenta el gas price.

### Error al verificar contratos
**Solución**: 
- Espera que Moonscan indexe (puede tardar 1-2 minutos)
- Verifica que los argumentos del constructor sean correctos
- Usa `--show-stack-traces` para más detalles

---

## Post-Deployment Checklist

- [ ] Contratos desplegados exitosamente
- [ ] Direcciones guardadas en `deployed-addresses.json`
- [ ] Permisos configurados (PredictionMarket y TokenExchange autorizados)
- [ ] Verificación de sistema exitosa
- [ ] Contratos verificados en Moonscan (opcional pero recomendado)
- [ ] Demo ejecutada exitosamente (opcional)
- [ ] Direcciones compartidas con el equipo frontend
- [ ] Documentación actualizada con las nuevas addresses

---

## Información de Red

**Moonbase Alpha**
- **RPC HTTP**: https://rpc.api.moonbase.moonbeam.network
- **RPC WebSocket**: wss://wss.api.moonbase.moonbeam.network
- **Chain ID**: 1287
- **Block Explorer**: https://moonbase.moonscan.io/
- **Faucet**: https://faucet.moonbeam.network/
- **Símbolo**: DEV

---

## Próximos Pasos

Una vez desplegado en Moonbase:

1. **Testing extensivo**
   - Probar todos los flujos desde el frontend
   - Validar casos edge
   - Monitorear gas costs

2. **Documentar para frontend**
   - Compartir ABIs (`artifacts/contracts/.../*.json`)
   - Compartir addresses desplegadas
   - Documentar eventos a escuchar

3. **Preparar para producción**
   - Auditoría de seguridad
   - Optimizaciones de gas si necesario
   - Plan de deployment en Moonbeam mainnet

---

## Costos Estimados

**Deployment en Moonbase** (testnet - GRATIS):
- Factory: ~0.5 DEV (gratis)
- Market: ~1.5 DEV (gratis)
- Exchange: ~0.8 DEV (gratis)
- Config: ~0.1 DEV (gratis)
- **Total**: ~3 DEV (obtenibles gratis del faucet)

**Deployment en Moonbeam** (mainnet - REAL):
- Estimado total: ~3 GLMR (~$0.60 USD al precio actual)
- Más gas para configuración y tests

---

## Recursos Útiles

- [Moonbeam Docs](https://docs.moonbeam.network/)
- [Hardhat Ignition](https://hardhat.org/ignition)
- [Moonscan API](https://moonbase.moonscan.io/apis)
- [Moonbeam Discord](https://discord.gg/moonbeam)

---

**Última actualización**: 2025-01-08  
**Estado**: Listo para deployment


