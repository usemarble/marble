import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  return new PrismaClient();
};

type GlobalThisWithPrisma = typeof globalThis & {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
};

const db =
  (globalThis as GlobalThisWithPrisma).prismaGlobal ?? prismaClientSingleton();

export default db;

if (process.env.NODE_ENV !== "production") {
  (globalThis as GlobalThisWithPrisma).prismaGlobal = db;
}
