import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, getProvider, getSigner } from './contracts';

// Importar ABIs
import CreatorTokenFactoryABI from './abis/CreatorTokenFactory.json';
import CreatorTokenABI from './abis/CreatorToken.json';
import PredictionMarketABI from './abis/PredictionMarket.json';
import TokenExchangeABI from './abis/TokenExchange.json';

// ==================== FACTORY ====================

export const factoryService = {
  // Obtener instancia del contrato (lectura)
  getContract: () => {
    const provider = getProvider();
    return new ethers.Contract(
      CONTRACT_ADDRESSES.CreatorTokenFactory,
      CreatorTokenFactoryABI,
      provider
    );
  },

  // Obtener instancia con signer (escritura)
  getContractWithSigner: async () => {
    try {
      const signer = await getSigner();

      // Nota: No hacemos verificación adicional con getBlockNumber() porque:
      // 1. getSigner() ya validó que la wallet está conectada
      // 2. getBlockNumber puede fallar por razones de red (timeout, RPC caído)
      //    incluso cuando la wallet está correctamente conectada
      // 3. Esto causaba falsos positivos de "wallet desconectada"

      return new ethers.Contract(
        CONTRACT_ADDRESSES.CreatorTokenFactory,
        CreatorTokenFactoryABI,
        signer
      );
    } catch (error: any) {
      // Si el error ya es un mensaje claro, re-lanzarlo
      if (error?.message?.includes('desconectó') || error?.message?.includes('conectada')) {
        throw error;
      }
      // Si es un error de conexión, convertirlo a un mensaje claro
      if (error?.message?.includes('disconnected') ||
        error?.message?.includes('port') ||
        error?.code === 'UNKNOWN_ERROR') {
        throw new Error('La wallet se desconectó. Por favor, reconecta tu wallet e intenta de nuevo.');
      }
      throw error;
    }
  },

  // Obtener token de un creador
  getCreatorToken: async (creatorAddress: string) => {
    try {
      const contract = factoryService.getContract();
      const tokenAddress = await contract.getCreatorToken(creatorAddress);
      // Verificar si es una dirección válida (no 0x0)
      if (!tokenAddress || tokenAddress === '0x0000000000000000000000000000000000000000') {
        return null;
      }
      return tokenAddress;
    } catch (error: any) {
      // Si el contrato no está desplegado o el nodo no está corriendo, retornar null
      console.warn('⚠️  Error obteniendo token del creador:', error.message);
      return null;
    }
  },

  // Obtener el creator de un token
  getTokenCreator: async (tokenAddress: string) => {
    const contract = factoryService.getContract();
    return await contract.getTokenCreator(tokenAddress);
  },

  // Verificar si un creador está activo
  isCreatorActive: async (creatorAddress: string) => {
    const contract = factoryService.getContract();
    return await contract.isCreatorActive(creatorAddress);
  },

  // Obtener info de creador
  getCreatorInfo: async (creatorAddress: string) => {
    const contract = factoryService.getContract();
    const [tokenAddress, isActive, isBanned, createdAt, bannedAt, reason] =
      await contract.getCreatorInfo(creatorAddress);

    return {
      tokenAddress,
      isActive,
      isBanned,
      createdAt: Number(createdAt),
      bannedAt: Number(bannedAt),
      reason,
    };
  },

  // Obtener todos los tokens (paginado)
  getAllTokens: async (offset: number = 0, limit: number = 100) => {
    const contract = factoryService.getContract();
    return await contract.getAllTokens(offset, limit);
  },

  // Obtener total de tokens
  getTotalTokens: async () => {
    const contract = factoryService.getContract();
    const total = await contract.getTotalTokens();
    return Number(total);
  },

  // Crear token de creador
  createCreatorToken: async (name: string, symbol: string, initialPrice: string) => {
    try {
      const contract = await factoryService.getContractWithSigner();
      const priceInWei = ethers.parseEther(initialPrice);

      console.log('🪙 Creando token de creador...');
      console.log('   Nombre:', name);
      console.log('   Símbolo:', symbol);
      console.log('   Precio inicial:', initialPrice, 'ETH');

      const tx = await contract.createCreatorToken(name, symbol, priceInWei);
      console.log('   ✅ Transacción enviada, hash:', tx.hash);
      console.log('   ⏳ Esperando confirmación...');
      const receipt = await tx.wait();
      console.log('   ✅ Token creado exitosamente en bloque:', receipt.blockNumber);

      // Extraer la dirección del token del evento
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed?.name === 'CreatorTokenCreated';
        } catch {
          return false;
        }
      });

      if (event) {
        const parsed = contract.interface.parseLog(event);
        const tokenAddress = parsed?.args?.tokenAddress;
        console.log('   🆔 Dirección del token:', tokenAddress);
        return { receipt, tokenAddress };
      }

      return { receipt, tokenAddress: null };
    } catch (error: any) {
      console.error('   ❌ Error creando token:', error);

      // Detectar error específico de puerto desconectado (problema con extensión del navegador)
      const isPortDisconnectedError =
        error?.message?.includes('disconnected port') ||
        error?.error?.message?.includes('disconnected port') ||
        (typeof error?.error === 'object' && error.error?.message?.includes('disconnected port'));

      if (isPortDisconnectedError) {
        throw new Error('La conexión con la wallet se perdió. Por favor: 1) Recarga la extensión de wallet en chrome://extensions, 2) Refresca esta página, 3) Reconecta tu wallet');
      }

      // Detectar errores de conexión desconectada - múltiples formas de detectarlo
      const isDisconnectedError =
        error?.message?.includes('disconnected') ||
        error?.message?.includes('port') ||
        error?.code === 'UNKNOWN_ERROR' ||
        (error?.error?.message?.includes && error.error.message.includes('disconnected')) ||
        (error?.error?.message?.includes && error.error.message.includes('port')) ||
        (typeof error?.error === 'object' && error.error?.message?.includes('disconnected')) ||
        (typeof error?.error === 'object' && error.error?.message?.includes('port'));

      if (isDisconnectedError) {
        throw new Error('La wallet se desconectó. Por favor, reconecta tu wallet e intenta de nuevo.');
      }

      // Manejar errores de wallet no conectada
      if (error?.message?.includes('Wallet no está conectada') ||
        error?.message?.includes('No se encontró ninguna wallet')) {
        throw new Error('Wallet no está conectada. Por favor, conecta tu wallet primero.');
      }

      // Manejar rechazo de transacción
      if (error.code === 4001 || error.message?.includes('rejected') || error.message?.includes('denied')) {
        throw new Error('Transacción rechazada por el usuario');
      }

      // Manejar errores de contrato
      if (error.reason) {
        throw new Error(error.reason);
      }

      // Re-lanzar otros errores
      throw error;
    }
  },
};

