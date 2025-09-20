import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

interface DatabaseConfig {
  name: string;
  user: string;
  password: string;
  host: string;
  dialect: 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql';
  port: number;
  logging: boolean;
}

const config: DatabaseConfig = {
  name: process.env.DB_NAME || 'chequescloud',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  host: process.env.DB_HOST || 'localhost',
  dialect: (process.env.DB_DIALECT as DatabaseConfig['dialect']) || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
  logging: process.env.NODE_ENV !== 'production',
};

const sequelize = new Sequelize(config.name, config.user, config.password, {
  host: config.host,
  dialect: config.dialect,
  port: config.port,
  timezone: 'America/Argentina/Buenos_Aires',
  dialectOptions: {
    ssl: false,
  },
  logging: config.logging ? (msg: string) => console.log(msg) : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

export { sequelize, config };
export default sequelize;