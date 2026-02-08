"use client";

import { useState } from "react";
import { Search, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TransactionFiltersProps {
    onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
    search: string;
    type: "all" | "income" | "expense";
    category: string;
    dateFrom: string;
    dateTo: string;
}

const CATEGORIES = [
    "All", "Food", "Transport", "Housing", "Salary", "Freelance",
    "Utilities", "Entertainment", "Health", "Shopping", "Other"
];

export function TransactionFilters({ onFilterChange }: TransactionFiltersProps) {
    const [filters, setFilters] = useState<FilterState>({
        search: "",
        type: "all",
        category: "All",
        dateFrom: "",
        dateTo: "",
    });
    const [isExpanded, setIsExpanded] = useState(false);

    const updateFilter = (key: keyof FilterState, value: string) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    const clearFilters = () => {
        const defaultFilters: FilterState = {
            search: "",
            type: "all",
            category: "All",
            dateFrom: "",
            dateTo: "",
        };
        setFilters(defaultFilters);
        onFilterChange(defaultFilters);
    };

    const hasActiveFilters = filters.search || filters.type !== "all" ||
        filters.category !== "All" || filters.dateFrom || filters.dateTo;

    return (
        <div className="space-y-4 mb-6">
            {/* Search Bar */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search transactions..."
                        value={filters.search}
                        onChange={(e) => updateFilter("search", e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                </div>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={cn(
                        "px-4 py-2.5 rounded-xl border text-sm font-medium transition-all flex items-center gap-2",
                        isExpanded
                            ? "bg-blue-500 text-white border-blue-500"
                            : "border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800"
                    )}
                >
                    <Filter className="h-4 w-4" />
                    Filters
                </button>
                {hasActiveFilters && (
                    <button
                        onClick={clearFilters}
                        className="px-3 py-2.5 rounded-xl border border-red-200 dark:border-red-900 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-all"
                        title="Clear filters"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Expanded Filters */}
            {isExpanded && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Type Filter */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase mb-2 block">Type</label>
                        <select
                            value={filters.type}
                            onChange={(e) => updateFilter("type", e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Types</option>
                            <option value="income">Income</option>
                            <option value="expense">Expense</option>
                        </select>
                    </div>

                    {/* Category Filter */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase mb-2 block">Category</label>
                        <select
                            value={filters.category}
                            onChange={(e) => updateFilter("category", e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    {/* Date From */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase mb-2 block">From</label>
                        <input
                            type="date"
                            value={filters.dateFrom}
                            onChange={(e) => updateFilter("dateFrom", e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Date To */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase mb-2 block">To</label>
                        <input
                            type="date"
                            value={filters.dateTo}
                            onChange={(e) => updateFilter("dateTo", e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