// ==================== CREATOR TOKEN ====================

export const creatorTokenService = {
  // Obtener instancia del contrato (lectura)
  getContract: (tokenAddress: string) => {
    const provider = getProvider();
    return new ethers.Contract(tokenAddress, CreatorTokenABI, provider);
  },

  // Obtener instancia con signer (escritura)
  getContractWithSigner: async (tokenAddress: string) => {
    const signer = await getSigner();
    return new ethers.Contract(tokenAddress, CreatorTokenABI, signer);
  },

  // Obtener balance de un usuario
  getBalance: async (tokenAddress: string, userAddress: string) => {
    const contract = creatorTokenService.getContract(tokenAddress);
    const balance = await contract.balanceOf(userAddress);
    return ethers.formatUnits(balance, 18);
  },

  // Obtener información del token
  getTokenInfo: async (tokenAddress: string) => {
    const contract = creatorTokenService.getContract(tokenAddress);
    const [name, symbol, totalSupply, price, creator] = await contract.getTokenInfo();

    return {
      name,
      symbol,
      totalSupply: ethers.formatUnits(totalSupply, 18),
      price: ethers.formatEther(price),
      creator,
    };
  },

  // Verificar aprobación existente
  getAllowance: async (tokenAddress: string, ownerAddress: string, spenderAddress: string) => {
    const contract = creatorTokenService.getContract(tokenAddress);
    const allowance = await contract.allowance(ownerAddress, spenderAddress);
    return ethers.formatUnits(allowance, 18);
  },

  // Aprobar tokens
  approve: async (tokenAddress: string, spenderAddress: string, amount: string) => {
    const contract = await creatorTokenService.getContractWithSigner(tokenAddress);
    const amountInWei = ethers.parseUnits(amount, 18);

    console.log('📤 Enviando transacción approve...');
    console.log('   tokenAddress:', tokenAddress);
    console.log('   spenderAddress:', spenderAddress);
    console.log('   amountInWei:', amountInWei.toString());

    try {
      const tx = await contract.approve(spenderAddress, amountInWei);
      console.log('   ✅ Transacción enviada, hash:', tx.hash);
      console.log('   ⏳ Esperando confirmación...');
      const receipt = await tx.wait();
      console.log('   ✅ Transacción confirmada en bloque:', receipt.blockNumber);
      return receipt;
    } catch (error: any) {
      console.error('   ❌ Error en approve:', error);
      // Si el usuario rechazó la transacción
      if (error.code === 4001 || error.message?.includes('rejected') || error.message?.includes('denied')) {
        throw new Error('Transacción rechazada por el usuario');
      }
      // Si hay un error de contrato
      if (error.reason) {
        throw new Error(error.reason);
      }
      throw error;
    }
  },
};

