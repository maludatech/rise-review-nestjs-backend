import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: './internal.schema.prisma',

  datasource: {
    url: process.env.INTERNAL_DATABASE_URL,
  },

  migrations: {
    path: './migrations/internal',
  },
});
