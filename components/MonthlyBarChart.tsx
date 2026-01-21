"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface MonthlyBarChartProps {
    data: {
        name: string;
        income: number;
        expense: number;
    }[];
}

export function MonthlyBarChart({ data }: MonthlyBarChartProps) {
    const hasData = data && data.length > 0 && data.some(d => d.income > 0 || d.expense > 0);

    return (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-lg transition-shadow duration-300 min-w-0 flex flex-col h-full">
            <div className="mb-6">
                <h3 className="font-bold leading-none tracking-tight text-slate-900">Monthly Activity</h3>
                <p className="text-sm text-slate-500 mt-1">Income vs Expenses over time</p>
            </div>
            <div className="h-[300px] w-full flex-1">
                {!hasData ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <div className="p-4 bg-slate-50 rounded-full mb-3">
                            <span className="text-2xl">📊</span>
                        </div>
                        <p>No activity recorded yet</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="99%" height="100%">
                        <BarChart
                            data={data}
                            margin={{
                                top: 5,
                                right: 30,
                                left: 20,
                                bottom: 5,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 12 }}
                                tickMargin={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 12 }}
                                tickFormatter={(value) => `$${value}`}
                            />
                            <Tooltip
                                cursor={{ fill: '#f8fafc' }}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend iconType="circle" />
                            <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                            <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