// ==================== TOKEN EXCHANGE ====================

export const tokenExchangeService = {
  // Obtener instancia del contrato (lectura)
  getContract: () => {
    const provider = getProvider();
    return new ethers.Contract(
      CONTRACT_ADDRESSES.TokenExchange,
      TokenExchangeABI,
      provider
    );
  },

  // Obtener instancia con signer (escritura)
  getContractWithSigner: async () => {
    const signer = await getSigner();
    return new ethers.Contract(
      CONTRACT_ADDRESSES.TokenExchange,
      TokenExchangeABI,
      signer
    );
  },

  // Comprar tokens (con aprobación automática para PredictionMarket)
  buyTokens: async (creatorToken: string, nativeAmount: string) => {
    try {
      const contract = await tokenExchangeService.getContractWithSigner();
      const amountInWei = ethers.parseEther(nativeAmount);

      console.log('💰 Comprando tokens...');
      console.log('   Token:', creatorToken);
      console.log('   Cantidad nativa:', nativeAmount, 'ETH');

      // 1. Comprar tokens
      const buyTx = await contract.buyTokens(creatorToken, { value: amountInWei });
      console.log('   ✅ Compra enviada, esperando confirmación...');
      const buyReceipt = await buyTx.wait();
      console.log('   ✅ Tokens comprados exitosamente');

      // 2. Aprobar automáticamente para PredictionMarket (cantidad ilimitada)
      // Esto evita que el usuario tenga que pagar gas cada vez que apuesta
      const marketAddress = CONTRACT_ADDRESSES.PredictionMarket;
      console.log('   🔐 Aprobando tokens automáticamente para PredictionMarket...');
      console.log('   (Esto permite apostar sin pagar gas por aprobación)');

      try {
        const tokenContract = await creatorTokenService.getContractWithSigner(creatorToken);
        // Aprobar cantidad ilimitada (MaxUint256) para que no tenga que aprobar de nuevo
        const approveTx = await tokenContract.approve(marketAddress, ethers.MaxUint256);
        console.log('   ✅ Aprobación enviada...');
        const approveReceipt = await approveTx.wait();
        console.log('   ✅ Aprobación completada - Ahora puedes apostar sin pagar gas por aprobación!');

        return buyReceipt; // Retornar el receipt de la compra
      } catch (approveError: any) {
        console.warn('   ⚠️  No se pudo aprobar automáticamente:', approveError.message);
        console.warn('   ℹ️  Tendrás que aprobar manualmente antes de apostar');
        // No fallar la compra si la aprobación falla, solo advertir
        return buyReceipt;
      }
    } catch (error: any) {
      console.error('   ❌ Error comprando tokens:', error);

      // Manejar errores de conexión de wallet
      if (error?.message?.includes('disconnected') ||
        error?.message?.includes('port') ||
        error?.code === 'UNKNOWN_ERROR' && error?.error?.message?.includes('disconnected')) {
        throw new Error('La wallet se desconectó. Por favor, reconecta tu wallet e intenta de nuevo.');
      }

      // Manejar errores de wallet no conectada
      if (error?.message?.includes('Wallet no está conectada') ||
        error?.message?.includes('No se encontró ninguna wallet')) {
        throw new Error('Wallet no está conectada. Por favor, conecta tu wallet primero.');
      }

      // Manejar rechazo de transacción
      if (error.code === 4001 || error.message?.includes('rejected') || error.message?.includes('denied')) {
        throw new Error('Transacción rechazada por el usuario');
      }

      // Manejar errores de contrato
      if (error.reason) {
        throw new Error(error.reason);
      }

      // Re-lanzar otros errores
      throw error;
    }
  },

  // Vender tokens
  sellTokens: async (creatorToken: string, tokenAmount: string) => {
    const contract = await tokenExchangeService.getContractWithSigner();
    const amountInWei = ethers.parseUnits(tokenAmount, 18);
    const tx = await contract.sellTokens(creatorToken, amountInWei);
    return await tx.wait();
  },

  // Calcular cantidad al comprar
  calculateBuyAmount: async (creatorToken: string, nativeAmount: string) => {
    const contract = tokenExchangeService.getContract();
    const amountInWei = ethers.parseEther(nativeAmount);
    const [tokensAmount, fee] = await contract.calculateBuyAmount(creatorToken, amountInWei);

    return {
      tokensAmount: ethers.formatUnits(tokensAmount, 18),
      fee: ethers.formatEther(fee),
    };
  },

  // Calcular cantidad al vender
  calculateSellAmount: async (creatorToken: string, tokenAmount: string) => {
    const contract = tokenExchangeService.getContract();
    const amountInWei = ethers.parseUnits(tokenAmount, 18);
    const [nativeAmount, fee] = await contract.calculateSellAmount(creatorToken, amountInWei);

    return {
      nativeAmount: ethers.formatEther(nativeAmount),
      fee: ethers.formatEther(fee),
    };
  },

  // Obtener balance del contrato
  getContractBalance: async () => {
    const contract = tokenExchangeService.getContract();
    const balance = await contract.getContractBalance();
    return ethers.formatEther(balance);
  },

  // Obtener fee de plataforma
  getPlatformFee: async () => {
    const contract = tokenExchangeService.getContract();
    return Number(await contract.platformFee());
  },

  // Obtener ganancias acumuladas de un creador (en ETH)
  getCreatorEarnings: async (creatorAddress: string) => {
    const contract = tokenExchangeService.getContract();
    const value = await contract.creatorEarnings(creatorAddress);
    return ethers.formatEther(value);
  },
};

