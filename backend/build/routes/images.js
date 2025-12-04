"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const auth_1 = require("../middleware/auth");
const supabase_1 = require("../config/supabase");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const router = (0, express_1.Router)();
// Configurar multer para almacenamiento temporal local
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = process.env.UPLOAD_DIR || './uploads';
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    },
});
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB default
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            cb(null, true);
        }
        else {
            cb(new Error('Only image files are allowed'));
        }
    },
});
/**
 * POST /api/images/upload
 * Subir imagen (perfil, moneda o predicción) a Supabase Storage
 * - type = 'profile'     → carpeta profile/
 * - type = 'moneda'      → carpeta moneda/
 * - type = 'prediction'  → carpeta predictions/
 */
router.post('/upload', auth_1.authenticateWallet, upload.single('image'), 
// Usamos `any` aquí para evitar problemas con la definición de tipos de multer en Express
async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        if (!supabase_1.supabase) {
            return res.status(500).json({ error: 'Supabase client not configured' });
        }
        const address = req.userAddress || 'anonymous';
        const typeRaw = (req.body.type || req.query.type || 'profile');
        // Normalizar tipo permitido
        let type;
        if (typeRaw === 'moneda') {
            type = 'moneda';
        }
        else if (typeRaw === 'prediction') {
            type = 'prediction';
        }
        else {
            type = 'profile';
        }
        // Carpeta según tipo
        const folder = type === 'moneda'
            ? 'moneda'
            : type === 'prediction'
                ? 'predictions'
                : 'profile';
        const filePathLocal = req.file.path;
        const fileBuffer = fs_1.default.readFileSync(filePathLocal);
        // Ruta dentro del bucket: profile/addr/filename, moneda/addr/filename o predictions/addr/filename
        const objectPath = `${folder}/${address.toLowerCase()}/${req.file.filename}`;
        // Subir a Supabase Storage
        const { error: uploadError } = await supabase_1.supabase.storage
            .from(supabase_1.supabaseStorageBucket)
            .upload(objectPath, fileBuffer, {
            contentType: req.file.mimetype,
            upsert: true,
        });
        if (uploadError) {
            console.error('Error uploading to Supabase Storage:', uploadError);
            return res.status(500).json({ error: uploadError.message });
        }
        // Obtener URL pública
        const { data } = supabase_1.supabase.storage
            .from(supabase_1.supabaseStorageBucket)
            .getPublicUrl(objectPath);
        // Borrar archivo temporal local
        try {
            fs_1.default.unlinkSync(filePathLocal);
        }
        catch (err) {
            console.warn('Could not delete temp file:', err);
        }
        res.json({
            url: data.publicUrl,
            bucket: supabase_1.supabaseStorageBucket,
            path: objectPath,
            type,
        });
    }
    catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ error: error.message || 'Error uploading image' });
    }
});
exports.default = router;
//# sourceMappingURL=images.js.map