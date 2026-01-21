"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface TrendAreaChartProps {
    data: {
        date: string;
        balance: number;
    }[];
}

export function TrendAreaChart({ data }: TrendAreaChartProps) {
    const hasData = data && data.length > 0 && data.some(d => d.balance !== 0);

    return (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-lg transition-shadow duration-300 min-w-0 flex flex-col h-full">
            <div className="mb-6">
                <h3 className="font-bold leading-none tracking-tight text-slate-900">Net Balance Trend</h3>
                <p className="text-sm text-slate-500 mt-1">Cumulative balance over time</p>
            </div>
            <div className="h-[300px] w-full flex-1">
                {!hasData ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <div className="p-4 bg-slate-50 rounded-full mb-3">
                            <span className="text-2xl">📉</span>
                        </div>
                        <p>No trend data available yet</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="99%" height="100%">
                        <AreaChart
                            data={data}
                            margin={{
                                top: 10,
                                right: 30,
                                left: 0,
                                bottom: 0,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="date"
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
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            />
                            <defs>
                                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area
                                type="monotone"
                                dataKey="balance"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorBalance)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
