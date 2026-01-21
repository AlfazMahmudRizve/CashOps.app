import prisma from "@/lib/prisma";
import { DashboardView } from "@/components/DashboardView";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const transactions = await prisma.transaction.findMany();

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBalance = totalIncome - totalExpense;

  // Group expenses by category for pie chart
  const expenseByCategoryMap = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const expenseByCategory = Object.entries(expenseByCategoryMap).map(([name, value]) => ({
    name,
    value,
  }));

  // Group income by category for pie chart
  const incomeByCategoryMap = transactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
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

  transactions.forEach(t => {
    const d = new Date(t.date);
    const monthKey = d.toLocaleString('default', { month: 'short' });
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

  // Trend Data (Running Balance sorted by date)
  let currentBalance = 0;
  // Sort by date ascending for trend calculation
  const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Create a daily map to avoid too many points if explicit daily points are preferred, 
  // or just map every transaction. For cleaner chart, let's Aggregate by day.
  const dailyBalanceMap = new Map<string, number>();

  sortedTransactions.forEach(t => {
    if (t.type === 'income') currentBalance += t.amount;
    else currentBalance -= t.amount;

    const dateKey = new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    dailyBalanceMap.set(dateKey, currentBalance);
  });

  // Take last 10-15 data points for readability or all if small
  const trendData = Array.from(dailyBalanceMap.entries())
    .map(([date, balance]) => ({ date, balance }))
    .slice(-15); // Last 15 days active active

  return (
    <DashboardView
      totalBalance={totalBalance}
      totalIncome={totalIncome}
      totalExpense={totalExpense}
      expenseByCategory={expenseByCategory}
      incomeByCategory={incomeByCategory}
      monthlyData={monthlyData}
      trendData={trendData}
    />
  );
}
