"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, Area, AreaChart, CartesianGrid } from "recharts";

interface BurnRateChartProps {
    data: { date: string; amount: number }[];
}

export function BurnRateChart({ data }: BurnRateChartProps) {
    // Calculate average or total? Just visual.
    const hasData = data && data.some(d => d.amount > 0);

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-4">
                <h3 className="font-bold leading-none tracking-tight text-slate-900 dark:text-white">Burn Rate</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Daily spending velocity (Last 30 Days)</p>
            </div>
            <div className="h-[250px] w-full">
                {!hasData ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <p className="text-sm">No spending data available</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorBurn" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.1} />
                            <XAxis
                                dataKey="date"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                minTickGap={30}
                            />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="flex flex-col">
                                                        <span className="text-[0.70rem] uppercase text-slate-500 dark:text-slate-400">
                                                            Date
                                                        </span>
                                                        <span className="font-bold text-slate-500 dark:text-slate-400">
                                                            {payload[0].payload.date}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[0.70rem] uppercase text-slate-500 dark:text-slate-400">
                                                            Spent
                                                        </span>
                                                        <span className="font-bold text-red-500">
                                                            ${Number(payload[0].value).toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="amount"
                                stroke="#ef4444"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorBurn)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
