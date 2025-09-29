// Ensure required env for tests (JWT secret)
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'tests-secret';
}

import { sequelize } from '../config/database';

// Setup test database
beforeAll(async () => {
  await sequelize.sync({ force: true });
});

// Clean up after tests
afterAll(async () => {
  await sequelize.close();
});