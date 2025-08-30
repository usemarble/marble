import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const createClient = (url?: string) => {
  const connectionString = url || process.env.DATABASE_URL;
  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
};

declare global {
  var prisma: PrismaClient | undefined;
}

const global = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let db: PrismaClient;

if (process.env.NODE_ENV === "production") {
  db = createClient();
} else {
  if (!global.prisma) {
    global.prisma = createClient();
  }
  db = global.prisma;
}

export { createClient, db };
