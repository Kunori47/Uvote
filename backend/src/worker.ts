import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';

// Types
type Bindings = {
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
};

type Variables = {
    supabase: SupabaseClient;
    userAddress?: string;
};

interface SignatureData {
    message: string;
    signature: string;
    address: string;
}

// ========== APP SETUP ==========
const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// CORS middleware
app.use('*', cors({
    origin: (origin) => {
        if (!origin) return '*';
        if (origin.includes('.vercel.app') || origin.includes('localhost')) {
            return origin;
        }
        return 'https://uvote-one.vercel.app';
    },
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
}));

// Supabase middleware - initialize client per request
app.use('*', async (c, next) => {
    const supabaseUrl = c.env.SUPABASE_URL;
    const supabaseKey = c.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.warn('⚠️ Supabase credentials not found');
    } else {
        const supabase = createClient(supabaseUrl, supabaseKey);
        c.set('supabase', supabase);
    }
    await next();
});

// ========== AUTH MIDDLEWARE ==========
const verifySignature = (data: SignatureData): boolean => {
    try {
        const recoveredAddress = ethers.verifyMessage(data.message, data.signature);
        return recoveredAddress.toLowerCase() === data.address.toLowerCase();
    } catch (error) {
        console.error('Error verifying signature:', error);
        return false;
    }
};

const authenticateWallet = async (c: any, next: any) => {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ error: 'Missing or invalid authorization header' }, 401);
    }

    try {
        const token = authHeader.substring(7);
        const signatureData: SignatureData = JSON.parse(atob(token));

        if (!verifySignature(signatureData)) {
            return c.json({ error: 'Invalid signature' }, 401);
        }

        c.set('userAddress', signatureData.address.toLowerCase());
        await next();
    } catch (error) {
        return c.json({ error: 'Invalid authentication token' }, 401);
    }
};

// ========== HEALTH & ROOT ==========
app.get('/', (c) => {
    return c.json({
        message: 'Uvote Backend API on Cloudflare Workers',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            users: '/api/users',
            creators: '/api/creators',
            tokens: '/api/tokens',
            subscriptions: '/api/subscriptions',
            predictions: '/api/predictions',
        }
    });
});

app.get('/health', (c) => {
    return c.json({
        status: 'ok',
        worker: true,
        timestamp: new Date().toISOString(),
        supabase: c.get('supabase') ? 'connected' : 'not configured'
    });
});

// ========== USERS ROUTES ==========

