import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import React from 'react';
import { useWallet } from '../hooks/useWallet';
import { predictionMarketService, factoryService } from '../lib/contractService';
import { CONTRACT_ADDRESSES, NETWORK_CONFIG, getSigner } from '../lib/contracts';
import { apiService, generateAuthToken } from '../lib/apiService';

// Available categories (same as Categories.tsx)
const availableTags = [
  { id: 'gaming', label: 'Gaming', emoji: '🎮' },
  { id: 'crypto', label: 'Crypto', emoji: '₿' },
  { id: 'sports', label: 'Sports', emoji: '⚽' },
  { id: 'politics', label: 'Politics', emoji: '🏛️' },
  { id: 'tech', label: 'Tech', emoji: '💻' },
  { id: 'entertainment', label: 'Entertainment', emoji: '🎬' },
  { id: 'finance', label: 'Finance', emoji: '💰' },
  { id: 'science', label: 'Science', emoji: '🔬' },
  { id: 'music', label: 'Music', emoji: '🎵' },
  { id: 'fashion', label: 'Fashion', emoji: '👗' },
  { id: 'food', label: 'Food', emoji: '🍔' },
];

interface CreatePredictionPageProps {
  onBack?: () => void;
  onCreated?: (predictionId: string) => void;
}

export function CreatePredictionPage({ onBack, onCreated }: CreatePredictionPageProps) {
  const { address, isConnected } = useWallet();
  
  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [duration, setDuration] = useState('24'); // hours
  const [noTimeLimit, setNoTimeLimit] = useState(false); // indefinite prediction
  const [selectedTags, setSelectedTags] = useState<string[]>([]); // Selected tags
  
  // UI states
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdPredictionId, setCreatedPredictionId] = useState<string | null>(null);

  // Prediction image
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  // Creator token
  const [creatorToken, setCreatorToken] = useState<string | null>(null);
  const [loadingToken, setLoadingToken] = useState(false);

  // Load creator token when connecting
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
          setError('You don\'t have a creator token. You must create one first.');
        }
      } catch (err) {
        console.error('Error loading creator token:', err);
        setError('Error verifying your creator token');
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
    
    // Validations
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    
    if (!description.trim()) {
      setError('Description is required');
      return;
    }
    
    const filledOptions = options.filter(opt => opt.trim() !== '');
    if (filledOptions.length < 2) {
      setError('You must have at least 2 options');
      return;
    }
    
    // Validate duration only if not indefinite
    if (!noTimeLimit) {
      const durationNum = parseFloat(duration);
      if (isNaN(durationNum) || durationNum < 0.0167 || durationNum > 8760) { // min 1 min, max 1 año
        setError('Duration must be between 1 minute and 1 year');
        return;
      }
    }
    
    try {
      setIsCreating(true);
      setError(null);
      setImageError(null);

      // 1) Upload image if user selected one and we haven't uploaded it yet
      let finalImageUrl: string | null = imageUrl;
      if (imageFile && !finalImageUrl) {
        try {
          setIsUploadingImage(true);
          const signer = await getSigner();
          const authToken = await generateAuthToken(address, signer);

          // We use 'prediction' type to go to predictions folder
          const uploadResult = await apiService.uploadImage(
            imageFile,
            'prediction',
            authToken
          );
          finalImageUrl = uploadResult.url;
          setImageUrl(uploadResult.url);
        } catch (uploadError: any) {
          console.error('Error uploading prediction image:', uploadError);
          setImageError(uploadError?.message || 'Error uploading prediction image');
          setIsCreating(false);
          setIsUploadingImage(false);
          return;
        } finally {
          setIsUploadingImage(false);
        }
      }
      
      // 2) Convert duration from hours to seconds (0 if indefinite)
      const durationInSeconds = noTimeLimit ? 0 : Math.floor(parseFloat(duration) * 3600);
      
      console.log('🎯 Creating prediction...');
      console.log('   Token:', creatorToken);
      console.log('   Title:', title);
      console.log('   Options:', filledOptions);
      console.log('   Duration:', durationInSeconds, 'seconds');
      if (finalImageUrl) {
        console.log('   Image URL:', finalImageUrl);
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
      
      // Save prediction image reference and tags (always saved, with or without image)
      // Save only if there is image OR tags
      if (finalImageUrl || selectedTags.length > 0) {
        try {
          const signer = await getSigner();
          const authToken = await generateAuthToken(address, signer);

          await apiService.savePredictionImage(
            {
              prediction_id_onchain: String(result.predictionId),
              prediction_market_address: CONTRACT_ADDRESSES.PredictionMarket,
              chain_id: NETWORK_CONFIG.chainId,
              image_url: finalImageUrl || undefined,
              image_path: null,
              tags: selectedTags.length > 0 ? selectedTags : [],
            },
            authToken
          );
        } catch (metaError) {
          console.error('Error saving prediction metadata:', metaError);
          // Don't block main flow if only metadata fails
        }
      }
      
      // Clear form after 2 seconds / navigate to detail
      setTimeout(() => {
        if (result.predictionId && onCreated) {
          onCreated(result.predictionId);
        } else if (onBack) {
          onBack();
        }
      }, 2000);
    } catch (err: any) {
      console.error('Error creating prediction:', err);
      setError(err.message || 'Error creating prediction');
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
          <p className="text-slate-400 mb-6">Connect your wallet to create predictions</p>
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

  if (loadingToken) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mb-4" />
          <p className="text-slate-400">Verifying your creator token...</p>
        </div>
      </div>
    );
  }

  if (!creatorToken) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
          <h2 className="text-2xl font-bold text-slate-100 mb-2">You don't have a creator token</h2>
          <p className="text-slate-400 mb-6">You must create a creator token before you can create predictions</p>
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
          Back
        </button>
        
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Create New Prediction</h1>
        <p className="text-slate-400">Create a prediction for your followers to participate in</p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
          <div>
            <p className="text-green-400 font-medium">Prediction created successfully!</p>
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
        {/* Title */}
        <div>
          <label className="block text-slate-300 font-medium mb-2">
            Prediction Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What prediction do you want to create?"
            maxLength={200}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
          />
          <p className="text-slate-500 text-xs mt-1">{title.length}/200 characters</p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-slate-300 font-medium mb-2">
            Description <span className="text-red-400">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Explain the details of your prediction..."
            maxLength={1000}
            rows={4}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none resize-none"
          />
          <p className="text-slate-500 text-xs mt-1">{description.length}/1000 characters</p>
        </div>

        {/* Prediction Image (optional) */}
        <div>
          <label className="block text-slate-300 font-medium mb-2">
            Prediction Image (optional)
          </label>
          <p className="text-slate-500 text-sm mb-3">
            This image will be displayed as a banner in the prediction details.
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
                <span>No image</span>
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
                Recommended: horizontal image, max ~2MB.
              </p>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-slate-300 font-medium mb-2">
            Tags (optional)
          </label>
          <p className="text-slate-500 text-sm mb-3">
            Select one or more tags to categorize your prediction
          </p>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => {
              const isSelected = selectedTags.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      setSelectedTags(selectedTags.filter(t => t !== tag.id));
                    } else {
                      setSelectedTags([...selectedTags, tag.id]);
                    }
                  }}
                  disabled={isCreating}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-2 border-emerald-500'
                      : 'bg-slate-800 text-slate-400 border-2 border-slate-700 hover:border-slate-600 hover:bg-slate-800/80 hover:text-slate-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <span>{tag.emoji}</span>
                  <span>{tag.label}</span>
                  {isSelected && (
                    <X className="w-3 h-3" />
                  )}
                </button>
              );
            })}
          </div>
          {selectedTags.length > 0 && (
            <p className="text-slate-400 text-xs mt-2">
              {selectedTags.length} tag{selectedTags.length > 1 ? 's' : ''} selected
            </p>
          )}
        </div>

        {/* Options */}
        <div>
          <label className="block text-slate-300 font-medium mb-2">
            Options <span className="text-red-400">*</span>
          </label>
          <p className="text-slate-500 text-sm mb-3">Minimum 2 options, maximum 10</p>
          
          <div className="space-y-3">
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
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
              Add Option
            </button>
          )}
        </div>

        {/* Configuration */}
        <div className="pt-6 border-t border-slate-800">
          {/* No time limit */}
          <div className="mb-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={noTimeLimit}
                onChange={(e) => setNoTimeLimit(e.target.checked)}
                className="w-5 h-5 rounded border-slate-700 bg-slate-800 text-emerald-600 focus:ring-emerald-500 focus:ring-2"
              />
              <div>
                <span className="text-slate-300 font-medium">No time limit (indefinite)</span>
                <p className="text-slate-500 text-xs mt-1">
                  The prediction will not expire automatically. Only you can close it manually when you decide.
                </p>
              </div>
            </label>
          </div>

          {/* Duration */}
          {!noTimeLimit && (
            <div>
              <label className="block text-slate-300 font-medium mb-2">
                Duration (hours) <span className="text-red-400">*</span>
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
              <p className="text-slate-500 text-xs mt-1">Between 1 minute (0.0167) and 1 year (8760)</p>
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
                Creating Prediction...
              </>
            ) : success ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Prediction Created!
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Create Prediction
              </>
            )}
          </button>
          
          {!success && (
            <p className="text-slate-500 text-xs text-center mt-3">
              A transaction will be required to create the prediction
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

