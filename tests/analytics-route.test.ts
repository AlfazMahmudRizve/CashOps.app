import { Module } from 'module';

// 1. Mock getServerSession globally
let currentSession: any = null;
const nextAuthNext = require('next-auth/next');
nextAuthNext.getServerSession = async () => {
    return currentSession;
};

// 2. Mock Prisma globally
const mockPrisma = {
    transaction: {
        groupBy: async (args: any) => {
            console.log('--- DB Call: prisma.transaction.groupBy ---', JSON.stringify(args, null, 2));
            if (args.by.includes('category')) {
                return [
                    { category: 'Food', type: 'expense', _sum: { amount: 150 } },
                    { category: 'Salary', type: 'income', _sum: { amount: 5000 } },
                    { category: 'Utilities', type: 'expense', _sum: { amount: 100 } }
                ];
            }
            if (args.by.includes('type')) {
                return [
                    { type: 'income', _sum: { amount: 5000 } },
                    { type: 'expense', _sum: { amount: 250 } }
                ];
            }
            return [];
        },
        findMany: async (args: any) => {
            console.log('--- DB Call: prisma.transaction.findMany ---', JSON.stringify(args, null, 2));
            // Simulate returning the selected fields for transactions
            // Let's create transactions across the last 6 months for the test
            const now = new Date();
            const getPastDate = (monthsAgo: number, day: number) => {
                const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, day);
                return d;
            };

            return [
                // Month 0 (current month)
                { date: getPastDate(0, 15), amount: 1000, type: 'income' },
                { date: getPastDate(0, 20), amount: 150, type: 'expense' },
                // Month 1
                { date: getPastDate(1, 10), amount: 2000, type: 'income' },
                { date: getPastDate(1, 12), amount: 100, type: 'expense' },
                // Month 2
                { date: getPastDate(2, 5), amount: 500, type: 'income' },
                // Month 5
                { date: getPastDate(5, 1), amount: 1500, type: 'income' },
            ];
        }
    }
};

(globalThis as any).prisma = mockPrisma;

// Helper to run assertions
function assert(condition: boolean, message: string) {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
    console.log(`✅ PASS: ${message}`);
}

async function runTests() {
    console.log('Starting Test-Driven Development (TDD) cycle for /api/analytics Route...');

    // A. Verify import fails / route not found first (RED phase 1)
    let GET: any;
    try {
        const routeModule = await import('../app/api/analytics/route');
        GET = routeModule.GET;
    } catch (e: any) {
        console.log('🔴 RED (Expected Failure): Route does not exist or cannot be imported yet.');
        console.log('Error was:', e.message);
        return;
    }

    // B. Test Unauthorized (Expect 401)
    currentSession = null;
    const req1 = new Request('http://localhost/api/analytics');
    const res1 = await GET(req1);
    assert(res1.status === 401, 'Request without session should return 401 Unauthorized');
    const json1 = await res1.json();
    assert(json1.error === 'Unauthorized', 'Error message should be "Unauthorized"');

    // C. Test Authorized & Valid Calculations (Expect 200 & Correct aggregates)
    currentSession = { user: { id: 'test-user-uuid' } };
    const req2 = new Request('http://localhost/api/analytics');
    const res2 = await GET(req2);
    assert(res2.status === 200, 'Request with session should return 200 OK');

    const metrics = await res2.json();
    console.log('Response Metrics:', JSON.stringify(metrics, null, 2));

    // Verify aggregate totals
    assert(metrics.totalIncome === 5000, 'totalIncome should be aggregated correctly from DB');
    assert(metrics.totalExpense === 250, 'totalExpense should be aggregated correctly from DB');
    assert(metrics.totalBalance === 4750, 'totalBalance should be totalIncome - totalExpense');

    // Verify categories
    assert(metrics.expenseByCategory.length === 2, 'Should have 2 expense categories');
    assert(metrics.expenseByCategory.find((c: any) => c.name === 'Food')?.value === 150, 'Food expense should be 150');
    assert(metrics.incomeByCategory.length === 1, 'Should have 1 income category');
    assert(metrics.incomeByCategory[0].name === 'Salary', 'Income category name should be Salary');

    // Verify monthly data structure (6 months)
    assert(metrics.monthlyData.length === 6, 'monthlyData should contain exactly 6 months');
    
    // Verify trend data
    assert(Array.isArray(metrics.trendData), 'trendData should be an array');
    assert(metrics.trendData.length <= 15, 'trendData should be sliced to at most 15 days');

    // Verify burn rate and income rate data (30 days)
    assert(metrics.burnRateData.length === 30, 'burnRateData should contain exactly 30 days');
    assert(metrics.incomeRateData.length === 30, 'incomeRateData should contain exactly 30 days');

    console.log('🎉 ALL TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(err => {
    console.error('❌ Test execution failed with error:', err);
    process.exit(1);
});
