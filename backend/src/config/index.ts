import dotenv from 'dotenv';

dotenv.config();

export const config = {
  api: {
    baseUrl: process.env.API_URL || 'http://localhost:3000',
    port: parseInt(process.env.PORT || '3000'),
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },
  database: {
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT || 'mssql',
    port: parseInt(process.env.DB_PORT || '1433'),
    logging: process.env.NODE_ENV !== 'production',
  },
  session: {
    secret: process.env.SESSION_SECRET || 'your-session-secret',
  }
};

export default config;