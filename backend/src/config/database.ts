import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize({
  database: process.env.DB_NAME || 'tech_challenge_blog',
  username: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'password123',
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