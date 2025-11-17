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
  
  // Form states
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [initialPrice, setInitialPrice] = useState('0.01');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  
  // UI states
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdTokenAddress, setCreatedTokenAddress] = useState<string | null>(null);
  
  // Verification state
  const [hasToken, setHasToken] = useState(false);
  const [checkingToken, setCheckingToken] = useState(false);

  // Check if user already has a token
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
          setError('You already have a creator token');
        } else {
          setHasToken(false);
          setError(null); // Clear error if no token
        }
      } catch (err: any) {
        console.warn('⚠️  Error verifying token (node might not be running):', err.message);
        // Don't show error to user if it's a connection issue
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
    
    // Validations
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    
    if (!symbol.trim()) {
      setError('Symbol is required');
      return;
    }
    
    if (symbol.length > 10) {
      setError('Symbol must have maximum 10 characters');
      return;
    }
    
    const priceNum = parseFloat(initialPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Price must be greater than 0');
      return;
    }
    
    try {
      setIsCreating(true);
      setError(null);
      
      // 1) Upload image to Supabase Storage (if any)
      let coinImageUrl: string | undefined = undefined;
      if (imageFile) {
        try {
          console.log('📤 Uploading coin image...');
          const signer = await getSigner();
          const authToken = await generateAuthToken(address, signer);
          const uploadResult = await apiService.uploadImage(imageFile, 'coin', authToken);
          coinImageUrl = uploadResult.url;
          console.log('✅ Image uploaded:', coinImageUrl);
        } catch (uploadError: any) {
          console.error('Error uploading image:', uploadError);
          setError(uploadError?.message || 'Error uploading coin image');
          setIsCreating(false);
          return;
        }
      }
      
      // 2) Create token on blockchain
      console.log('🪙 Creating creator token...');
      const result = await factoryService.createCreatorToken(name, symbol, initialPrice);
      
      if (!result.tokenAddress) {
        throw new Error('Could not get created token address');
      }

      console.log('✅ Token created on blockchain:', result.tokenAddress);
      
      // 3) Authorize TokenExchange as minter so users can buy tokens
      console.log('🔐 Authorizing TokenExchange as minter...');
      try {
        const tokenContract = await creatorTokenService.getContractWithSigner(result.tokenAddress);
        const authTx = await tokenContract.setAuthorizedMinter(CONTRACT_ADDRESSES.TokenExchange, true);
        console.log('   ⏳ Waiting for authorization confirmation...');
        await authTx.wait();
        console.log('✅ TokenExchange authorized as minter');
      } catch (authErr: any) {
        console.warn('⚠️  Could not authorize TokenExchange automatically:', authErr.message);
        console.warn('   Token was created, but you will need to authorize the Exchange manually');
        // Don't fail token creation if authorization fails
      }

      // 4) Also authorize PredictionMarket so tokens can be used in bets
      console.log('🔐 Authorizing PredictionMarket as minter...');
      try {
        const tokenContract = await creatorTokenService.getContractWithSigner(result.tokenAddress);
        const authTx = await tokenContract.setAuthorizedMinter(CONTRACT_ADDRESSES.PredictionMarket, true);
        await authTx.wait();
        console.log('✅ PredictionMarket authorized as minter');
      } catch (authErr: any) {
        console.warn('⚠️  Could not authorize PredictionMarket automatically:', authErr.message);
        // Don't fail token creation if authorization fails
      }
      
      // 5) Save token in database
      try {
        console.log('💾 Saving token in database...');
        const signer = await getSigner();
        const authToken = await generateAuthToken(address, signer);
        await apiService.registerToken({
          token_address: result.tokenAddress,
          name: name.trim(),
          symbol: symbol.trim().toUpperCase(),
          coin_image_url: coinImageUrl,
          description: description.trim() || undefined,
        }, authToken);
        console.log('✅ Token saved in database');
      } catch (dbError: any) {
        console.error('⚠️  Error saving token in database:', dbError);
        console.warn('   Token was created on blockchain, but could not be saved in DB');
        // Don't fail token creation if DB save fails
      }
      
      setSuccess(true);
      setCreatedTokenAddress(result.tokenAddress);
      
      // Redirect after 3 seconds
      setTimeout(() => {
        if (onCreated) {
          onCreated();
        } else if (onBack) {
          onBack();
        }
      }, 3000);
    } catch (err: any) {
      console.error('Error creating token:', err);
      setError(err.message || 'Error creating token');
    } finally {
      setIsCreating(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="w-16 h-16 text-yellow-400 mb-4" />
          <h2 className="text-2xl font-bold text-slate-100 mb-2">Wallet not connected</h2>
          <p className="text-slate-400 mb-6">Connect your wallet to create your creator token</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
          >
            Back
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
          <h2 className="text-2xl font-bold text-slate-100 mb-2">You already have a creator token</h2>
          <p className="text-slate-400 mb-6">You can only have one creator token per wallet</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
          >
            Back
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
        
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Create Creator Token</h1>
        <p className="text-slate-400">
          Create your own token to start creating predictions. Your followers will use this token to participate.
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
          <div>
            <p className="text-green-400 font-medium">Token created successfully!</p>
            {createdTokenAddress && (
              <p className="text-green-400/70 text-sm">Address: {createdTokenAddress}</p>
            )}
            <p className="text-green-400/70 text-sm mt-1">Redirecting...</p>
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
        <h3 className="text-blue-400 font-medium mb-2">📌 Important</h3>
        <ul className="text-blue-400 text-sm space-y-1">
          <li>• You can only create one creator token per wallet</li>
          <li>• Name and symbol cannot be changed afterwards</li>
          <li>• Initial price can be updated once a month</li>
          <li>• Users will buy your tokens to participate in your predictions</li>
        </ul>
      </div>

      {/* Form */}
      <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-6 space-y-6">
        {/* Imagen de la Moneda */}
        <div>
          <label className="block text-slate-300 font-medium mb-2">
            Coin Image (optional)
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
                Recommended: square image, max ~2MB. Will be saved to Supabase Storage.
              </p>
            </div>
          </div>
        </div>

        {/* Nombre del Token */}
        <div>
          <label className="block text-slate-300 font-medium mb-2">
            Token Name <span className="text-red-400">*</span>
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
            Symbol <span className="text-red-400">*</span>
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
            Initial Price (DOT) <span className="text-red-400">*</span>
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
            Price per token. You can update it once a month after creation.
          </p>
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-slate-300 font-medium mb-2">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your creator token..."
            maxLength={500}
            rows={3}
            disabled={isCreating}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none resize-none disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="text-slate-500 text-xs mt-1">{description.length}/500 characters</p>
        </div>

        {/* Preview */}
        {name && symbol && (
          <div className="pt-6 border-t border-slate-800">
            <h3 className="text-slate-300 font-medium mb-3">Preview</h3>
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
                <div className="text-emerald-400 text-sm">{initialPrice} DOT per token</div>
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
                Creating Token...
              </>
            ) : success ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Token Created!
              </>
            ) : (
              <>
                <Coins className="w-5 h-5" />
                Create Token
              </>
            )}
          </button>
          
          {!success && (
            <p className="text-slate-500 text-xs text-center mt-3">
              A transaction will be required to create the token
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

