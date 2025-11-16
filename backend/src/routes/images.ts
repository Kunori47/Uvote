import { Router, Response } from 'express';
import multer, { FileFilterCallback } from 'multer';
import type { Request } from 'express';
import { authenticateWallet, AuthenticatedRequest } from '../middleware/auth';
import { supabase, supabaseStorageBucket } from '../config/supabase';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configurar multer para almacenamiento temporal local
const storage = multer.diskStorage({
  destination: (req: Request, file: any, cb: (error: Error | null, destination: string) => void) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req: Request, file: any, cb: (error: Error | null, filename: string) => void) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB default
  },
  fileFilter: (req: Request, file: any, cb: FileFilterCallback) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
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
router.post(
  '/upload',
  authenticateWallet,
  upload.single('image'),
  // Usamos `any` aquí para evitar problemas con la definición de tipos de multer en Express
  async (req: any, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      if (!supabase) {
        return res.status(500).json({ error: 'Supabase client not configured' });
      }

      const address: string = (req as AuthenticatedRequest).userAddress || 'anonymous';
      const typeRaw = (req.body.type || req.query.type || 'profile') as string;

      // Normalizar tipo permitido
      let type: 'profile' | 'moneda' | 'prediction';
      if (typeRaw === 'moneda') {
        type = 'moneda';
      } else if (typeRaw === 'prediction') {
        type = 'prediction';
      } else {
        type = 'profile';
      }

      // Carpeta según tipo
      const folder =
        type === 'moneda'
          ? 'moneda'
          : type === 'prediction'
          ? 'predictions'
          : 'profile';

      const filePathLocal: string = req.file.path;
      const fileBuffer = fs.readFileSync(filePathLocal);

      // Ruta dentro del bucket: profile/addr/filename, moneda/addr/filename o predictions/addr/filename
      const objectPath = `${folder}/${address.toLowerCase()}/${req.file.filename}`;

      // Subir a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(supabaseStorageBucket)
        .upload(objectPath, fileBuffer, {
          contentType: req.file.mimetype,
          upsert: true,
        });

      if (uploadError) {
        console.error('Error uploading to Supabase Storage:', uploadError);
        return res.status(500).json({ error: uploadError.message });
      }

      // Obtener URL pública
      const { data } = supabase.storage
        .from(supabaseStorageBucket)
        .getPublicUrl(objectPath);

      // Borrar archivo temporal local
      try {
        fs.unlinkSync(filePathLocal);
      } catch (err) {
        console.warn('Could not delete temp file:', err);
      }

      res.json({
        url: data.publicUrl,
        bucket: supabaseStorageBucket,
        path: objectPath,
        type,
      });
    } catch (error: any) {
      console.error('Error uploading image:', error);
      res.status(500).json({ error: error.message || 'Error uploading image' });
    }
  }
);

export default router;

