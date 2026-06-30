"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
    DollarSign, TrendingUp, TrendingDown, 
    AlertTriangle, ShoppingBag, Package, 
    ArrowUpRight, AlertCircle, Info, Calendar, BookOpen
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Label } from "recharts";
import { cn } from "@/lib/utils";

interface DashboardViewProps {
    totalInvestment: number;
    totalRevenue: number;
    profitMargin: number;
    vendorDistribution: { name: string; value: number }[];
    productStocks: { id: string; name: string; category: string; purchased: number; sold: number; stock: number }[];
    purchases: any[];
    sales: any[];
}

const COLORS = ["#F59E0B", "#8B5CF6", "#10B981", "#06B6D4", "#EC4899", "#3B82F6"];

export function DashboardView({
    totalInvestment,
    totalRevenue,
    profitMargin,
    vendorDistribution,
    productStocks,
    purchases,
    sales,
}: DashboardViewProps) {
    const [filterCategory, setFilterCategory] = useState<string>("All");

    // Extract unique categories for filtering
    const categories = ["All", ...Array.from(new Set(productStocks.map(p => p.category)))];

    // Filtered products list sorted from lowest to maximum stock level
    const filteredProducts = productStocks
        .filter(p => filterCategory === "All" || p.category === filterCategory)
        .sort((a, b) => a.stock - b.stock);

    // Sum up totals for display inside the donut chart
    const totalVendorSourcing = vendorDistribution.reduce((sum, item) => sum + item.value, 0);

    return (
        <div className="space-y-8 pb-10 animate-fade-in-up">
            {/* Top Row Welcome and Action Button */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-700 pb-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-50">Operational Sourcing Ledger</h2>
                    <p className="text-sm text-slate-400">Overview of supply investments, stock count, and checkout revenue.</p>
                </div>
                <Link
                    href="/transactions"
                    className="bg-[#8B5CF6] hover:bg-[#7c3aed] text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-violet-900/30 transition-all btn-press flex items-center gap-2 cursor-pointer"
                >
                    <BookOpen className="h-4.5 w-4.5" />
                    <span>Open Daily Journal Sheet</span>
                </Link>
            </div>

            {/* Key Cards Row */}
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-3">
                {/* Total Investment Card */}
                <div className="relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-800/40 p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex flex-row items-start justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Investment (Sourcing)</p>
                            <h3 className="text-3xl font-extrabold mt-2 tracking-tight text-slate-100 font-mono">
                                ${totalInvestment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h3>
                            <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                                <span className="text-[#F59E0B] font-bold">{purchases.length}</span> sourcing entries logged
                            </p>
                        </div>
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[#F59E0B]">
                            <ShoppingBag className="h-6 w-6" />
                        </div>
                    </div>
                </div>

                {/* Total Revenue Card */}
                <div className="relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-800/40 p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex flex-row items-start justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Revenue (Sales)</p>
                            <h3 className="text-3xl font-extrabold mt-2 tracking-tight text-slate-100 font-mono">
                                ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h3>
                            <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                                <span className="text-emerald-400 font-bold">{sales.length}</span> checkout sales logged
                            </p>
                        </div>
                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                    </div>
                </div>

                {/* Profit Margin Card */}
                <div className="relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-800/40 p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex flex-row items-start justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Net Profit Margin</p>
                            <h3 className={cn(
                                "text-3xl font-extrabold mt-2 tracking-tight font-mono",
                                profitMargin >= 0 ? "text-emerald-400" : "text-red-400"
                            )}>
                                ${profitMargin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h3>
                            <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                                {profitMargin >= 0 ? (
                                    <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                                        Positive Margin <ArrowUpRight className="h-3 w-3" />
                                    </span>
                                ) : (
                                    <span className="text-red-400 font-semibold">Deficit Margin</span>
                                )}
                            </p>
                        </div>
                        <div className={cn(
                            "p-3 rounded-xl border",
                            profitMargin >= 0 
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                                : "bg-red-500/10 border-red-500/20 text-red-400"
                        )}>
                            <DollarSign className="h-6 w-6" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Vendor distribution and Stock alerts chart layout */}
            <div className="grid gap-6 grid-cols-1 md:grid-cols-5">
                {/* Vendor Distribution Chart (Donut Chart) */}
                <div className="col-span-1 md:col-span-2 rounded-2xl border border-slate-700 bg-slate-800/30 p-6 flex flex-col h-full min-w-0">
                    <div className="mb-4">
                        <h3 className="font-bold text-slate-200">Sourcing Costs by Vendor</h3>
                        <p className="text-xs text-slate-400 mt-1">Vendor share of sourcing investment</p>
                    </div>

                    <div className="h-[260px] w-full relative flex-1">
                        {vendorDistribution.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-500">
                                <Info className="h-10 w-10 text-slate-600 mb-2 animate-pulse" />
                                <p className="text-sm font-medium">No sourcing data found</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="99%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={vendorDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={65}
                                        outerRadius={95}
                                        paddingAngle={3}
                                        dataKey="value"
                                    >
                                        {vendorDistribution.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={COLORS[index % COLORS.length]}
                                                strokeWidth={0.5}
                                                stroke="#334155"
                                            />
                                        ))}
                                        <Label
                                            value={`$${totalVendorSourcing.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                                            position="center"
                                            className="fill-slate-100 text-xl font-bold font-mono"
                                        />
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: any) => [`$${Number(value).toFixed(2)}`, "Investment"]}
                                        contentStyle={{ 
                                            backgroundColor: '#1E293B', 
                                            borderRadius: '12px', 
                                            border: '1px solid #334155',
                                            color: '#F8FAFC'
                                        }}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        iconType="circle"
                                        formatter={(value) => <span className="text-slate-300 text-xs font-semibold">{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Stock Counts and Alerts Table */}
                <div className="col-span-1 md:col-span-3 rounded-2xl border border-slate-700 bg-slate-800/30 p-6 flex flex-col h-full min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <div>
                            <h3 className="font-bold text-slate-200">Stock Inventory Count</h3>
                            <p className="text-xs text-slate-400 mt-1">Live stock levels (sourcing vs. sales)</p>
                        </div>
                        {/* Category filter */}
                        <div className="flex items-center gap-1 text-xs">
                            <span className="text-slate-400 font-medium">Category:</span>
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="bg-slate-900 border border-slate-700 text-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto max-h-[300px] pr-1">
                        {filteredProducts.length === 0 ? (
                            <div className="py-12 text-center text-slate-500">
                                <Package className="h-10 w-10 mx-auto text-slate-600 mb-2" />
                                <p className="text-sm font-medium">No products found</p>
                            </div>
                        ) : (
                            <table className="w-full border-collapse text-left text-xs text-slate-300">
                                <thead className="bg-slate-900/50 sticky top-0 text-slate-400 border-b border-slate-700">
                                    <tr>
                                        <th className="px-4 py-2 font-bold uppercase tracking-wider">Product Name</th>
                                        <th className="px-4 py-2 font-bold uppercase tracking-wider">Category</th>
                                        <th className="px-4 py-2 text-right font-bold uppercase tracking-wider">Sourced</th>
                                        <th className="px-4 py-2 text-right font-bold uppercase tracking-wider">Sold</th>
                                        <th className="px-4 py-2 text-right font-bold uppercase tracking-wider">Live Stock</th>
                                        <th className="px-4 py-2 text-center font-bold uppercase tracking-wider">Alert</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/50 bg-slate-800/10">
                                    {filteredProducts.map((item) => {
                                        const isOutOfStock = item.stock <= 0;
                                        const isLowStock = item.stock > 0 && item.stock <= 5;
                                        
                                        return (
                                            <tr key={item.id} className={cn(
                                                "hover:bg-slate-800/40 transition-colors",
                                                isOutOfStock && "bg-red-500/5 hover:bg-red-500/10",
                                                isLowStock && "bg-amber-500/5 hover:bg-amber-500/10"
                                            )}>
                                                <td className="px-4 py-3 font-semibold text-slate-200">{item.name}</td>
                                                <td className="px-4 py-3 text-slate-400">{item.category}</td>
                                                <td className="px-4 py-3 text-right font-mono">{item.purchased}</td>
                                                <td className="px-4 py-3 text-right font-mono">{item.sold}</td>
                                                <td className={cn(
                                                    "px-4 py-3 text-right font-bold font-mono",
                                                    isOutOfStock && "text-red-400",
                                                    isLowStock && "text-amber-500",
                                                    !isOutOfStock && !isLowStock && "text-emerald-400"
                                                )}>
                                                    {item.stock}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={cn(
                                                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                                                        isOutOfStock && "bg-red-500/10 text-red-400 border border-red-500/25",
                                                        isLowStock && "bg-amber-500/10 text-amber-500 border border-amber-500/25",
                                                        !isOutOfStock && !isLowStock && "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25"
                                                    )}>
                                                        {isOutOfStock ? (
                                                            <>
                                                                <AlertCircle className="h-2.5 w-2.5" />
                                                                <span>Out</span>
                                                            </>
                                                        ) : isLowStock ? (
                                                            <>
                                                                <AlertTriangle className="h-2.5 w-2.5" />
                                                                <span>Low</span>
                                                            </>
                                                        ) : (
                                                            <span>OK</span>
                                                        )}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {/* Recents Lists Row - Preview of Activity */}
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                {/* Recent Purchases (Investment) */}
                <div className="rounded-2xl border border-slate-700 bg-slate-800/20 p-6 flex flex-col h-full min-w-0">
                    <h3 className="font-bold text-slate-200 mb-3 flex items-center gap-2">
                        <TrendingDown className="h-4.5 w-4.5 text-[#F59E0B]" />
                        Recent Sourcing Purchases
                    </h3>
                    <div className="flex-1 overflow-x-auto">
                        {purchases.length === 0 ? (
                            <p className="text-xs text-slate-500 py-6 text-center">No purchases recorded yet.</p>
                        ) : (
                            <table className="w-full text-left text-xs border-collapse">
                                <thead className="border-b border-slate-700 text-slate-400 bg-slate-900/10">
                                    <tr>
                                        <th className="px-3 py-2">Product</th>
                                        <th className="px-3 py-2">Seller</th>
                                        <th className="px-3 py-2 text-right">Qty</th>
                                        <th className="px-3 py-2 text-right">Unit Cost</th>
                                        <th className="px-3 py-2 text-right">Total Cost</th>
                                        <th className="px-3 py-2">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {purchases.slice(0, 5).map((p: any) => (
                                        <tr key={p.id} className="border-b border-slate-800/40 hover:bg-slate-800/20">
                                            <td className="px-3 py-2.5 font-bold text-slate-200">{p.product?.name || 'Unknown'}</td>
                                            <td className="px-3 py-2.5 text-amber-500 font-semibold">{p.seller?.name || 'Unknown'}</td>
                                            <td className="px-3 py-2.5 text-right font-mono">{p.quantity}</td>
                                            <td className="px-3 py-2.5 text-right font-mono text-slate-300">${p.unitPrice.toFixed(2)}</td>
                                            <td className="px-3 py-2.5 text-right font-bold font-mono text-slate-100">${p.totalCost.toFixed(2)}</td>
                                            <td className="px-3 py-2.5 text-slate-400 font-mono">{p.date.split('T')[0]}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Recent Sales (Revenue) */}
                <div className="rounded-2xl border border-slate-700 bg-slate-800/20 p-6 flex flex-col h-full min-w-0">
                    <h3 className="font-bold text-slate-200 mb-3 flex items-center gap-2">
                        <TrendingUp className="h-4.5 w-4.5 text-emerald-400" />
                        Recent Store Sales
                    </h3>
                    <div className="flex-1 overflow-x-auto">
                        {sales.length === 0 ? (
                            <p className="text-xs text-slate-500 py-6 text-center">No sales recorded yet.</p>
                        ) : (
                            <table className="w-full text-left text-xs border-collapse">
                                <thead className="border-b border-slate-700 text-slate-400 bg-slate-900/10">
                                    <tr>
                                        <th className="px-3 py-2">Product</th>
                                        <th className="px-3 py-2 text-right">Qty</th>
                                        <th className="px-3 py-2 text-right">Revenue</th>
                                        <th className="px-3 py-2">Comment</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sales.slice(0, 5).map((s: any) => (
                                        <tr key={s.id} className="border-b border-slate-800/40 hover:bg-slate-800/20">
                                            <td className="px-3 py-2.5 font-medium text-slate-200">{s.product?.name || 'Unknown'}</td>
                                            <td className="px-3 py-2.5 text-right font-mono">{s.quantity}</td>
                                            <td className="px-3 py-2.5 text-right font-mono">${s.totalRevenue.toFixed(2)}</td>
                                            <td className="px-3 py-2.5 text-slate-400 italic max-w-[120px] truncate">{s.comment || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
