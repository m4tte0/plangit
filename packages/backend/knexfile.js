import { config } from './src/config.js';

export default {
  client: 'pg',
  connection: config.databaseUrl,
  migrations: {
    directory: './src/db/migrations',
  },
};
