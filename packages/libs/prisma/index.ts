import { PrismaClient } from '@prisma/client';

declare global {
  // This is to ensure that the PrismaClient is only instantiated once
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace globalThis {
    // Using globalThis to ensure compatibility across different environments
    // eslint-disable-next-line no-var
    var prismadb: PrismaClient;
  }
}

const prisma = global.prismadb ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') global.prismadb = prisma; // Store the PrismaClient instance in global scope for development

export default prisma;
