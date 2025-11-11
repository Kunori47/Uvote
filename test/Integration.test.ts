import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("Integration Test - Full Flow", function () {
  let factory: any;
  let market: any;
  let exchange: any;
  let creatorToken: any;
  let owner: any;
  let creator: any;
  let bettor1: any;
  let bettor2: any;
  let bettor3: any;
  
  const INITIAL_PRICE = ethers.parseEther("0.01"); // 0.01 DEV por token
  const THIRTY_DAYS = 30 * 24 * 60 * 60;
  const TEN_MINUTES = 10 * 60;
  
  describe("Complete Prediction Lifecycle", function () {
    before(async function () {
      [owner, creator, bettor1, bettor2, bettor3] = await ethers.getSigners();
      
      console.log("\n🚀 Desplegando sistema completo...");
      
      // 1. Desplegar Factory
      const FactoryContract = await ethers.getContractFactory("CreatorTokenFactory");
      factory = await FactoryContract.deploy();
      console.log("✅ Factory desplegado");
      
      // 2. Desplegar PredictionMarket
      const MarketContract = await ethers.getContractFactory("PredictionMarket");
      market = await MarketContract.deploy(await factory.getAddress());
      console.log("✅ PredictionMarket desplegado");
      
      // 3. Desplegar TokenExchange
      const ExchangeContract = await ethers.getContractFactory("TokenExchange");
      exchange = await ExchangeContract.deploy(await factory.getAddress());
      console.log("✅ TokenExchange desplegado");
      
      // 4. Autorizar contratos en Factory
      await factory.connect(owner).setAuthorizedContract(await market.getAddress(), true);
      await factory.connect(owner).setAuthorizedContract(await exchange.getAddress(), true);
      console.log("✅ Contratos autorizados\n");
    });
    
    it("Step 1: Creator registers their token", async function () {
      console.log("📝 Paso 1: Creador registra su token");
      
      await factory.connect(creator).createCreatorToken(
        "Ibaisitos",
        "IBAI",
        INITIAL_PRICE
      );
      
      const tokenAddress = await factory.getCreatorToken(creator.address);
      creatorToken = await ethers.getContractAt("CreatorToken", tokenAddress);
      
      console.log(`  Token creado: ${await creatorToken.name()} (${await creatorToken.symbol()})`);
      console.log(`  Precio: ${ethers.formatEther(await creatorToken.tokenPrice())} DEV por token`);
      
      expect(await creatorToken.name()).to.equal("Ibaisitos");
      expect(await factory.isCreatorActive(creator.address)).to.be.true;
    });
    
    it("Step 2: Users buy creator tokens with native currency", async function () {
      console.log("\n💰 Paso 2: Usuarios compran tokens del creador");
      
      // Autorizar exchange para mint
      await creatorToken.connect(creator).setAuthorizedMinter(await exchange.getAddress(), true);
      
      // Bettors compran tokens
      for (const [index, bettor] of [bettor1, bettor2, bettor3].entries()) {
        const buyAmount = ethers.parseEther("1"); // 1 DEV cada uno
        
        await exchange.connect(bettor).buyTokens(await creatorToken.getAddress(), {
          value: buyAmount
        });
        
        const balance = await creatorToken.balanceOf(bettor.address);
        console.log(`  Bettor ${index + 1} compró: ${ethers.formatUnits(balance, 18)} tokens`);
      }
      
      const totalSupply = await creatorToken.totalSupply();
      console.log(`  Supply total: ${ethers.formatUnits(totalSupply, 18)} tokens`);
      
      expect(totalSupply).to.be.gt(0);
    });
    
    it("Step 3: Creator creates a prediction", async function () {
      console.log("\n🎯 Paso 3: Creador crea una predicción");
      
      // Autorizar market para mint/burn
      await creatorToken.connect(creator).setAuthorizedMinter(await market.getAddress(), true);
      
      await market.connect(creator).createPrediction(
        await creatorToken.getAddress(),
        "¿Gana el Real Madrid?",
        "Partido Real Madrid vs Barcelona - Liga Española",
        ["Real Madrid gana", "Barcelona gana o empate"],
        3600, // 1 hora
        5     // 5% fee para el creador
      );
      
      const predInfo = await market.getPredictionInfo(1);
      console.log(`  Predicción creada: ${predInfo.title}`);
      console.log(`  Opciones: 2`);
      console.log(`  Estado: Active`);
      
      expect(predInfo.status).to.equal(0); // Active
    });
    
    it("Step 4: Users place bets", async function () {
      console.log("\n🎲 Paso 4: Usuarios apuestan");
      
      const predictionId = 1;
      
      // Bettor1 apuesta por Madrid (opción 0)
      await creatorToken.connect(bettor1).approve(
        await market.getAddress(),
        ethers.parseUnits("50", 18)
      );
      await market.connect(bettor1).placeBet(predictionId, 0, ethers.parseUnits("50", 18));
      console.log("  Bettor1: 50 tokens en 'Real Madrid gana'");
      
      // Bettor2 apuesta por Madrid (opción 0)
      await creatorToken.connect(bettor2).approve(
        await market.getAddress(),
        ethers.parseUnits("30", 18)
      );
      await market.connect(bettor2).placeBet(predictionId, 0, ethers.parseUnits("30", 18));
      console.log("  Bettor2: 30 tokens en 'Real Madrid gana'");
      
      // Bettor3 apuesta por Barcelona/Empate (opción 1)
      await creatorToken.connect(bettor3).approve(
        await market.getAddress(),
        ethers.parseUnits("20", 18)
      );
      await market.connect(bettor3).placeBet(predictionId, 1, ethers.parseUnits("20", 18));
      console.log("  Bettor3: 20 tokens en 'Barcelona gana o empate'");
      
      const pred = await market.predictions(predictionId);
      console.log(`  Pool total: ${ethers.formatUnits(pred.totalPool, 18)} tokens`);
      
      expect(pred.totalPool).to.equal(ethers.parseUnits("100", 18));
    });
    
    it("Step 5: Creator closes and resolves prediction", async function () {
      console.log("\n⚡ Paso 5: Creador cierra y resuelve la predicción");
      
      const predictionId = 1;
      
      // Cerrar predicción
      await market.connect(creator).closePrediction(predictionId);
      console.log("  Predicción cerrada");
      
      // Resolver: Madrid ganó (opción 0)
      await market.connect(creator).resolvePrediction(predictionId, 0);
      console.log("  Resultado declarado: Real Madrid ganó");
      
      const pred = await market.predictions(predictionId);
      console.log(`  Estado: Cooldown (${TEN_MINUTES / 60} minutos)`);
      
      expect(pred.status).to.equal(2); // Cooldown
      expect(pred.winningOption).to.equal(0);
    });
    
    it("Step 6: No reports during cooldown (result is correct)", async function () {
      console.log("\n✅ Paso 6: Período de cooldown sin reportes");
      
      console.log("  Los usuarios verifican el resultado...");
      console.log("  No hay reportes (el resultado es correcto)");
      
      const predictionId = 1;
      const pred = await market.predictions(predictionId);
      
      expect(pred.reportCount).to.equal(0);
    });
    
    it("Step 7: Admin confirms outcome after cooldown", async function () {
      console.log("\n👨‍⚖️ Paso 7: Admin confirma el resultado");
      
      const predictionId = 1;
      
      // Confirmar outcome
      await market.connect(owner).confirmOutcome(predictionId);
      console.log("  Resultado confirmado por el admin");
      
      const pred = await market.predictions(predictionId);
      console.log("  Estado: Confirmed");
      
      expect(pred.status).to.equal(4); // Confirmed
    });
    
    it("Step 8: Winners claim their rewards", async function () {
      console.log("\n🏆 Paso 8: Ganadores reclaman sus recompensas");
      
      const predictionId = 1;
      
      // Bettor1 reclama (ganó)
      const bettor1BalanceBefore = await creatorToken.balanceOf(bettor1.address);
      await market.connect(bettor1).claimReward(predictionId);
      const bettor1BalanceAfter = await creatorToken.balanceOf(bettor1.address);
      const bettor1Reward = bettor1BalanceAfter - bettor1BalanceBefore;
      console.log(`  Bettor1 reclamó: ${ethers.formatUnits(bettor1Reward, 18)} tokens`);
      
      // Bettor2 reclama (ganó)
      const bettor2BalanceBefore = await creatorToken.balanceOf(bettor2.address);
      await market.connect(bettor2).claimReward(predictionId);
      const bettor2BalanceAfter = await creatorToken.balanceOf(bettor2.address);
      const bettor2Reward = bettor2BalanceAfter - bettor2BalanceBefore;
      console.log(`  Bettor2 reclamó: ${ethers.formatUnits(bettor2Reward, 18)} tokens`);
      
      // Bettor3 no puede reclamar (perdió)
      await expect(
        market.connect(bettor3).claimReward(predictionId)
      ).to.be.revertedWith("No rewards to claim");
      console.log("  Bettor3: No hay recompensas (perdió)");
      
      expect(bettor1Reward).to.be.gt(ethers.parseUnits("50", 18)); // Ganó más de lo que apostó
      expect(bettor2Reward).to.be.gt(ethers.parseUnits("30", 18));
    });
    
    it("Step 9: Winners sell tokens back for native currency", async function () {
      console.log("\n💸 Paso 9: Ganadores venden tokens por DEV");
      
      // Añadir liquidez al exchange
      await owner.sendTransaction({
        to: await exchange.getAddress(),
        value: ethers.parseEther("10")
      });
      
      // Bettor1 vende todos sus tokens
      const bettor1Balance = await creatorToken.balanceOf(bettor1.address);
      await creatorToken.connect(bettor1).approve(await exchange.getAddress(), bettor1Balance);
      
      const initialNativeBalance = await ethers.provider.getBalance(bettor1.address);
      
      await exchange.connect(bettor1).sellTokens(await creatorToken.getAddress(), bettor1Balance);
      
      const finalNativeBalance = await ethers.provider.getBalance(bettor1.address);
      console.log(`  Bettor1 vendió ${ethers.formatUnits(bettor1Balance, 18)} tokens`);
      console.log(`  Bettor1 ganó DEV en la operación completa`);
      
      expect(await creatorToken.balanceOf(bettor1.address)).to.equal(0);
    });
    
    it("Summary: Verify system state", async function () {
      console.log("\n📊 Resumen del sistema:");
      
      const totalTokens = await factory.getTotalTokens();
      console.log(`  Tokens creados: ${totalTokens}`);
      
      const isCreatorActive = await factory.isCreatorActive(creator.address);
      console.log(`  Creador activo: ${isCreatorActive}`);
      
      const nextPredictionId = await market.nextPredictionId();
      console.log(`  Predicciones creadas: ${nextPredictionId - 1n}`);
      
      const exchangeFees = await exchange.accumulatedFees();
      console.log(`  Fees acumulados: ${ethers.formatEther(exchangeFees)} DEV`);
      
      console.log("\n✅ Flujo completo ejecutado exitosamente!\n");
      
      expect(totalTokens).to.equal(1);
      expect(isCreatorActive).to.be.true;
    });
  });
  
  describe("Fraud Detection Flow", function () {
    let fraudFactory: any;
    let fraudMarket: any;
    let fraudToken: any;
    let fraudCreator: any;
    let victim1: any;
    let victim2: any;
    
    before(async function () {
      [owner, fraudCreator, victim1, victim2] = await ethers.getSigners();
      
      console.log("\n🚨 Testing fraud detection flow...");
      
      // Setup sistema
      const FactoryContract = await ethers.getContractFactory("CreatorTokenFactory");
      fraudFactory = await FactoryContract.deploy();
      
      const MarketContract = await ethers.getContractFactory("PredictionMarket");
      fraudMarket = await MarketContract.deploy(await fraudFactory.getAddress());
      
      const ExchangeContract = await ethers.getContractFactory("TokenExchange");
      const fraudExchange = await ExchangeContract.deploy(await fraudFactory.getAddress());
      
      // Crear token
      await fraudFactory.connect(fraudCreator).createCreatorToken(
        "FraudToken",
        "FRAUD",
        INITIAL_PRICE
      );
      
      const tokenAddress = await fraudFactory.getCreatorToken(fraudCreator.address);
      fraudToken = await ethers.getContractAt("CreatorToken", tokenAddress);
      
      await fraudToken.connect(fraudCreator).setAuthorizedMinter(await fraudExchange.getAddress(), true);
      await fraudToken.connect(fraudCreator).setAuthorizedMinter(await fraudMarket.getAddress(), true);
      
      // Usuarios compran tokens
      for (const victim of [victim1, victim2]) {
        await fraudExchange.connect(victim).buyTokens(await fraudToken.getAddress(), {
          value: ethers.parseEther("1")
        });
      }
    });
    
    it("Fraudulent creator declares wrong result", async function () {
      console.log("\n🎭 Creador fraudulento crea predicción");
      
      // Crear predicción
      await fraudMarket.connect(fraudCreator).createPrediction(
        await fraudToken.getAddress(),
        "Predicción fraudulenta",
        "Resultado manipulado",
        ["Opción A", "Opción B"],
        3600,
        5
      );
      
      // Usuarios apuestan por opción 0
      for (const victim of [victim1, victim2]) {
        await fraudToken.connect(victim).approve(
          await fraudMarket.getAddress(),
          ethers.parseUnits("50", 18)
        );
        await fraudMarket.connect(victim).placeBet(1, 0, ethers.parseUnits("50", 18));
      }
      
      // Cerrar y resolver INCORRECTAMENTE (dice que ganó opción 1)
      await fraudMarket.connect(fraudCreator).closePrediction(1);
      await fraudMarket.connect(fraudCreator).resolvePrediction(1, 1); // Resultado falso
      
      console.log("  Creador declaró resultado INCORRECTO");
    });
    
    it("Users report fraudulent outcome", async function () {
      console.log("\n🚩 Usuarios reportan el fraude");
      
      // Configurar umbral bajo para testing
      await fraudMarket.connect(owner).setReportThreshold(40, 2);
      
      // Usuarios reportan
      await fraudMarket.connect(victim1).reportOutcome(1);
      console.log("  Victim1 reportó");
      
      await fraudMarket.connect(victim2).reportOutcome(1);
      console.log("  Victim2 reportó");
      
      const pred = await fraudMarket.predictions(1);
      expect(pred.status).to.equal(3); // UnderReview
      console.log("  Estado: UnderReview");
    });
    
    it("Admin flags fraud and bans creator", async function () {
      console.log("\n👮 Admin marca como fraude y banea al creador");
      
      // Transferir ownership para testing
      await fraudFactory.connect(owner).transferOwnership(await fraudMarket.getAddress());
      
      await fraudMarket.connect(owner).flagFraud(1, "Resultado manipulado");
      
      const pred = await fraudMarket.predictions(1);
      expect(pred.status).to.equal(5); // Disputed
      
      const isActive = await fraudFactory.isCreatorActive(fraudCreator.address);
      expect(isActive).to.be.false;
      
      console.log("  Creador baneado");
      console.log("  Predicción marcada como Disputed");
    });
    
    it("Victims claim refunds", async function () {
      console.log("\n💰 Víctimas reclaman reembolsos");
      
      for (const [index, victim] of [victim1, victim2].entries()) {
        const balanceBefore = await fraudToken.balanceOf(victim.address);
        await fraudMarket.connect(victim).claimRefund(1);
        const balanceAfter = await fraudToken.balanceOf(victim.address);
        
        const refund = balanceAfter - balanceBefore;
        console.log(`  Victim${index + 1} recibió reembolso: ${ethers.formatUnits(refund, 18)} tokens`);
        
        expect(refund).to.equal(ethers.parseUnits("50", 18));
      }
      
      console.log("\n✅ Sistema anti-fraude funcionó correctamente!\n");
    });
  });
});

