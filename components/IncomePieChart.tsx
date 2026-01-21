"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Label } from "recharts";

interface IncomePieChartProps {
    data: { name: string; value: number }[];
}

const COLORS = ["#10b981", "#34d399", "#6ee7b7", "#a7f3d0", "#059669", "#047857"];

export function IncomePieChart({ data }: IncomePieChartProps) {
    const total = data.reduce((sum, item) => sum + item.value, 0);

    if (data.length === 0) {
        return (
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex h-[350px] w-full items-center justify-center text-slate-500">
                No income data available
            </div>
        )
    }

    return (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-300 h-full flex flex-col">
            <div className="mb-2">
                <h3 className="font-bold leading-none tracking-tight text-slate-800">Income by Category</h3>
                <p className="text-sm text-slate-500 mt-1">Sources of your income</p>
            </div>
            <div className="flex-1 min-h-[300px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[index % COLORS.length]}
                                    strokeWidth={0}
                                />
                            ))}
                            <Label
                                value={`$${total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                                position="center"
                                className="fill-slate-900 text-3xl font-bold"
                            />
                        </Pie>
                        <Tooltip
                            formatter={(value: any) => `$${Number(value).toFixed(2)}`}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            iconType="circle"
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
