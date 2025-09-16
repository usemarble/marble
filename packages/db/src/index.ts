import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import { PrismaClient as NodePrismaClient } from "./generated/nodejs/client";
import { PrismaClient as WorkerPrismaClient } from "./generated/workerd/client";

neonConfig.webSocketConstructor = ws;

const createClient = (url?: string) => {
  const connectionString = url || process.env.DATABASE_URL;
  const adapter = new PrismaNeon({ connectionString });
  return { adapter, connectionString };
};

export const createNode = (url?: string) => {
  const { adapter } = createClient(url);
  return new NodePrismaClient({ adapter });
};

export const createWorker = (url?: string) => {
  const { adapter } = createClient(url);
  return new WorkerPrismaClient({ adapter });
};

let db: InstanceType<typeof NodePrismaClient>;

if (process.env.NODE_ENV === "production") {
  db = createNode();
} else {
  if (!global.prisma) {
    global.prisma = createNode();
  }
  db = global.prisma;
}

export { db };

export * from "./generated/nodejs/client";
