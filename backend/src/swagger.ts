import swaggerJsdoc from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Uvote Backend API',
    version: '1.0.0',
    description: 'API para perfiles de usuarios/creadores, tokens y suscripciones de Uvote',
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Local dev',
    },
  ],
  components: {
    securitySchemes: {
      WalletSignature: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JSON(Base64)',
        description:
          'Token basado en firma de wallet. Contiene { message, signature, address } en Base64.',
      },
    },
  },
  security: [
    {
      WalletSignature: [],
    },
  ],
  paths: {
    '/health': {
      get: {
        summary: 'Health check del servidor',
        tags: ['System'],
        responses: {
          200: {
            description: 'OK',
          },
        },
      },
    },
    '/api/users/{address}': {
      get: {
        summary: 'Obtener perfil de usuario/creador',
        tags: ['Users'],
        parameters: [
          {
            name: 'address',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: { description: 'Perfil encontrado' },
          404: { description: 'Usuario no encontrado' },
        },
      },
    },
    '/api/users': {
      post: {
        summary: 'Crear o actualizar perfil de usuario',
        tags: ['Users'],
        security: [{ WalletSignature: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  username: { type: 'string' },
                  display_name: { type: 'string' },
                  bio: { type: 'string' },
                  profile_image_url: { type: 'string' },
                  is_creator: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Perfil creado/actualizado' },
          400: { description: 'Error de validación' },
        },
      },
    },
    '/api/creators': {
      get: {
        summary: 'Listar todos los creadores',
        tags: ['Creators'],
        responses: {
          200: { description: 'Lista de creadores' },
        },
      },
    },
    '/api/tokens/{address}': {
      get: {
        summary: 'Obtener metadata de un token de creador',
        tags: ['Tokens'],
        parameters: [
          {
            name: 'address',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: { description: 'Metadata encontrada' },
          404: { description: 'Token no encontrado' },
        },
      },
    },
    '/api/subscriptions': {
      post: {
        summary: 'Suscribirse a un creador',
        tags: ['Subscriptions'],
        security: [{ WalletSignature: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  creator_address: { type: 'string' },
                },
                required: ['creator_address'],
              },
            },
          },
        },
        responses: {
          200: { description: 'Suscripción creada' },
          400: { description: 'No se puede suscribir a sí mismo' },
        },
      },
    },
    '/api/subscriptions/count/{creatorAddress}': {
      get: {
        summary: 'Obtener la cantidad de suscriptores de un creador',
        tags: ['Subscriptions'],
        parameters: [
          {
            name: 'creatorAddress',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Dirección de la wallet del creador',
          },
        ],
        responses: {
          200: {
            description: 'Conteo de suscriptores obtenido correctamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    creator_address: { type: 'string' },
                    total: { type: 'integer' },
                  },
                },
              },
            },
          },
          400: { description: 'Parámetros inválidos' },
          500: { description: 'Error al contar suscriptores' },
        },
      },
    },
    '/api/images/upload': {
      post: {
        summary: 'Subir imagen (perfil, moneda o predicción) a Supabase Storage',
        tags: ['Images'],
        security: [{ WalletSignature: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  image: {
                    type: 'string',
                    format: 'binary',
                  },
                  type: {
                    type: 'string',
                    enum: ['profile', 'moneda', 'prediction'],
                    description:
                      "Tipo de imagen: 'profile' para avatar de usuario, 'moneda' para imagen de token, 'prediction' para imagen de predicción",
                  },
                },
                required: ['image'],
              },
            },
          },
        },
        responses: {
          200: { description: 'Imagen subida a Supabase Storage' },
          400: { description: 'No se envió archivo' },
          500: { description: 'Error al subir a Supabase Storage' },
        },
      },
    },
  }
};

const swaggerSpec = swaggerJsdoc({
  swaggerDefinition,
  apis: [], // sin escaneo de comentarios por ahora
});

export default swaggerSpec;