// GET /api/users/:address
app.get('/api/users/:address', async (c) => {
    try {
        const supabase = c.get('supabase');
        if (!supabase) return c.json({ error: 'Database not configured' }, 500);

        const address = c.req.param('address').toLowerCase();

        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('wallet_address', address)
            .single();

        if (error && error.code !== 'PGRST116') {
            return c.json({ error: error.message }, 500);
        }
        if (!user) {
            return c.json({ error: 'User not found' }, 404);
        }

        // Get subscriber count if creator
        let subscriberCount = 0;
        if (user.is_creator) {
            const { count } = await supabase
                .from('subscriptions')
                .select('*', { count: 'exact', head: true })
                .eq('creator_address', address);
            subscriberCount = count ?? 0;
        }

        return c.json({ ...user, subscriberCount });
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
});

// POST /api/users
app.post('/api/users', authenticateWallet, async (c) => {
    try {
        const supabase = c.get('supabase');
        if (!supabase) return c.json({ error: 'Database not configured' }, 500);

        const userAddress = c.get('userAddress')!;
        const body = await c.req.json();
        const { username, display_name, bio, profile_image_url, is_creator } = body;

        // Validate unique username
        if (username) {
            const { data: existing } = await supabase
                .from('users')
                .select('wallet_address')
                .eq('username', username)
                .single();

            if (existing && existing.wallet_address.toLowerCase() !== userAddress) {
                return c.json({ error: 'Username already taken' }, 400);
            }
        }

        const { data, error } = await supabase
            .from('users')
            .upsert({
                wallet_address: userAddress,
                username,
                display_name,
                bio,
                profile_image_url,
                is_creator: is_creator || false,
            }, { onConflict: 'wallet_address' })
            .select()
            .single();

        if (error) return c.json({ error: error.message }, 500);
        return c.json(data);
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
});

// PUT /api/users/:address
app.put('/api/users/:address', authenticateWallet, async (c) => {
    try {
        const supabase = c.get('supabase');
        if (!supabase) return c.json({ error: 'Database not configured' }, 500);

        const address = c.req.param('address').toLowerCase();
        const userAddress = c.get('userAddress')!;

        if (address !== userAddress) {
            return c.json({ error: 'You can only update your own profile' }, 403);
        }

        const body = await c.req.json();
        const { username, display_name, bio, profile_image_url } = body;

        // Validate unique username
        if (username) {
            const { data: existing } = await supabase
                .from('users')
                .select('wallet_address')
                .eq('username', username)
                .single();

            if (existing && existing.wallet_address.toLowerCase() !== userAddress) {
                return c.json({ error: 'Username already taken' }, 400);
            }
        }

        const { data, error } = await supabase
            .from('users')
            .update({ username, display_name, bio, profile_image_url, updated_at: new Date().toISOString() })
            .eq('wallet_address', address)
            .select()
            .single();

        if (error) return c.json({ error: error.message }, 500);
        return c.json(data);
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
});

// GET /api/users/:address/subscriptions
app.get('/api/users/:address/subscriptions', async (c) => {
    try {
        const supabase = c.get('supabase');
        if (!supabase) return c.json({ error: 'Database not configured' }, 500);

        const address = c.req.param('address').toLowerCase();

        const { data: subscriptions, error } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('subscriber_address', address)
            .order('created_at', { ascending: false });

        if (error) return c.json({ error: error.message }, 500);

        // Get creator info for each subscription
        const creators = await Promise.all(
            (subscriptions || []).map(async (sub: any) => {
                const { data: creator } = await supabase
                    .from('users')
                    .select('*')
                    .eq('wallet_address', sub.creator_address)
                    .single();
                return { ...sub, creator: creator || { wallet_address: sub.creator_address } };
            })
        );

        return c.json(creators);
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
});

// GET /api/users/:address/subscribers
app.get('/api/users/:address/subscribers', async (c) => {
    try {
        const supabase = c.get('supabase');
        if (!supabase) return c.json({ error: 'Database not configured' }, 500);

        const address = c.req.param('address').toLowerCase();
        const limit = parseInt(c.req.query('limit') || '100');
        const offset = parseInt(c.req.query('offset') || '0');

        const { data: subscribers, error } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('creator_address', address)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) return c.json({ error: error.message }, 500);

        const { count } = await supabase
            .from('subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('creator_address', address);

        return c.json({ subscribers, total: count ?? 0, limit, offset });
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
});

// ========== CREATORS ROUTES ==========

// GET /api/creators
app.get('/api/creators', async (c) => {
    try {
        const supabase = c.get('supabase');
        if (!supabase) return c.json({ error: 'Database not configured' }, 500);

        const limit = parseInt(c.req.query('limit') || '50');
        const offset = parseInt(c.req.query('offset') || '0');

        const { data: creators, error } = await supabase
            .from('users')
            .select('*')
            .eq('is_creator', true)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) return c.json({ error: error.message }, 500);

        // Add subscriber count to each creator
        const creatorsWithStats = await Promise.all(
            (creators || []).map(async (creator: any) => {
                const { count } = await supabase
                    .from('subscriptions')
                    .select('*', { count: 'exact', head: true })
                    .eq('creator_address', creator.wallet_address);
                return { ...creator, subscriberCount: count ?? 0 };
            })
        );

        return c.json({ creators: creatorsWithStats, total: creators?.length || 0, limit, offset });
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
});

// GET /api/creators/:address
app.get('/api/creators/:address', async (c) => {
    try {
        const supabase = c.get('supabase');
        if (!supabase) return c.json({ error: 'Database not configured' }, 500);

        const address = c.req.param('address').toLowerCase();

        const { data: creator, error } = await supabase
            .from('users')
            .select('*')
            .eq('wallet_address', address)
            .single();

        if (error && error.code !== 'PGRST116') return c.json({ error: error.message }, 500);
        if (!creator || !creator.is_creator) {
            return c.json({ error: 'Creator not found' }, 404);
        }

        const { count } = await supabase
            .from('subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('creator_address', address);

        return c.json({ ...creator, subscriberCount: count ?? 0 });
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
});

// GET /api/creators/:address/stats
app.get('/api/creators/:address/stats', async (c) => {
    try {
        const supabase = c.get('supabase');
        if (!supabase) return c.json({ error: 'Database not configured' }, 500);

        const address = c.req.param('address').toLowerCase();

        const { data: creator, error } = await supabase
            .from('users')
            .select('*')
            .eq('wallet_address', address)
            .single();

        if (error && error.code !== 'PGRST116') return c.json({ error: error.message }, 500);
        if (!creator || !creator.is_creator) {
            return c.json({ error: 'Creator not found' }, 404);
        }

        const { count } = await supabase
            .from('subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('creator_address', address);

        return c.json({ subscriberCount: count ?? 0 });
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
});

// ========== TOKENS ROUTES ==========

// GET /api/tokens/:address
app.get('/api/tokens/:address', async (c) => {
    try {
        const supabase = c.get('supabase');
        if (!supabase) return c.json({ error: 'Database not configured' }, 500);

        const address = c.req.param('address').toLowerCase();

        const { data: token, error } = await supabase
            .from('creator_tokens')
            .select('*')
            .eq('token_address', address)
            .single();

        if (error && error.code !== 'PGRST116') return c.json({ error: error.message }, 500);
        if (!token) return c.json({ error: 'Token not found' }, 404);

        return c.json(token);
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
});

// POST /api/tokens
app.post('/api/tokens', authenticateWallet, async (c) => {
    try {
        const supabase = c.get('supabase');
        if (!supabase) return c.json({ error: 'Database not configured' }, 500);

        const userAddress = c.get('userAddress')!;
        const body = await c.req.json();
        const { token_address, name, symbol, coin_image_url, description } = body;

        if (!token_address || !name || !symbol) {
            return c.json({ error: 'Missing required fields: token_address, name, symbol' }, 400);
        }

        const { data, error } = await supabase
            .from('creator_tokens')
            .upsert({
                token_address: token_address.toLowerCase(),
                creator_address: userAddress,
                name,
                symbol,
                coin_image_url,
                description,
            }, { onConflict: 'token_address' })
            .select()
            .single();

        if (error) return c.json({ error: error.message }, 500);
        return c.json(data);
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
});

// PUT /api/tokens/:address
app.put('/api/tokens/:address', authenticateWallet, async (c) => {
    try {
        const supabase = c.get('supabase');
        if (!supabase) return c.json({ error: 'Database not configured' }, 500);

        const address = c.req.param('address').toLowerCase();
        const userAddress = c.get('userAddress')!;

        const { data: token, error: findError } = await supabase
            .from('creator_tokens')
            .select('*')
            .eq('token_address', address)
            .single();

        if (findError && findError.code !== 'PGRST116') return c.json({ error: findError.message }, 500);
        if (!token) return c.json({ error: 'Token not found' }, 404);
        if (token.creator_address.toLowerCase() !== userAddress) {
            return c.json({ error: 'You can only update your own tokens' }, 403);
        }

        const body = await c.req.json();
        const { coin_image_url, description } = body;

        const { data, error } = await supabase
            .from('creator_tokens')
            .update({ coin_image_url, description, updated_at: new Date().toISOString() })
            .eq('token_address', address)
            .select()
            .single();

        if (error) return c.json({ error: error.message }, 500);
        return c.json(data);
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
});

// ========== SUBSCRIPTIONS ROUTES ==========

// POST /api/subscriptions
app.post('/api/subscriptions', authenticateWallet, async (c) => {
    try {
        const supabase = c.get('supabase');
        if (!supabase) return c.json({ error: 'Database not configured' }, 500);

        const subscriberAddress = c.get('userAddress')!;
        const body = await c.req.json();
        const { creator_address } = body;

        if (!creator_address) {
            return c.json({ error: 'Missing creator_address' }, 400);
        }

        if (subscriberAddress === creator_address.toLowerCase()) {
            return c.json({ error: 'Cannot subscribe to yourself' }, 400);
        }

        // Ensure subscriber exists
        await supabase.from('users').upsert({ wallet_address: subscriberAddress }, { onConflict: 'wallet_address' });
        // Ensure creator exists
        await supabase.from('users').upsert({ wallet_address: creator_address.toLowerCase(), is_creator: true }, { onConflict: 'wallet_address' });

        const { data, error } = await supabase
            .from('subscriptions')
            .insert({
                subscriber_address: subscriberAddress,
                creator_address: creator_address.toLowerCase(),
            })
            .select()
            .single();

        if (error) return c.json({ error: error.message }, 500);
        return c.json(data);
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
});

// DELETE /api/subscriptions/:creatorAddress
app.delete('/api/subscriptions/:creatorAddress', authenticateWallet, async (c) => {
    try {
        const supabase = c.get('supabase');
        if (!supabase) return c.json({ error: 'Database not configured' }, 500);

        const subscriberAddress = c.get('userAddress')!;
        const creatorAddress = c.req.param('creatorAddress').toLowerCase();

        const { data, error } = await supabase
            .from('subscriptions')
            .delete()
            .eq('subscriber_address', subscriberAddress)
            .eq('creator_address', creatorAddress)
            .select();

        if (error) return c.json({ error: error.message }, 500);
        if (!data || data.length === 0) {
            return c.json({ error: 'Subscription not found' }, 404);
        }

        return c.json({ success: true });
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
});

// GET /api/subscriptions/check/:subscriber/:creator
app.get('/api/subscriptions/check/:subscriber/:creator', async (c) => {
    try {
        const supabase = c.get('supabase');
        if (!supabase) return c.json({ error: 'Database not configured' }, 500);

        const subscriberAddress = c.req.param('subscriber').toLowerCase();
        const creatorAddress = c.req.param('creator').toLowerCase();

        const { data, error } = await supabase
            .from('subscriptions')
            .select('id')
            .eq('subscriber_address', subscriberAddress)
            .eq('creator_address', creatorAddress);

        if (error) return c.json({ error: error.message }, 500);

        return c.json({ isSubscribed: (data?.length ?? 0) > 0 });
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
});

// GET /api/subscriptions/count/:creatorAddress
app.get('/api/subscriptions/count/:creatorAddress', async (c) => {
    try {
        const supabase = c.get('supabase');
        if (!supabase) return c.json({ error: 'Database not configured' }, 500);

        const creatorAddress = c.req.param('creatorAddress').toLowerCase();

        const { count, error } = await supabase
            .from('subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('creator_address', creatorAddress);

        if (error) return c.json({ error: error.message }, 500);

        return c.json({ creator_address: creatorAddress, total: count ?? 0 });
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
});

// ========== PREDICTIONS ROUTES ==========

// POST /api/predictions/images
app.post('/api/predictions/images', authenticateWallet, async (c) => {
    try {
        const supabase = c.get('supabase');
        if (!supabase) return c.json({ error: 'Database not configured' }, 500);

        const body = await c.req.json();
        const { prediction_id_onchain, prediction_market_address, chain_id, image_url, image_path, tags } = body || {};

        if (!prediction_id_onchain || !prediction_market_address || !chain_id) {
            return c.json({ error: 'prediction_id_onchain, prediction_market_address y chain_id son obligatorios' }, 400);
        }

        if (!image_url && (!tags || (Array.isArray(tags) && tags.length === 0))) {
            return c.json({ error: 'Debe proporcionar al menos image_url o tags' }, 400);
        }

        const creatorAddress = c.get('userAddress') || null;

        let tagsArray: string[] = [];
        if (tags) {
            if (Array.isArray(tags)) {
                tagsArray = tags.filter((tag: any) => typeof tag === 'string' && tag.trim() !== '');
            } else {
                return c.json({ error: 'tags debe ser un array de strings' }, 400);
            }
        }

        const { data, error } = await supabase
            .from('prediction_images')
            .insert({
                prediction_id_onchain: String(prediction_id_onchain),
                prediction_market_address: prediction_market_address.toLowerCase(),
                chain_id: Number(chain_id),
                creator_address: creatorAddress,
                image_url: image_url || null,
                image_path: image_path || null,
                tags: tagsArray,
            })
            .select()
            .single();

        if (error) return c.json({ error: error.message }, 500);
        return c.json(data);
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
});

// GET /api/predictions/:id/images
app.get('/api/predictions/:id/images', async (c) => {
    try {
        const supabase = c.get('supabase');
        if (!supabase) return c.json({ error: 'Database not configured' }, 500);

        const predictionIdOnchain = c.req.param('id');
        const predictionMarketAddress = c.req.query('prediction_market_address') || '';
        const chainId = parseInt(c.req.query('chain_id') || '31337', 10);

        if (!predictionMarketAddress) {
            return c.json({ error: 'prediction_market_address es obligatorio' }, 400);
        }

        const { data, error } = await supabase
            .from('prediction_images')
            .select('*')
            .eq('prediction_id_onchain', predictionIdOnchain)
            .eq('prediction_market_address', predictionMarketAddress.toLowerCase())
            .eq('chain_id', chainId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') return c.json({ error: error.message }, 500);
        if (!data) return c.json({ error: 'Prediction image not found' }, 404);

        return c.json(data);
    } catch (error: any) {
        return c.json({ error: error.message }, 500);
    }
});

// ========== IMAGES ROUTES ==========
const SUPABASE_STORAGE_BUCKET = 'uvote-media';

// POST /api/images/upload
app.post('/api/images/upload', authenticateWallet, async (c) => {
    try {
        const supabase = c.get('supabase');
        if (!supabase) return c.json({ error: 'Database not configured' }, 500);

        const address = c.get('userAddress') || 'anonymous';

        // Parse FormData
        const formData = await c.req.formData();
        const file = formData.get('image') as File | null;
        const typeRaw = (formData.get('type') as string) || 'profile';

        if (!file) {
            return c.json({ error: 'No file uploaded' }, 400);
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return c.json({ error: 'Only image files are allowed (jpeg, jpg, png, gif, webp)' }, 400);
        }

        // Validate file size (5MB max)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            return c.json({ error: 'File size exceeds 5MB limit' }, 400);
        }

        // Normalize type
        let type: 'profile' | 'moneda' | 'prediction';
        if (typeRaw === 'moneda') {
            type = 'moneda';
        } else if (typeRaw === 'prediction') {
            type = 'prediction';
        } else {
            type = 'profile';
        }

        // Folder based on type
        const folder = type === 'moneda' ? 'moneda' : type === 'prediction' ? 'predictions' : 'profile';

        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = file.name.split('.').pop() || 'jpg';
        const filename = `image-${uniqueSuffix}.${ext}`;
        const objectPath = `${folder}/${address.toLowerCase()}/${filename}`;

        // Convert file to ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from(SUPABASE_STORAGE_BUCKET)
            .upload(objectPath, arrayBuffer, {
                contentType: file.type,
                upsert: true,
            });

        if (uploadError) {
            console.error('Error uploading to Supabase Storage:', uploadError);
            return c.json({ error: uploadError.message }, 500);
        }

        // Get public URL
        const { data } = supabase.storage
            .from(SUPABASE_STORAGE_BUCKET)
            .getPublicUrl(objectPath);

        return c.json({
            url: data.publicUrl,
            bucket: SUPABASE_STORAGE_BUCKET,
            path: objectPath,
            type,
        });
    } catch (error: any) {
        console.error('Error uploading image:', error);
        return c.json({ error: error.message || 'Error uploading image' }, 500);
    }
});

// ========== ERROR HANDLING ==========
app.notFound((c) => {
    return c.json({ error: 'Route not found' }, 404);
});

app.onError((err, c) => {
    console.error('Error:', err);
    return c.json({ error: err.message || 'Internal server error' }, 500);
});

export default app;
