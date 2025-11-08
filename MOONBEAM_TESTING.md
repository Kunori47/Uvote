# Guía para Probar Hardhat con Moonbeam

Esta guía te ayudará a probar tu contrato `Counter` en Moonbeam usando Hardhat.

## 📋 Requisitos Previos

1. **Instalar dependencias** (si no lo has hecho):
   ```bash
   npm install
   ```

2. **Obtener una cuenta de prueba con tokens DEV**:
   - Visita el faucet de Moonbeam: https://faucet.moonbeam.network/
   - Solicita tokens DEV gratuitos para Moonbase Alpha
   - Guarda tu clave privada de forma segura

3. **Configurar tu clave privada**:
   - Abre el archivo `.env`
   - Reemplaza `0xTU_CLAVE_PRIVADA_AQUI` con tu clave privada real
   - **⚠️ IMPORTANTE**: Nunca compartas tu `.env` ni hagas commit de él a Git

## 🧪 Probar Localmente (Red Local de Hardhat)

### 1. Compilar los contratos
```bash
npm run compile
```

### 2. Ejecutar tests locales
```bash
npm run test
```

Este comando ejecutará los tests en `test/Counter.ts` usando la red local de Hardhat.

### 3. Desplegar localmente
```bash
npm run deploy:local
```

Esto desplegará el contrato en una red local de Hardhat y ejecutará algunas transacciones de prueba.

## 🌙 Probar en Moonbase Alpha (Testnet de Moonbeam)

### 1. Asegúrate de tener DEV tokens
Verifica que tienes tokens DEV en tu cuenta visitando:
```
https://moonbase.moonscan.io/address/TU_DIRECCION_AQUI
```

### 2. Compilar (si no lo has hecho)
```bash
npm run compile
```

### 3. Desplegar en Moonbase Alpha
```bash
npm run deploy:moonbase
```

Este comando:
- Se conectará a la testnet de Moonbeam (Moonbase Alpha)
- Desplegará el contrato `Counter`
- Ejecutará algunas transacciones de prueba
- Te mostrará la dirección del contrato desplegado
- Te dará un enlace a Moonscan para ver tu contrato

### 4. Ver tu contrato en Moonscan
Después del despliegue, verás un enlace como:
```
🔍 Ver en Moonscan: https://moonbase.moonscan.io/address/0x...
```

Abre ese enlace para:
- Ver las transacciones del contrato
- Leer el estado actual
- Interactuar con el contrato

## 🔧 Comandos Útiles de Hardhat

### Compilar contratos
```bash
npx hardhat compile
```

### Ejecutar tests
```bash
npx hardhat test
```

### Ejecutar un script específico
```bash
npx hardhat run scripts/deploy-moonbeam.ts --network moonbase
```

### Abrir consola de Hardhat en Moonbase
```bash
npx hardhat console --network moonbase
```

En la consola puedes interactuar con tus contratos:
```javascript
const Counter = await ethers.getContractFactory("Counter");
const counter = await Counter.attach("DIRECCION_DEL_CONTRATO");
await counter.x(); // Leer el valor actual
await counter.inc(); // Incrementar
```

## 📚 Información Adicional

### Redes Configuradas

Tu `hardhat.config.ts` tiene estas redes:

- **moonbase**: Testnet de Moonbeam (Moonbase Alpha)
  - RPC: https://rpc.api.moonbase.moonbeam.network
  - Chain ID: 1287
  - Faucet: https://faucet.moonbeam.network/
  - Explorer: https://moonbase.moonscan.io/

- **hardhatMainnet**: Red local simulada de Ethereum L1
- **hardhatOp**: Red local simulada de Optimism
- **sepolia**: Testnet de Ethereum (requiere configuración adicional)

### Recursos

- Documentación de Moonbeam: https://docs.moonbeam.network/
- Documentación de Hardhat: https://hardhat.org/docs
- Faucet de Moonbeam: https://faucet.moonbeam.network/
- Moonscan (Explorer): https://moonbase.moonscan.io/

## ⚠️ Seguridad

- Nunca compartas tu clave privada
- Usa solo cuentas de prueba para desarrollo
- Asegúrate de que `.env` esté en tu `.gitignore`
- No uses claves privadas con fondos reales en testnet

## 🐛 Solución de Problemas

### Error: "insufficient funds"
- Asegúrate de tener tokens DEV en tu cuenta
- Visita el faucet: https://faucet.moonbeam.network/

### Error: "MOONBASE_PRIVATE_KEY is not defined"
- Verifica que configuraste la variable en el archivo `.env`
- Asegúrate de que la clave comienza con `0x`

### Error de compilación
```bash
# Limpia los artefactos y recompila
npx hardhat clean
npx hardhat compile
```
