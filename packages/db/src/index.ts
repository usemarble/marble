import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import { PrismaClient } from "./generated/node/client";

neonConfig.webSocketConstructor = ws;

const createClient = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString || typeof connectionString !== "string") {
    throw new Error("DATABASE_URL is not set");
  }

  const adapter = new PrismaNeon({ connectionString });
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
