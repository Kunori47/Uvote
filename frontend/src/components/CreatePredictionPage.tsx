import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import React from 'react';
import { useWallet } from '../hooks/useWallet';
import { predictionMarketService, factoryService } from '../lib/contractService';
import { CONTRACT_ADDRESSES, NETWORK_CONFIG, getSigner } from '../lib/contracts';
import { apiService, generateAuthToken } from '../lib/apiService';

interface CreatePredictionPageProps {
  onBack?: () => void;
  onCreated?: (predictionId: string) => void;
}

export function CreatePredictionPage({ onBack, onCreated }: CreatePredictionPageProps) {
  const { address, isConnected } = useWallet();
  
  // Estados del formulario
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [duration, setDuration] = useState('24'); // horas
  const [noTimeLimit, setNoTimeLimit] = useState(false); // predicción indefinida
  
  // Estados de la UI
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdPredictionId, setCreatedPredictionId] = useState<string | null>(null);

  // Imagen de la predicción
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  // Token del creador
  const [creatorToken, setCreatorToken] = useState<string | null>(null);
  const [loadingToken, setLoadingToken] = useState(false);

  // Cargar el token del creador al conectar
  useEffect(() => {
    const loadCreatorToken = async () => {
      if (!address || !isConnected) {
        setCreatorToken(null);
        return;
      }
      
      try {
        setLoadingToken(true);
        const tokenAddress = await factoryService.getCreatorToken(address);
        if (tokenAddress && tokenAddress !== '0x0000000000000000000000000000000000000000') {
          setCreatorToken(tokenAddress);
        } else {
          setCreatorToken(null);
          setError('No tienes un token de creador. Debes crear uno primero.');
        }
      } catch (err) {
        console.error('Error cargando token del creador:', err);
        setError('Error al verificar tu token de creador');
      } finally {
        setLoadingToken(false);
      }
    };
    
    loadCreatorToken();
  }, [address, isConnected]);

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleCreate = async () => {
    if (!creatorToken || !address) return;
    
    // Validaciones
    if (!title.trim()) {
      setError('El título es requerido');
      return;
    }
    
    if (!description.trim()) {
      setError('La descripción es requerida');
      return;
    }
    
    const filledOptions = options.filter(opt => opt.trim() !== '');
    if (filledOptions.length < 2) {
      setError('Debes tener al menos 2 opciones');
      return;
    }
    
    // Validar duración solo si no es indefinida
    if (!noTimeLimit) {
      const durationNum = parseFloat(duration);
      if (isNaN(durationNum) || durationNum < 0.0167 || durationNum > 8760) { // min 1 min, max 1 año
        setError('La duración debe ser entre 1 minuto y 1 año');
        return;
      }
    }
    
    try {
      setIsCreating(true);
      setError(null);
      setImageError(null);

      // 1) Subir imagen si el usuario seleccionó una y aún no la subimos
      let finalImageUrl: string | null = imageUrl;
      if (imageFile && !finalImageUrl) {
        try {
          setIsUploadingImage(true);
          const signer = await getSigner();
          const authToken = await generateAuthToken(address, signer);

          // Usamos el tipo 'prediction' para que vaya a la carpeta de predicciones
          const uploadResult = await apiService.uploadImage(
            imageFile,
            'prediction',
            authToken
          );
          finalImageUrl = uploadResult.url;
          setImageUrl(uploadResult.url);
        } catch (uploadError: any) {
          console.error('Error subiendo imagen de predicción:', uploadError);
          setImageError(uploadError?.message || 'Error al subir la imagen de la predicción');
          setIsCreating(false);
          setIsUploadingImage(false);
          return;
        } finally {
          setIsUploadingImage(false);
        }
      }
      
      // 2) Convertir duración de horas a segundos (0 si es indefinida)
      const durationInSeconds = noTimeLimit ? 0 : Math.floor(parseFloat(duration) * 3600);
      
      console.log('🎯 Creando predicción...');
      console.log('   Token:', creatorToken);
      console.log('   Título:', title);
      console.log('   Opciones:', filledOptions);
      console.log('   Duración:', durationInSeconds, 'segundos');
      if (finalImageUrl) {
        console.log('   Imagen URL:', finalImageUrl);
      }
      
      const result = await predictionMarketService.createPrediction(
        creatorToken,
        title,
        description,
        filledOptions,
        durationInSeconds
      );
      
      setSuccess(true);
      setCreatedPredictionId(result.predictionId);
      
      // Guardar referencia de imagen de predicción (si hay)
      if (finalImageUrl) {
        try {
          const signer = await getSigner();
          const authToken = await generateAuthToken(address, signer);

          await apiService.savePredictionImage(
            {
              prediction_id_onchain: String(result.predictionId),
              prediction_market_address: CONTRACT_ADDRESSES.PredictionMarket,
              chain_id: NETWORK_CONFIG.chainId,
              image_url: finalImageUrl,
              image_path: null,
            },
            authToken
          );
        } catch (metaError) {
          console.error('Error guardando metadata de imagen de predicción:', metaError);
          // No bloqueamos el flujo principal si solo falla la metadata
        }
      }
      
      // Limpiar formulario después de 2 segundos / navegar al detalle
      setTimeout(() => {
        if (result.predictionId && onCreated) {
          onCreated(result.predictionId);
        } else if (onBack) {
          onBack();
        }
      }, 2000);
    } catch (err: any) {
      console.error('Error creando predicción:', err);
      setError(err.message || 'Error al crear la predicción');
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
          <p className="text-slate-400 mb-6">Conecta tu wallet para crear predicciones</p>
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

  if (loadingToken) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mb-4" />
          <p className="text-slate-400">Verificando tu token de creador...</p>
        </div>
      </div>
    );
  }

  if (!creatorToken) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
          <h2 className="text-2xl font-bold text-slate-100 mb-2">No tienes un token de creador</h2>
          <p className="text-slate-400 mb-6">Debes crear un token de creador antes de poder crear predicciones</p>
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
        
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Crear Nueva Predicción</h1>
        <p className="text-slate-400">Crea una predicción para que tus seguidores participen</p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
          <div>
            <p className="text-green-400 font-medium">¡Predicción creada exitosamente!</p>
            {createdPredictionId && (
              <p className="text-green-400/70 text-sm">ID: {createdPredictionId}</p>
            )}
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

      {/* Form */}
      <div className="bg-slate-900/50 border border-slate-800/50 rounded-xl p-6 space-y-6">
        {/* Título */}
        <div>
          <label className="block text-slate-300 font-medium mb-2">
            Título de la predicción <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="¿Qué predicción quieres crear?"
            maxLength={200}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
          <p className="text-slate-500 text-xs mt-1">{title.length}/200 caracteres</p>
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-slate-300 font-medium mb-2">
            Descripción <span className="text-red-400">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Explica los detalles de tu predicción..."
            maxLength={1000}
            rows={4}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none resize-none"
          />
          <p className="text-slate-500 text-xs mt-1">{description.length}/1000 caracteres</p>
        </div>

        {/* Imagen de la predicción (opcional) */}
        <div>
          <label className="block text-slate-300 font-medium mb-2">
            Imagen de la predicción (opcional)
          </label>
          <p className="text-slate-500 text-sm mb-3">
            Esta imagen se mostrará como banner en el detalle de la predicción.
          </p>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 flex items-center justify-center text-xs text-slate-500">
              {imagePreview ? (
                // eslint-disable-next-line jsx-a11y/alt-text
                <img
                  src={imagePreview}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>Sin imagen</span>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setImageFile(file);
                  if (file) {
                    const url = URL.createObjectURL(file);
                    setImagePreview(url);
                  } else {
                    setImagePreview(null);
                  }
                  setImageError(null);
                  setImageUrl(null);
                }}
                disabled={isCreating || isUploadingImage}
                className="text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-emerald-600 file:text-white hover:file:bg-emerald-500"
              />
              {imageError && (
                <p className="mt-1 text-xs text-red-400">{imageError}</p>
              )}
              <p className="text-[11px] text-slate-500">
                Recomendado: imagen horizontal, máximo ~2MB.
              </p>
            </div>
          </div>
        </div>

        {/* Opciones */}
        <div>
          <label className="block text-slate-300 font-medium mb-2">
            Opciones <span className="text-red-400">*</span>
          </label>
          <p className="text-slate-500 text-sm mb-3">Mínimo 2 opciones, máximo 10</p>
          
          <div className="space-y-3">
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`Opción ${index + 1}`}
                  maxLength={100}
                  className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
                {options.length > 2 && (
                  <button
                    onClick={() => removeOption(index)}
                    className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
          
          {options.length < 10 && (
            <button
              onClick={addOption}
              className="mt-3 flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Agregar Opción
            </button>
          )}
        </div>

        {/* Configuración */}
        <div className="pt-6 border-t border-slate-800">
          {/* Sin tiempo límite */}
          <div className="mb-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={noTimeLimit}
                onChange={(e) => setNoTimeLimit(e.target.checked)}
                className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-emerald-600 focus:ring-emerald-500 focus:ring-2"
              />
              <div>
                <span className="text-slate-300 font-medium">Sin tiempo límite (indefinida)</span>
                <p className="text-slate-500 text-xs mt-1">
                  La predicción no expirará automáticamente. Solo tú podrás cerrarla manualmente cuando lo decidas.
                </p>
              </div>
            </label>
          </div>

          {/* Duración */}
          {!noTimeLimit && (
            <div>
              <label className="block text-slate-300 font-medium mb-2">
                Duración (horas) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="24"
                min="0.0167"
                max="8760"
                step="1"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
              <p className="text-slate-500 text-xs mt-1">Entre 1 minuto (0.0167) y 1 año (8760)</p>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-6 border-t border-slate-800">
          <button
            onClick={handleCreate}
            disabled={isCreating || success || isUploadingImage}
            className="w-full px-6 py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creando Predicción...
              </>
            ) : success ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                ¡Predicción Creada!
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Crear Predicción
              </>
            )}
          </button>
          
          {!success && (
            <p className="text-slate-500 text-xs text-center mt-3">
              Se requerirá una transacción para crear la predicción
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

