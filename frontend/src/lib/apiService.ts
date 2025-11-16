import { ethers } from 'ethers';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Generar token de autenticación con firma de wallet
export const generateAuthToken = async (address: string, signer: ethers.Signer): Promise<string> => {
  const nonce = Math.random().toString(36).substring(2, 15) + 
                Math.random().toString(36).substring(2, 15) + 
                Date.now().toString(36);
  
  const message = `Sign this message to authenticate with Uvote:\n\nAddress: ${address}\nNonce: ${nonce}\n\nThis request will not trigger a blockchain transaction.`;
  
  const signature = await signer.signMessage(message);
  
  const tokenData = {
    message,
    signature,
    address,
  };
  
  return btoa(JSON.stringify(tokenData));
};

export const apiService = {
  // ============ USUARIOS ============
  
  // Obtener perfil de usuario
  async getUser(address: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${address}`);
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error('Error fetching user');
      }
      return await res.json();
    } catch (error: any) {
      console.error('Error getting user:', error);
      return null;
    }
  },

  // Crear/actualizar perfil
  async upsertUser(data: {
    username?: string;
    display_name?: string;
    bio?: string;
    profile_image_url?: string;
    is_creator?: boolean;
  }, authToken: string) {
    const res = await fetch(`${API_BASE_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(data),
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Error creating/updating user');
    }
    
    return await res.json();
  },

  // Actualizar perfil
  async updateUser(address: string, data: {
    username?: string;
    display_name?: string;
    bio?: string;
    profile_image_url?: string;
  }, authToken: string) {
    const res = await fetch(`${API_BASE_URL}/api/users/${address}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(data),
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Error updating user');
    }
    
    return await res.json();
  },

  // Obtener suscripciones de un usuario
  async getUserSubscriptions(address: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${address}/subscriptions`);
      if (!res.ok) return [];
      return await res.json();
    } catch (error) {
      console.error('Error getting subscriptions:', error);
      return [];
    }
  },

  // Obtener seguidores de un creador
  async getCreatorSubscribers(address: string, limit: number = 100, offset: number = 0) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${address}/subscribers?limit=${limit}&offset=${offset}`);
      if (!res.ok) return { subscribers: [], total: 0 };
      return await res.json();
    } catch (error) {
      console.error('Error getting subscribers:', error);
      return { subscribers: [], total: 0 };
    }
  },

  // ============ CREADORES ============
  
  // Listar todos los creadores
  async getCreators(limit: number = 50, offset: number = 0) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/creators?limit=${limit}&offset=${offset}`);
      if (!res.ok) return { creators: [], total: 0 };
      return await res.json();
    } catch (error) {
      console.error('Error getting creators:', error);
      return { creators: [], total: 0 };
    }
  },

  // Obtener perfil de creador
  async getCreator(address: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/creators/${address}`);
      if (!res.ok) return null;
      return await res.json();
    } catch (error) {
      console.error('Error getting creator:', error);
      return null;
    }
  },

  // ============ TOKENS ============
  
  // Obtener metadata del token
  async getToken(tokenAddress: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/tokens/${tokenAddress}`);
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error('Error fetching token');
      }
      return await res.json();
    } catch (error: any) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  // Registrar token
  async registerToken(data: {
    token_address: string;
    name: string;
    symbol: string;
    coin_image_url?: string;
    description?: string;
  }, authToken: string) {
    const res = await fetch(`${API_BASE_URL}/api/tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(data),
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Error registering token');
    }
    
    return await res.json();
  },

  // Actualizar metadata del token
  async updateToken(tokenAddress: string, data: {
    coin_image_url?: string;
    description?: string;
  }, authToken: string) {
    const res = await fetch(`${API_BASE_URL}/api/tokens/${tokenAddress}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(data),
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Error updating token');
    }
    
    return await res.json();
  },

  // ============ SUSCRIPCIONES ============
  
  // Suscribirse a creador
  async subscribe(creatorAddress: string, authToken: string) {
    const res = await fetch(`${API_BASE_URL}/api/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ creator_address: creatorAddress }),
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Error subscribing');
    }
    
    return await res.json();
  },

  // Desuscribirse
  async unsubscribe(creatorAddress: string, authToken: string) {
    const res = await fetch(`${API_BASE_URL}/api/subscriptions/${creatorAddress}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Error unsubscribing');
    }
    
    return await res.json();
  },

  // Verificar si está suscrito
  async checkSubscription(subscriberAddress: string, creatorAddress: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/subscriptions/check/${subscriberAddress}/${creatorAddress}`);
      if (!res.ok) return { isSubscribed: false };
      return await res.json();
    } catch (error) {
      console.error('Error checking subscription:', error);
      return { isSubscribed: false };
    }
  },

  // ============ IMÁGENES ============
  
  // Subir imagen a Supabase Storage
  async uploadImage(file: File, type: 'profile' | 'moneda' | 'prediction', authToken: string) {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', type);
    
    const res = await fetch(`${API_BASE_URL}/api/images/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      body: formData,
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Error uploading image');
    }
    
    return await res.json();
  },

  // ============ PREDICTIONS ============

  // Guardar referencia de imagen de predicción
  async savePredictionImage(params: {
    prediction_id_onchain: string;
    prediction_market_address: string;
    chain_id: number;
    image_url: string;
    image_path?: string;
  }, authToken: string) {
    const res = await fetch(`${API_BASE_URL}/api/predictions/images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || 'Error saving prediction image');
    }

    return await res.json();
  },

  // Obtener imagen de una predicción (si existe)
  async getPredictionImage(
    predictionIdOnchain: string,
    predictionMarketAddress: string,
    chainId: number
  ) {
    try {
      const url = `${API_BASE_URL}/api/predictions/${predictionIdOnchain}/images?prediction_market_address=${predictionMarketAddress}&chain_id=${chainId}`;
      const res = await fetch(url);
      if (!res.ok) {
        return null;
      }
      return await res.json();
    } catch (error) {
      console.error('Error getting prediction image:', error);
      return null;
    }
  },

  // Obtener número de seguidores de un creador (desde subscriptions)
  async getCreatorFollowersCount(address: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/subscriptions/count/${address}`);
      if (!res.ok) {
        return 0;
      }
      const data = await res.json();
      return data.total ?? 0;
    } catch (error) {
      console.error('Error getting creator followers count:', error);
      return 0;
    }
  },
};

