import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/rise/rise-review.schema.prisma',

  datasource: {
    url: process.env.RISE_REVIEW_DATABASE_URL,
  },

  migrations: {
    path: 'prisma/rise/migrations',
  },
});
