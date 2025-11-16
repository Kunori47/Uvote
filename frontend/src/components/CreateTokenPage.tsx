import { useState, useEffect } from 'react';
import { ArrowLeft, Coins, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import React from 'react';
import { useWallet } from '../hooks/useWallet';
import { factoryService, creatorTokenService } from '../lib/contractService';
import { CONTRACT_ADDRESSES } from '../lib/contracts';
import { apiService, generateAuthToken } from '../lib/apiService';
import { getSigner } from '../lib/contracts';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

interface CreateTokenPageProps {
  onBack?: () => void;
  onCreated?: () => void;
}

export function CreateTokenPage({ onBack, onCreated }: CreateTokenPageProps) {
  const { address, isConnected } = useWallet();
  
  // Estados del formulario
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [initialPrice, setInitialPrice] = useState('0.01');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  
  // Estados de la UI
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdTokenAddress, setCreatedTokenAddress] = useState<string | null>(null);
  
  // Estado de verificación
  const [hasToken, setHasToken] = useState(false);
  const [checkingToken, setCheckingToken] = useState(false);

  // Verificar si el usuario ya tiene un token
  useEffect(() => {
    const checkToken = async () => {
      if (!address || !isConnected) {
        setHasToken(false);
        return;
      }
      
      try {
        setCheckingToken(true);
        const tokenAddress = await factoryService.getCreatorToken(address);
        if (tokenAddress && tokenAddress !== '0x0000000000000000000000000000000000000000') {
          setHasToken(true);
          setError('Ya tienes un token de creador');
        } else {
          setHasToken(false);
          setError(null); // Limpiar error si no hay token
        }
      } catch (err: any) {
        console.warn('⚠️  Error verificando token (puede ser que el nodo no esté corriendo):', err.message);
        // No mostrar error al usuario si es un problema de conexión
        setHasToken(false);
        setError(null);
      } finally {
        setCheckingToken(false);
      }
    };
    
    checkToken();
  }, [address, isConnected]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    } else {
      setImagePreview(null);
    }
  };

  const handleCreate = async () => {
    if (!address) return;
    
    // Validaciones
    if (!name.trim()) {
      setError('El nombre es requerido');
      return;
    }
    
    if (!symbol.trim()) {
      setError('El símbolo es requerido');
      return;
    }
    
    if (symbol.length > 10) {
      setError('El símbolo debe tener máximo 10 caracteres');
      return;
    }
    
    const priceNum = parseFloat(initialPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('El precio debe ser mayor a 0');
      return;
    }
    
    try {
      setIsCreating(true);
      setError(null);
      
      // 1) Subir imagen a Supabase Storage (si hay)
      let coinImageUrl: string | undefined = undefined;
      if (imageFile) {
        try {
          console.log('📤 Subiendo imagen de moneda...');
          const signer = await getSigner();
          const authToken = await generateAuthToken(address, signer);
          const uploadResult = await apiService.uploadImage(imageFile, 'moneda', authToken);
          coinImageUrl = uploadResult.url;
          console.log('✅ Imagen subida:', coinImageUrl);
        } catch (uploadError: any) {
          console.error('Error subiendo imagen:', uploadError);
          setError(uploadError?.message || 'Error al subir la imagen de la moneda');
          setIsCreating(false);
          return;
        }
      }
      
      // 2) Crear token en blockchain
      console.log('🪙 Creando token de creador...');
      const result = await factoryService.createCreatorToken(name, symbol, initialPrice);
      
      if (!result.tokenAddress) {
        throw new Error('No se pudo obtener la dirección del token creado');
      }

      console.log('✅ Token creado en blockchain:', result.tokenAddress);
      
      // 3) Autorizar TokenExchange como minter para que los usuarios puedan comprar tokens
      console.log('🔐 Autorizando TokenExchange como minter...');
      try {
        const tokenContract = await creatorTokenService.getContractWithSigner(result.tokenAddress);
        const authTx = await tokenContract.setAuthorizedMinter(CONTRACT_ADDRESSES.TokenExchange, true);
        console.log('   ⏳ Esperando confirmación de autorización...');
        await authTx.wait();
        console.log('✅ TokenExchange autorizado como minter');
      } catch (authErr: any) {
        console.warn('⚠️  No se pudo autorizar TokenExchange automáticamente:', authErr.message);
        console.warn('   El token fue creado, pero necesitarás autorizar el Exchange manualmente');
        // No fallar la creación del token si la autorización falla
      }

      // 4) También autorizar PredictionMarket para que se puedan usar tokens en apuestas
      console.log('🔐 Autorizando PredictionMarket como minter...');
      try {
        const tokenContract = await creatorTokenService.getContractWithSigner(result.tokenAddress);
        const authTx = await tokenContract.setAuthorizedMinter(CONTRACT_ADDRESSES.PredictionMarket, true);
        await authTx.wait();
        console.log('✅ PredictionMarket autorizado como minter');
      } catch (authErr: any) {
        console.warn('⚠️  No se pudo autorizar PredictionMarket automáticamente:', authErr.message);
        // No fallar la creación del token si la autorización falla
      }
      
      // 5) Guardar token en la base de datos
      try {
        console.log('💾 Guardando token en la base de datos...');
        const signer = await getSigner();
        const authToken = await generateAuthToken(address, signer);
        await apiService.registerToken({
          token_address: result.tokenAddress,
          name: name.trim(),
          symbol: symbol.trim().toUpperCase(),
          coin_image_url: coinImageUrl,
          description: description.trim() || undefined,
        }, authToken);
        console.log('✅ Token guardado en la base de datos');
      } catch (dbError: any) {
        console.error('⚠️  Error guardando token en la base de datos:', dbError);
        console.warn('   El token fue creado en blockchain, pero no se pudo guardar en la BD');
        // No fallar la creación del token si el guardado en BD falla
      }
      
      setSuccess(true);
      setCreatedTokenAddress(result.tokenAddress);
      
      // Redirigir después de 3 segundos
      setTimeout(() => {
        if (onCreated) {
          onCreated();
        } else if (onBack) {
          onBack();
        }
      }, 3000);
    } catch (err: any) {
      console.error('Error creando token:', err);
      setError(err.message || 'Error al crear el token');
    } finally {
      setIsCreating(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="w-16 h-16 text-yellow-400 mb-4" />
          <h2 className="text-2xl font-bold text-slate-100 mb-2">Wallet no conectada</h2>
          <p className="text-slate-400 mb-6">Conecta tu wallet para crear tu token de creador</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  if (checkingToken) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mb-4" />
          <p className="text-slate-400">Verificando...</p>
        </div>
      </div>
    );
  }

  if (hasToken) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex flex-col items-center justify-center py-20">
          <Coins className="w-16 h-16 text-emerald-400 mb-4" />
          <h2 className="text-2xl font-bold text-slate-100 mb-2">Ya tienes un token de creador</h2>
          <p className="text-slate-400 mb-6">Solo puedes tener un token de creador por wallet</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver
        </button>
        
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Crear Token de Creador</h1>
        <p className="text-slate-400">
          Crea tu propio token para empezar a crear predicciones. Tus seguidores usarán este token para participar.
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
          <div>
            <p className="text-green-400 font-medium">¡Token creado exitosamente!</p>
            {createdTokenAddress && (
              <p className="text-green-400/70 text-sm">Dirección: {createdTokenAddress}</p>
            )}
            <p className="text-green-400/70 text-sm mt-1">Redirigiendo...</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Info Box */}
      <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
        <h3 className="text-blue-400 font-medium mb-2">📌 Importante</h3>
        <ul className="text-blue-300/80 text-sm space-y-1">
          <li>• Solo puedes crear un token de creador por wallet</li>
          <li>• El nombre y símbolo no se pueden cambiar después</li>
          <li>• El precio inicial puede actualizarse una vez al mes</li>
          <li>• Los usuarios comprarán tus tokens para participar en tus predicciones</li>
        </ul>
      </div>

      {/* Form */}
      <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-6 space-y-6">
        {/* Imagen de la Moneda */}
        <div>
          <label className="block text-slate-300 font-medium mb-2">
            Imagen de la Moneda (opcional)
          </label>
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20 border-2 border-slate-700">
              <AvatarImage src={imagePreview || `https://api.dicebear.com/7.x/shapes/svg?seed=${symbol || 'token'}`} />
              <AvatarFallback className="bg-emerald-500/20 border border-emerald-500/30">
                <Coins className="w-10 h-10 text-emerald-400" />
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-2 flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={isCreating}
                className="text-sm text-slate-300 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="text-[11px] text-slate-500">
                Recomendado: imagen cuadrada, máximo ~2MB. Se guardará en Supabase Storage.
              </p>
            </div>
          </div>
        </div>

        {/* Nombre del Token */}
        <div>
          <label className="block text-slate-300 font-medium mb-2">
            Nombre del Token <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Ibaisitos"
            maxLength={50}
            disabled={isCreating}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="text-slate-500 text-xs mt-1">{name.length}/50 caracteres</p>
        </div>

        {/* Símbolo */}
        <div>
          <label className="block text-slate-300 font-medium mb-2">
            Símbolo <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="Ej: IBAI"
            maxLength={10}
            disabled={isCreating}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none uppercase disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="text-slate-500 text-xs mt-1">{symbol.length}/10 caracteres</p>
        </div>

        {/* Precio Inicial */}
        <div>
          <label className="block text-slate-300 font-medium mb-2">
            Precio Inicial (ETH) <span className="text-red-400">*</span>
          </label>
          <input
            type="number"
            value={initialPrice}
            onChange={(e) => setInitialPrice(e.target.value)}
            placeholder="0.01"
            min="0.000001"
            step="0.001"
            disabled={isCreating}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="text-slate-500 text-xs mt-1">
            Precio por token. Puedes actualizarlo una vez al mes después de crearlo.
          </p>
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-slate-300 font-medium mb-2">
            Descripción (opcional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe tu token de creador..."
            maxLength={500}
            rows={3}
            disabled={isCreating}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none resize-none disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="text-slate-500 text-xs mt-1">{description.length}/500 caracteres</p>
        </div>

        {/* Preview */}
        {name && symbol && (
          <div className="pt-6 border-t border-slate-800">
            <h3 className="text-slate-300 font-medium mb-3">Vista previa</h3>
            <div className="bg-slate-800/50 rounded-lg p-4 flex items-center gap-4">
              <Avatar className="w-16 h-16 border-2 border-slate-700">
                <AvatarImage src={imagePreview || `https://api.dicebear.com/7.x/shapes/svg?seed=${symbol}`} />
                <AvatarFallback className="bg-emerald-500/20 border border-emerald-500/30">
                  <Coins className="w-8 h-8 text-emerald-400" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="text-slate-100 font-medium">{name}</div>
                <div className="text-slate-400 text-sm">{symbol}</div>
                <div className="text-emerald-400 text-sm">{initialPrice} ETH por token</div>
                {description && (
                  <div className="text-slate-500 text-xs mt-2 line-clamp-2">{description}</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-6 border-t border-slate-800">
          <button
            onClick={handleCreate}
            disabled={isCreating || success || !name || !symbol || !initialPrice}
            className="w-full px-6 py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creando Token...
              </>
            ) : success ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                ¡Token Creado!
              </>
            ) : (
              <>
                <Coins className="w-5 h-5" />
                Crear Token
              </>
            )}
          </button>
          
          {!success && (
            <p className="text-slate-500 text-xs text-center mt-3">
              Se requerirá una transacción para crear el token
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

