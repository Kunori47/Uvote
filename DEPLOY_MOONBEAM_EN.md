# 🚀 Deploy Guide to Moonbeam/Moonbase

This guide explains how to deploy the Uvote system to Moonbeam (mainnet) or Moonbase Alpha (testnet) and configure the frontend to use DOT instead of ETH.

## 📋 Prerequisites

1. **Wallet with funds**:
   - For Moonbase Alpha: Get DEV tokens from the [faucet](https://faucet.moonbeam.network/)
   - For Moonbeam: Have GLMR in your wallet

2. **Environment variables**:
   - Create `.env` file in the project root with your private key

## 🔧 Initial Setup

### 1. Configure Environment Variables

Create `.env` file in the project root:
```env
# For deployment to Moonbase Alpha (testnet)
MOONBASE_PRIVATE_KEY=your_private_key_here

# For deployment to Moonbeam (mainnet) - optional
MOONBEAM_PRIVATE_KEY=your_private_key_here
```

**⚠️ IMPORTANT**: Never commit the `.env` file to the repository. It's in `.gitignore`.

### 2. Compile Contracts

```bash
npm run compile
```

## 🚀 Deploy to Moonbase Alpha (Testnet)

### Step 1: Check Balance

```bash
npx hardhat run scripts/check-balance.ts --network moonbase
```

If you don't have funds, get DEV tokens from the [Moonbase faucet](https://faucet.moonbeam.network/).

### Step 2: Deploy Contracts

```bash
npx hardhat ignition deploy ignition/modules/deploy-system.ts --network moonbase
```

This command will deploy the three contracts:
- `CreatorTokenFactory`
- `PredictionMarket`
- `TokenExchange`

**📝 IMPORTANT**: Save the addresses shown in the output. You'll need them for the next step.

### Step 3: Configure Permissions

Edit `scripts/setup-permissions.ts` and update the addresses:
```typescript
const DEPLOYED_ADDRESSES = {
  factory: "0x...", // CreatorTokenFactory address
  market: "0x...",  // PredictionMarket address
  exchange: "0x...", // TokenExchange address
};
```

Then run:

```bash
npx hardhat run scripts/setup-permissions.ts --network moonbase
```

### Step 4: Verify Deployment

```bash
npx hardhat run scripts/check-system.ts --network moonbase
```

## 🌐 Configure Frontend for Moonbase/Moonbeam

### Step 1: Create `.env` file in `frontend/`

Create `frontend/.env` with the following configuration:

**For Moonbase Alpha (testnet):**
```env
VITE_NETWORK=moonbase
VITE_MOONBASE_CHAIN_ID=1287
VITE_MOONBASE_RPC_URL=https://rpc.api.moonbase.moonbeam.network
VITE_MOONBASE_FACTORY_ADDRESS=0x...
VITE_MOONBASE_PREDICTION_MARKET_ADDRESS=0x...
VITE_MOONBASE_TOKEN_EXCHANGE_ADDRESS=0x...
```

**For Moonbeam (mainnet):**
```env
VITE_NETWORK=moonbeam
VITE_MOONBEAM_CHAIN_ID=1284
VITE_MOONBEAM_RPC_URL=https://rpc.api.moonbeam.network
VITE_MOONBEAM_FACTORY_ADDRESS=0x...
VITE_MOONBEAM_PREDICTION_MARKET_ADDRESS=0x...
VITE_MOONBEAM_TOKEN_EXCHANGE_ADDRESS=0x...
```

**For local development (Hardhat):**
```env
VITE_NETWORK=local
# Default addresses will be used automatically
```

### Step 2: Rebuild Frontend

```bash
cd frontend
npm run build
```

Or for development:

```bash
cd frontend
npm run dev
```

## 🔄 ETH → DOT Conversion

### Important Concepts

1. **Numeric values DON'T change**:
   - Both ETH and DOT use 18 decimals
   - `1 ETH = 1 DOT` in terms of wei/planck
   - `ethers.parseEther("1.0")` works the same for both

2. **What DOES change**:
   - **Chain ID**: 31337 (local) → 1287 (Moonbase) → 1284 (Moonbeam)
   - **RPC URL**: `http://127.0.0.1:8545` → `https://rpc.api.moonbase.moonbeam.network`
   - **Currency symbol**: `ETH` → `DOT` (in the UI)
   - **Contract addresses**: New addresses after deployment

### Automatic Code

The system now automatically detects the network and:
- Uses the correct contract addresses
- Shows "DOT" instead of "ETH" when on Moonbase/Moonbeam
- Connects to the correct RPC

## 📝 Summary of Changes

### Backend (Smart Contracts)
- ✅ Already configured in `hardhat.config.ts`
- ✅ Deployment scripts ready
- ✅ No contract changes required

### Frontend
- ✅ `contracts.ts` now uses environment variables
- ✅ Automatically detects network
- ✅ Shows "DOT" when on Moonbase/Moonbeam
- ✅ All "ETH" references already changed to "DOT" in UI

## 🧪 Testing

### On Moonbase Alpha

1. Connect MetaMask to Moonbase Alpha (Chain ID: 1287)
2. Get DEV tokens from faucet
3. Try creating a creator token
4. Try creating a prediction
5. Try betting on a prediction

### Verify on Block Explorer

- **Moonbase Alpha**: https://moonbase.moonscan.io/
- **Moonbeam**: https://moonscan.io/

## 🔍 Troubleshooting

### Error: "insufficient funds"
- Solution: Get more tokens from faucet (Moonbase) or buy GLMR (Moonbeam)

### Error: "nonce too low"
- Solution: Wait a few seconds and retry

### Frontend doesn't connect to correct network
- Verify that `VITE_NETWORK` is configured correctly
- Verify contract addresses are correct
- Clear cache: `npm run build` again

### Values display incorrectly
- Remember: Numeric values are the same (1 ETH = 1 DOT in wei)
- Only the displayed symbol changes in the UI

## 📚 Resources

- [Moonbeam Docs](https://docs.moonbeam.network/)
- [Moonbase Block Explorer](https://moonbase.moonscan.io/)
- [Moonbeam Block Explorer](https://moonscan.io/)
- [Faucet Moonbase](https://faucet.moonbeam.network/)
