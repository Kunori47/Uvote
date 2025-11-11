import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * Script de despliegue completo del sistema de predicciones
 * 
 * Orden de despliegue:
 * 1. CreatorTokenFactory
 * 2. PredictionMarket (necesita factory)
 * 3. TokenExchange (necesita factory)
 * 4. Configurar permisos entre contratos
 */

const UvoteSystemModule = buildModule("UvoteSystem", (m) => {
  // 1. Desplegar CreatorTokenFactory
  const factory = m.contract("CreatorTokenFactory");
  
  // 2. Desplegar PredictionMarket (pasando la dirección del factory)
  const predictionMarket = m.contract("PredictionMarket", [factory]);
  
  // 3. Desplegar TokenExchange (pasando la dirección del factory)
  const tokenExchange = m.contract("TokenExchange", [factory]);
  
  // Nota: La configuración de permisos se debe hacer después del deployment
  // mediante scripts separados o llamadas manuales:
  // - factory.setAuthorizedContract(predictionMarket, true)
  // - factory.setAuthorizedContract(tokenExchange, true)
  
  return { factory, predictionMarket, tokenExchange };
});

export default UvoteSystemModule;

