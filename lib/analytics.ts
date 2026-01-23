
export interface Transaction {
    id: string;
    amount: number;
    type: string;
    category: string;
    description: string;
    date: Date | string; // Date from DB, string from JSON/LocalStorage
    createdAt?: Date | string;
}

export function calculateDashboardMetrics(transactions: Transaction[]) {
    // Normalize dates
    const normalizedTransactions = transactions.map(t => ({
        ...t,
        dateValue: new Date(t.date),
    }));

    const totalIncome = normalizedTransactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = normalizedTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);

    const totalBalance = totalIncome - totalExpense;

    // Helper to extract category name
    const getCategoryName = (category: any): string => {
        if (typeof category === 'object' && category !== null && 'name' in category) {
            return category.name || "Uncategorized";
        }
        return String(category || "Uncategorized");
    };

    // Group expenses by category
    const expenseByCategoryMap = normalizedTransactions
        .filter((t) => t.type === "expense")
        .reduce((acc, t) => {
            const catName = getCategoryName(t.category);
            acc[catName] = (acc[catName] || 0) + t.amount;
            return acc;
        }, {} as Record<string, number>);

    const expenseByCategory = Object.entries(expenseByCategoryMap).map(([name, value]) => ({
        name,
        value,
    }));

    // Group income by category
    const incomeByCategoryMap = normalizedTransactions
        .filter((t) => t.type === "income")
        .reduce((acc, t) => {
            const catName = getCategoryName(t.category);
            acc[catName] = (acc[catName] || 0) + t.amount;
            return acc;
        }, {} as Record<string, number>);

    const incomeByCategory = Object.entries(incomeByCategoryMap).map(([name, value]) => ({
        name,
        value,
    }));

    // Monthly Activity (Last 6 months)
    const monthlyDataMap = new Map<string, { income: number; expense: number }>();
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = d.toLocaleString('default', { month: 'short' });
        monthlyDataMap.set(monthKey, { income: 0, expense: 0 });
    }

    normalizedTransactions.forEach((t) => {
        const monthKey = t.dateValue.toLocaleString('default', { month: 'short' });
        if (monthlyDataMap.has(monthKey)) {
            const current = monthlyDataMap.get(monthKey)!;
            if (t.type === 'income') current.income += t.amount;
            else current.expense += t.amount;
        }
    });

    const monthlyData = Array.from(monthlyDataMap.entries()).map(([name, data]) => ({
        name,
        ...data
    }));

    // Trend Data (Running Balance)
    let currentBalance = 0;
    const sortedTransactions = [...normalizedTransactions].sort((a, b) => a.dateValue.getTime() - b.dateValue.getTime());

    const dailyBalanceMap = new Map<string, number>();

    sortedTransactions.forEach((t) => {
        if (t.type === 'income') currentBalance += t.amount;
        else currentBalance -= t.amount;

        const dateKey = t.dateValue.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        dailyBalanceMap.set(dateKey, currentBalance);
    });

    const trendData = Array.from(dailyBalanceMap.entries())
        .map(([date, balance]) => ({ date, balance }))
        .slice(-15);

    // Burn Rate Data (Daily Expenses Last 30 Days)
    const burnRateMap = new Map<string, number>();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0); // Start of day

    // Initialize last 30 days with 0
    for (let i = 0; i < 30; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        burnRateMap.set(key, 0);
    }

    // Sort logic to match map keys? Actually map iteration order is insertion order usually, but safer to re-sort or build backwards.
    // Let's build map backwards (today -> 30 days ago) then reverse array?
    // Or just filter transactions >= 30 days ago.

    normalizedTransactions.forEach((t) => {
        if (t.type === 'expense' && t.dateValue >= thirtyDaysAgo) {
            const key = t.dateValue.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            if (burnRateMap.has(key)) {
                burnRateMap.set(key, burnRateMap.get(key)! + t.amount);
            }
        }
    });

    // Convert map to array and reverse to be chronological (oldest -> newest)
    // We initialized current -> past, so map has Today first.
    // wait, we want array to be Old -> New.
    // Let's re-build.

    const burnRateData: { date: string; amount: number }[] = [];
    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        burnRateData.push({
            date: key,
            amount: burnRateMap.get(key) || 0
        });
    }

    return {
        totalBalance,
        totalIncome,
        totalExpense,
        expenseByCategory,
        incomeByCategory,
        monthlyData,
        trendData,
        burnRateData,
    };
}
