import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

export const createClient = (connectionString?: string) => {
  const dbUrl = connectionString ?? process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("DATABASE_URL is required");
  }
  const adapter = new PrismaNeon({ connectionString: dbUrl });
  return new PrismaClient({ adapter });
};

declare global {
  var prisma: PrismaClient | undefined;
}

let db: PrismaClient;

if (process.env.NODE_ENV === "production") {
  db = createClient();
} else {
  if (!global.prisma) {
    global.prisma = createClient();
  }
  db = global.prisma;
}

export { db };
