import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL ?? 'file:./dev.sqlite3',
  },
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
})
