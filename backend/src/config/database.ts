import { Sequelize } from 'sequelize';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

// Resolve DB password from env or *_FILE
const resolveDbPassword = (): string | undefined => {
  if (process.env.DB_PASSWORD) return process.env.DB_PASSWORD;
  if (process.env.DB_PASSWORD_FILE) {
    try {
      return fs.readFileSync(process.env.DB_PASSWORD_FILE, 'utf8').trim();
    } catch (e) {
      console.warn('Could not read DB_PASSWORD_FILE:', e);
    }
  }
  return process.env.NODE_ENV === 'production' ? undefined : 'password123';
};

const sequelize = new Sequelize({
  database: process.env.DB_NAME || 'tech_challenge_blog',
  username: process.env.DB_USER || 'admin',
  password: resolveDbPassword(),
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  dialect: 'postgres',
  // Log SQL only em desenvolvimento; silencioso em teste/prod
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    // Ajuste de pool para throughput e latência sob carga
    max: 20,
    min: 5,
    acquire: 30000,
    idle: 10000,
  },
  dialectOptions: {
    // SSL apenas em produção (p.ex. RDS/Cloud SQL com SSL obrigatório)
    ...(process.env.NODE_ENV === 'production' && {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    })
  }
});

export { sequelize };