import { PrismaNeon } from "@prisma/adapter-neon";
import {
  PrismaClient,
  Prisma as WorkerdPrisma,
} from "./generated/workerd/client";

const Prisma = WorkerdPrisma;

const createClient = (url: string) => {
  const connectionString =
    typeof url === "string" ? url.trim() : String(url || "").trim();

  if (!connectionString) {
    throw new Error("DATABASE_URL is required and must be a non-empty string");
  }

  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
};
export { createClient, Prisma };