// ==================== PREDICTION MARKET ====================

export const predictionMarketService = {
  // Obtener instancia del contrato (lectura)
  getContract: () => {
    const provider = getProvider();
    return new ethers.Contract(
      CONTRACT_ADDRESSES.PredictionMarket,
      PredictionMarketABI,
      provider
    );
  },

  // Obtener instancia con signer (escritura)
  getContractWithSigner: async () => {
    const signer = await getSigner();
    return new ethers.Contract(
      CONTRACT_ADDRESSES.PredictionMarket,
      PredictionMarketABI,
      signer
    );
  },

  // Obtener detalles de una predicción
  getPrediction: async (predictionId: string) => {
    const contract = predictionMarketService.getContract();
    const prediction = await contract.predictions(predictionId);

    return {
      id: predictionId,
      creator: prediction.creator,
      creatorToken: prediction.creatorToken,
      title: prediction.title,
      description: prediction.description,
      createdAt: Number(prediction.createdAt),
      closesAt: Number(prediction.closesAt),
      resolvedAt: Number(prediction.resolvedAt),
      status: Number(prediction.status),
      winningOption: Number(prediction.winningOption),
      cooldownEndsAt: Number(prediction.cooldownEndsAt),
      reportCount: Number(prediction.reportCount),
      totalPool: ethers.formatEther(prediction.totalPool),
      creatorFee: Number(prediction.creatorFee),
    };
  },

  // Obtener opciones de una predicción
  getPredictionOptions: async (predictionId: string) => {
    const contract = predictionMarketService.getContract();
    const options = [];
    let index = 0;

    while (true) {
      try {
        const option = await contract.getBetOption(predictionId, index);
        options.push({
          index,
          description: option[0],
          totalAmount: ethers.formatEther(option[1]),
          totalBettors: Number(option[2]),
        });
        index++;
      } catch {
        break;
      }
    }

    return options;
  },

  // Obtener apuestas de un usuario en una predicción
  getUserBets: async (predictionId: string, userAddress: string) => {
    const contract = predictionMarketService.getContract();
    const bets = await contract.getUserBets(predictionId, userAddress);

    return bets.map((bet: any) => ({
      bettor: bet.bettor,
      optionIndex: Number(bet.optionIndex),
      amount: ethers.formatUnits(bet.amount, 18),
      claimed: bet.claimed,
    }));
  },

  // Realizar una apuesta
  placeBet: async (predictionId: string, optionIndex: number, tokenAmount: string) => {
    const contract = await predictionMarketService.getContractWithSigner();
    const amountInWei = ethers.parseUnits(tokenAmount, 18);
    const predictionIdNum = BigInt(predictionId); // Convertir a BigInt para uint256

    console.log('📤 Enviando transacción placeBet...');
    console.log('   predictionId:', predictionIdNum.toString());
    console.log('   optionIndex:', optionIndex);
    console.log('   amountInWei:', amountInWei.toString());

    try {
      const tx = await contract.placeBet(predictionIdNum, optionIndex, amountInWei);
      console.log('   ✅ Transacción enviada, hash:', tx.hash);
      console.log('   ⏳ Esperando confirmación...');
      const receipt = await tx.wait();
      console.log('   ✅ Transacción confirmada en bloque:', receipt.blockNumber);
      return receipt;
    } catch (error: any) {
      console.error('   ❌ Error en placeBet:', error);
      // Si el usuario rechazó la transacción
      if (error.code === 4001 || error.message?.includes('rejected') || error.message?.includes('denied')) {
        throw new Error('Transacción rechazada por el usuario');
      }
      // Si hay un error de contrato
      if (error.reason) {
        throw new Error(error.reason);
      }
      throw error;
    }
  },

  // Reclamar ganancias
  claimWinnings: async (predictionId: string) => {
    const contract = await predictionMarketService.getContractWithSigner();
    console.log('💰 Reclamando ganancias de predicción:', predictionId);
    const tx = await contract.claimReward(predictionId);
    console.log('   ✅ Transacción enviada, hash:', tx.hash);
    const receipt = await tx.wait();
    console.log('   ✅ Ganancias reclamadas exitosamente');
    return receipt;
  },

  // Reportar fraude
  reportFraud: async (predictionId: string, reason: string) => {
    const contract = await predictionMarketService.getContractWithSigner();
    const tx = await contract.reportOutcome(predictionId);
    return await tx.wait();
  },

  // Confirmar automáticamente si el cooldown terminó
  autoConfirmOutcome: async (predictionId: string) => {
    const contract = await predictionMarketService.getContractWithSigner();

    console.log('⏰ Verificando si el cooldown terminó...');
    console.log('   Predicción ID:', predictionId);

    try {
      const tx = await contract.autoConfirmOutcome(predictionId);
      console.log('   ✅ Transacción enviada, hash:', tx.hash);
      console.log('   ⏳ Esperando confirmación...');
      const receipt = await tx.wait();
      console.log('   ✅ Predicción confirmada automáticamente en bloque:', receipt.blockNumber);
      return receipt;
    } catch (error: any) {
      // Si el error es que el cooldown no terminó o ya está confirmada, no es un error crítico
      if (error.reason?.includes('Cooldown not finished') ||
        error.reason?.includes('Not in cooldown') ||
        error.reason?.includes('Prediction not confirmed')) {
        console.log('   ℹ️  El cooldown aún no terminó o ya está confirmada');
        return null;
      }
      console.error('   ❌ Error confirmando automáticamente:', error);
      throw error;
    }
  },

  // Crear predicción (para creadores)
  createPrediction: async (
    creatorToken: string,
    title: string,
    description: string,
    optionDescriptions: string[],
    duration: number // en segundos
  ) => {
    const contract = await predictionMarketService.getContractWithSigner();

    console.log('🎯 Creando predicción...');
    console.log('   Token del creador:', creatorToken);
    console.log('   Título:', title);
    console.log('   Opciones:', optionDescriptions);
    console.log('   Duración:', duration, 'segundos');

    try {
      const tx = await contract.createPrediction(
        creatorToken,
        title,
        description,
        optionDescriptions,
        duration
      );
      console.log('   ✅ Transacción enviada, hash:', tx.hash);
      console.log('   ⏳ Esperando confirmación...');
      const receipt = await tx.wait();
      console.log('   ✅ Predicción creada exitosamente en bloque:', receipt.blockNumber);

      // Extraer el ID de la predicción del evento
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed?.name === 'PredictionCreated';
        } catch {
          return false;
        }
      });

      if (event) {
        const parsed = contract.interface.parseLog(event);
        const predictionId = parsed?.args?.predictionId?.toString();
        console.log('   🆔 ID de la predicción:', predictionId);
        return { receipt, predictionId };
      }

      return { receipt, predictionId: null };
    } catch (error: any) {
      console.error('   ❌ Error creando predicción:', error);
      if (error.code === 4001 || error.message?.includes('rejected')) {
        throw new Error('Transacción rechazada por el usuario');
      }
      if (error.reason) {
        throw new Error(error.reason);
      }
      throw error;
    }
  },

  // Resolver predicción (para creadores)
  // Cerrar predicción manualmente (para creadores)
  closePrediction: async (predictionId: string) => {
    const contract = await predictionMarketService.getContractWithSigner();

    console.log('🔒 Cerrando predicción...');
    console.log('   Predicción ID:', predictionId);

    try {
      const tx = await contract.closePrediction(predictionId);
      console.log('   ✅ Transacción enviada, hash:', tx.hash);
      console.log('   ⏳ Esperando confirmación...');
      const receipt = await tx.wait();
      console.log('   ✅ Predicción cerrada exitosamente en bloque:', receipt.blockNumber);
      return receipt;
    } catch (error: any) {
      console.error('   ❌ Error cerrando predicción:', error);
      if (error.code === 4001 || error.message?.includes('rejected')) {
        throw new Error('Transacción rechazada por el usuario');
      }
      if (error.reason) {
        throw new Error(error.reason);
      }
      throw error;
    }
  },

  resolvePrediction: async (predictionId: string, winningOptionIndex: number) => {
    const contract = await predictionMarketService.getContractWithSigner();

    console.log('🏁 Resolviendo predicción...');
    console.log('   Predicción ID:', predictionId);
    console.log('   Opción ganadora:', winningOptionIndex);

    try {
      const tx = await contract.resolvePrediction(predictionId, winningOptionIndex);
      console.log('   ✅ Transacción enviada, hash:', tx.hash);
      console.log('   ⏳ Esperando confirmación...');
      const receipt = await tx.wait();
      console.log('   ✅ Predicción resuelta exitosamente en bloque:', receipt.blockNumber);
      return receipt;
    } catch (error: any) {
      console.error('   ❌ Error resolviendo predicción:', error);
      if (error.code === 4001 || error.message?.includes('rejected')) {
        throw new Error('Transacción rechazada por el usuario');
      }
      if (error.reason) {
        throw new Error(error.reason);
      }
      throw error;
    }
  },

  // Verificar si un usuario ha apostado en una predicción
  hasUserBet: async (predictionId: string, userAddress: string) => {
    const bets = await predictionMarketService.getUserBets(predictionId, userAddress);
    return bets.length > 0;
  },

  // Calcular ganancias potenciales
  calculatePotentialWinnings: async (predictionId: string, optionIndex: number, betAmount: string) => {
    const prediction = await predictionMarketService.getPrediction(predictionId);
    const options = await predictionMarketService.getPredictionOptions(predictionId);

    const totalPool = parseFloat(prediction.totalPool);
    const optionTotal = parseFloat(options[optionIndex].totalAmount);
    const bet = parseFloat(betAmount);

    // Si no hay perdedores, devolver la apuesta
    const losingPool = totalPool - optionTotal;
    if (losingPool <= 0) {
      return {
        winnings: bet.toFixed(4),
        profit: '0.0000',
        multiplier: '1.00',
      };
    }

    // Los ganadores reciben TODO el pool de perdedores proporcionalmente
    // Recompensa = apuesta + proporción del pool de perdedores
    const winnings = bet + ((bet * losingPool) / optionTotal);

    return {
      winnings: winnings.toFixed(4),
      profit: (winnings - bet).toFixed(4),
      multiplier: (winnings / bet).toFixed(2),
    };
  },

  // Calcular cuánto puede reclamar el usuario (para apuestas ganadoras ya confirmadas)
  calculateClaimableReward: async (predictionId: string, userAddress: string) => {
    const bets = await predictionMarketService.getUserBets(predictionId, userAddress);
    const prediction = await predictionMarketService.getPrediction(predictionId);

    // Solo calcular si la predicción está confirmada y tiene un ganador
    if (prediction.status !== 4 || prediction.winningOption === null) {
      return { claimable: '0', hasWinningBets: false };
    }

    let totalClaimable = 0;
    let hasWinningBets = false;

    for (const bet of bets) {
      // Solo contar apuestas ganadoras que no han sido reclamadas
      if (bet.optionIndex === prediction.winningOption && !bet.claimed) {
        hasWinningBets = true;

        // Calcular recompensa para esta apuesta
        const options = await predictionMarketService.getPredictionOptions(predictionId);
        const totalPool = parseFloat(prediction.totalPool);
        const winningPool = parseFloat(options[prediction.winningOption].totalAmount);
        const losingPool = totalPool - winningPool;
        const betAmount = parseFloat(bet.amount);

        if (losingPool <= 0) {
          // Si no hubo perdedores, devolver la apuesta
          totalClaimable += betAmount;
        } else {
          // Recompensa = apuesta + proporción del pool de perdedores
          totalClaimable += betAmount + ((betAmount * losingPool) / winningPool);
        }
      }
    }

    return {
      claimable: totalClaimable.toFixed(4),
      hasWinningBets,
    };
  },
};

