# Uvote - Decentralized Voting Platform

A decentralized prediction market platform built on Polkadot where creators can create tokens and their followers can participate in prediction markets.

## 📹 Demo Video

[![Watch the demo](https://img.youtube.com/vi/TmKT6njb4ms/0.jpg)](https://www.youtube.com/watch?v=TmKT6njb4ms)

*Click the image above to watch a complete demo of the platform*

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Git

## For Moonbase Alpha (Testnet) or Moonbeam (Mainnet) please see DEPLOY_MOONBEAM.md
## Local Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd uvotechain
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Return to root directory
cd ..
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# Backend environment variables
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Frontend environment variables (will be copied to frontend/.env not required)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Start Local Blockchain

```bash
# Start a local Hardhat network
npx hardhat node
```

This will start a local blockchain network on `http://localhost:8545` with pre-funded accounts.

### 5. Deploy Smart Contracts

In a new terminal window (while the local node is running):

```bash
# Deploy contracts to local network
npx hardhat ignition deploy ignition/modules/UvoteSystem.ts --network localhost && npm run sync:addresses
# or
npm run deploy:ignition
```

### 6. Fill Your Wallet with Test DOT

Use the provided script to fill your wallet with test DOT for transactions:

```bash
# Fill a specific wallet address with 100 DOT
npx hardhat run scripts/send-eth.ts --network localhost

# The script will prompt you to enter the wallet address
# Or you can modify the script to use a specific address
```

The `scripts/send-eth.ts` script allows you to:
- Send test DOT to any wallet address
- Specify the amount to send
- Use any of the pre-funded accounts from the local node

### 7. Start Backend Services

```bash
cd backend
npm run dev
```

The backend will start on `http://localhost:3001`

### 8. Start Frontend

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:5173`

## Using the Application

### Connecting Your Wallet

1. Open the frontend application in your browser
2. Click on "Connect Wallet" 
3. Select your wallet provider (MetaMask, etc.)
4. Add the local network to your wallet:
   - Network Name: Localhost 8545
   - RPC URL: http://localhost:8545
   - Chain ID: 31337
   - Currency Symbol: ETH # for testing

### Getting Test DOT

If your wallet doesn't have enough DOT for transactions:

1. Copy your wallet address
2. Run the send-eth script:
   ```bash
   npx hardhat run scripts/send-eth.ts --network localhost
   ```
3. Enter your wallet address when prompted
4. The script will send 100 DOT to your address

### Creating a Creator Token

1. Connect your wallet
2. Navigate to "Create Token"
3. Fill in the token details:
   - Token Name
   - Token Symbol
   - Token Description
   - (Optional) Token Image
4. Click "Create Token"
5. Confirm the transaction in your wallet

### Creating Predictions

1. You must have a creator token first
2. Navigate to "Create Prediction"
3. Fill in the prediction details:
   - Prediction Title
   - Description
   - Options (minimum 2, maximum 10)
   - Duration settings
4. Click "Create Prediction"
5. Confirm the transaction

## Project Structure

```
uvotechain/
├── backend/              # Node.js backend with Supabase
├── frontend/             # React TypeScript frontend
├── contracts/            # Solidity smart contracts
├── ignition/             # Hardhat Ignition deployment modules
├── scripts/              # Utility scripts (including send-eth.ts)
└── test/                 # Test files
```

## Available Scripts

### Hardhat Scripts
- `npx hardhat node` - Start local blockchain
- `npx hardhat test` - Run contract tests
- `npx hardhat ignition deploy <module>` - Deploy contracts
- `npx hardhat run scripts/send-eth.ts` - Send test ETH to wallet

### Backend Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm test` - Run backend tests

### Frontend Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm test` - Run frontend tests

## Smart Contracts

The platform uses the following main contracts:
- `CreatorToken.sol` - ERC20 tokens for creators
- `CreatorTokenFactory.sol` - Factory for creating creator tokens
- `PredictionMarket.sol` - Prediction market functionality

## Development Tips

1. **Keep the local node running** - The local blockchain must be running for the app to work
2. **Use fresh accounts** - Each time you restart the local node, you'll get new pre-funded accounts
3. **Check balances** - Always ensure your wallet has enough ETH for gas fees
4. **Transaction confirmation** - Always check your wallet for transaction confirmations
5. **Network settings** - Make sure your wallet is connected to the local network (Chain ID: 31337)

## Troubleshooting

### Common Issues

1. **"Wallet not connected"** - Make sure your wallet is connected to the local network
2. **"Insufficient balance"** - Use the send-eth script to get more test ETH
3. **"Transaction failed"** - Check that contracts are deployed and wallet has enough ETH
4. **"Network error"** - Ensure the local node is running on port 8545

### Resetting the Environment

To completely reset your local environment:

1. Stop all running processes
2. Delete the `cache` and `artifacts` folders
3. Restart the local node with `npx hardhat node`
4. Redeploy contracts
5. Refill your wallet with ETH using the send-eth script

## Unimplemented Features

The following features are planned but not yet implemented:

### Frontend Features
- **Creator Profile Categories**: Category statistics and distribution charts for creators
- **Profile Editing**: Ability to edit creator profile information (name, bio, avatar)
- **Token Management**: Edit existing creator token details
- **Share Functionality**: Share predictions on social media platforms
- **Advanced Statistics**: 
  - Profit/loss calculations based on historical data
  - Investment tracking and portfolio analytics
  - Creator performance metrics over time
- **Creator Verification**: Verification system for creator accounts from CreatorTokenFactory
- **Notification System**: Real-time notifications for prediction outcomes, new subscriptions, etc.
- **Advanced Search**: Filter predictions by creator, date range, prize amount
- **Mobile App**: Native mobile applications for iOS and Android

### Backend Features
- **Pagination**: Proper pagination for token lists and creator listings
- **Advanced Analytics**: Comprehensive analytics dashboard for creators and users
- **API Rate Limiting**: Rate limiting for API endpoints
- **Caching System**: Redis caching for improved performance
- **Email Notifications**: Email alerts for prediction outcomes and important events

### Smart Contract Features
- **Governance**: On-chain governance system for platform decisions
- **Staking**: Staking mechanism for creators and token holders
- **Advanced Prediction Types**: Multi-outcome predictions with weighted outcomes
- **Prediction Templates**: Reusable prediction templates for common use cases

### UI/UX Improvements
- **Dark Mode**: System-wide dark/light theme toggle
- **Accessibility**: Full WCAG 2.1 compliance
- **Internationalization**: Multi-language support (currently only English)
- **Responsive Design**: Improved mobile and tablet layouts
- **Loading States**: Better loading indicators and skeleton screens

### Integration Features
- **External APIs**: Integration with sports APIs, financial data providers
- **Social Media**: Auto-posting of resolved predictions
- **Wallet Connect**: Support for WalletConnect protocol
- **Hardware Wallets**: Support for Ledger and Trezor hardware wallets

## License

MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
