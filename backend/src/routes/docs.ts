import { Router, Response } from 'express';

const router = Router();

// Documentación simple en JSON para /api/docs
router.get('/', (req, res: Response) => {
  res.json({
    name: 'Uvote Backend API',
    version: '1.0.0',
    description: 'API para perfiles de usuarios/creadores, tokens y suscripciones',
    baseUrl: '/api',
    endpoints: {
      health: {
        method: 'GET',
        path: '/health',
        description: 'Estado del servidor',
      },
      users: {
        getUser: {
          method: 'GET',
          path: '/api/users/:address',
          description: 'Obtener perfil de usuario/creador por dirección',
        },
        upsertUser: {
          method: 'POST',
          path: '/api/users',
          auth: 'wallet-signature',
          description: 'Crear/actualizar perfil de usuario',
        },
        updateUser: {
          method: 'PUT',
          path: '/api/users/:address',
          auth: 'wallet-signature',
          description: 'Actualizar perfil (solo el propio)',
        },
        subscriptions: {
          method: 'GET',
          path: '/api/users/:address/subscriptions',
          description: 'Listar creadores a los que está suscrito el usuario',
        },
        subscribers: {
          method: 'GET',
          path: '/api/users/:address/subscribers',
          description: 'Listar suscriptores de un creador',
        },
      },
      creators: {
        list: {
          method: 'GET',
          path: '/api/creators',
          description: 'Listar todos los creadores',
        },
        profile: {
          method: 'GET',
          path: '/api/creators/:address',
          description: 'Perfil de un creador',
        },
        stats: {
          method: 'GET',
          path: '/api/creators/:address/stats',
          description: 'Estadísticas de un creador',
        },
      },
      tokens: {
        getToken: {
          method: 'GET',
          path: '/api/tokens/:address',
          description: 'Metadata de un token de creador',
        },
        register: {
          method: 'POST',
          path: '/api/tokens',
          auth: 'wallet-signature',
          description: 'Registrar/actualizar metadata de un token',
        },
        update: {
          method: 'PUT',
          path: '/api/tokens/:address',
          auth: 'wallet-signature',
          description: 'Actualizar metadata de un token (solo creador)',
        },
      },
      subscriptions: {
        subscribe: {
          method: 'POST',
          path: '/api/subscriptions',
          auth: 'wallet-signature',
          description: 'Suscribirse a un creador',
        },
        unsubscribe: {
          method: 'DELETE',
          path: '/api/subscriptions/:creatorAddress',
          auth: 'wallet-signature',
          description: 'Desuscribirse de un creador',
        },
        check: {
          method: 'GET',
          path: '/api/subscriptions/check/:subscriber/:creator',
          description: 'Verificar si un usuario está suscrito a un creador',
        },
      },
      images: {
        upload: {
          method: 'POST',
          path: '/api/images/upload',
          auth: 'wallet-signature',
          description: 'Subir imagen de perfil o de moneda',
        },
      },
    },
  });
});

export default router;


