import { DollarSign, TrendingDown, TrendingUp } from "lucide-react";
import { StatCard } from "./StatCard";
import { ExpensePieChart } from "./ExpensePieChart";
import { AddTransactionDialog } from "./AddTransactionDialog";
import { MonthlyBarChart } from "./MonthlyBarChart";
import { TrendAreaChart } from "./TrendAreaChart";
import { IncomePieChart } from "./IncomePieChart";
import { BurnRateChart } from "./BurnRateChart";
import { CsvImportDialog } from "./CsvImportDialog";

interface DashboardViewProps {
    totalBalance: number;
    totalIncome: number;
    totalExpense: number;
    expenseByCategory: { name: string; value: number }[];
    incomeByCategory: { name: string; value: number }[];
    monthlyData: { name: string; income: number; expense: number }[];
    trendData: { date: string; balance: number }[];
    burnRateData: { date: string; amount: number }[];
}

export function DashboardView({
    totalBalance,
    totalIncome,
    totalExpense,
    expenseByCategory,
    incomeByCategory,
    monthlyData,
    trendData,
    burnRateData,
}: DashboardViewProps) {
    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col sm:flex-row items-end justify-end gap-4 -mt-16 mb-6 pointer-events-none">
                <div className="pointer-events-auto flex gap-2">
                    <CsvImportDialog />
                    <AddTransactionDialog />
                </div>
            </div>

            <div className="grid gap-6 grid-cols-1 sm:grid-cols-3">
                <StatCard
                    title="Total Balance"
                    value={`$${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                    icon={DollarSign}
                />
                <StatCard
                    title="Total Income"
                    value={`$${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                    icon={TrendingUp}
                    color="green"
                />
                <StatCard
                    title="Total Expenses"
                    value={`$${totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                    icon={TrendingDown}
                    color="red"
                />
            </div>

            {/* Main Content Grid: 2x2 Equal Grid for Charts */}
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                <TrendAreaChart data={trendData} />
                <MonthlyBarChart data={monthlyData} />
                <IncomePieChart data={incomeByCategory} />
                <ExpensePieChart data={expenseByCategory} />
            </div>

            {/* Burn Rate - Full Width */}
            <div className="w-full">
                <BurnRateChart data={burnRateData} />
            </div>
        </div>
    );
}
