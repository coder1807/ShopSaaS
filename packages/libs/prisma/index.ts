import { PrismaClient } from "@prisma/client";

declare global { // This is to ensure that the PrismaClient is only instantiated once
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace globalThis { // Using globalThis to ensure compatibility across different environments
        // eslint-disable-next-line no-var
        var prismadb: PrismaClient;
    }
}

const prisma = new PrismaClient();
if (process.env.NODE_ENV === "production") global.prismadb = prisma; // For production, use a global variable to avoid creating multiple instances of PrismaClient

export default prisma;