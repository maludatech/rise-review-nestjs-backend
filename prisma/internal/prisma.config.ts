import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/internal.schema.prisma',

  datasource: {
    url: process.env.INTERNAL_DATABASE_URL,
  },

  migrations: {
    path: 'prisma/migrations/internal',
  },
});
