# Deployment Local con Hardhat

## Resumen

- Fecha: 2025-01-08
- Red: Hardhat local (`npx hardhat node`)
- Módulo: `ignition/modules/UvoteSystem.ts`
- Comando: `npx hardhat ignition deploy ... --network localhost`

### Direcciones desplegadas

| Contrato | Dirección |
|----------|-----------|
| CreatorTokenFactory | `0x5FbDB2315678afecb367f032d93F642f64180aa3` |
| PredictionMarket    | `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512` |
| TokenExchange       | `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0` |

> Estas direcciones se reinician cada vez que se vuelve a levantar `npx hardhat node`.

---

## Pasos para reproducir

### 1. Iniciar la red local
```bash
npx hardhat node
```

### 2. Desplegar contratos
En otra terminal:
```bash
npx hardhat ignition deploy ignition/modules/UvoteSystem.ts --network localhost
```

### 3. Scripts útiles

```bash
# Verificar balances (usa cuenta #0 por defecto)
npx hardhat run scripts/check-balance.ts --network localhost

# Script demo (actualizar direcciones)
npx hardhat run scripts/interact-demo.ts --network localhost
```

---

## Cuentas disponibles (Hardhat)

Hardhat provee 20 cuentas con 10,000 ETH (falsos) cada una. Ejemplo:

```
Cuenta #0: 0xf39f...a66 (private key: 0xac09...f80)
Cuenta #1: 0x7099...9c8 (private key: 0x59c6...690d)
...
```

> Estas cuentas sirven para probar el sistema sin costos reales.

---

## Notas

- El deployment local **emula la misma lógica** que Moonbeam/Moonbase.
- Se puede conectar Metamask usando `http://127.0.0.1:8545` y ChainID `31337`.
- Para reiniciar, solo detén `npx hardhat node` y vuelve a ejecutar los pasos.



