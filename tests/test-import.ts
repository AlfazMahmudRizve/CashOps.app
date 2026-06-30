const nextAuthNext = require('next-auth/next');
nextAuthNext.getServerSession = async () => {
    console.log('MOCKED getServerSession called!');
    return { user: { id: 'test-user-id' } };
};

// Mock global prisma
const mockPrisma = {
    purchase: {
        findMany: async (args: any) => {
            console.log('MOCKED prisma.purchase.findMany called with:', args);
            return [];
        }
    }
};

(globalThis as any).prisma = mockPrisma;

async function run() {
    console.log('Testing prisma access...');
    // Dynamically import lib/prisma to ensure it executes after globalThis.prisma is set
    const prismaModule = await import('../lib/prisma');
    const prisma = prismaModule.default;
    const result = await prisma.purchase.findMany({} as any);
    console.log('findMany result:', result);
}

run();
export {};
