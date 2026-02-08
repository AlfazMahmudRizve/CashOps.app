"use client";

import { cn } from "@/lib/utils";

interface BudgetCardProps {
    category: string;
    limit: number;
    spent: number;
    onDelete?: () => void;
}

export function BudgetCard({ category, limit, spent, onDelete }: BudgetCardProps) {
    const percentage = Math.min((spent / limit) * 100, 100);
    const remaining = limit - spent;
    const isOverBudget = spent > limit;
    const isWarning = percentage >= 80 && percentage < 100;

    return (
        <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-slate-300 dark:hover:border-zinc-700 transition-all group">
            <div className="flex items-center justify-between mb-3">
                <div>
                    <span className="text-xs font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-wider">
                        {category}
                    </span>
                    <div className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                        ${spent.toFixed(2)} <span className="text-slate-400 dark:text-zinc-600 text-sm font-normal">/ ${limit.toFixed(2)}</span>
                    </div>
                </div>
                {onDelete && (
                    <button
                        onClick={onDelete}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-500 transition-all text-xs"
                    >
                        Remove
                    </button>
                )}
            </div>

            {/* Progress Bar */}
            <div className="relative h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                    className={cn(
                        "h-full rounded-full transition-all duration-500",
                        isOverBudget
                            ? "bg-red-500"
                            : isWarning
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                    )}
                    style={{ width: `${percentage}%` }}
                />
            </div>

            {/* Status Text */}
            <div className="mt-2 flex justify-between text-xs font-mono">
                <span className={cn(
                    isOverBudget ? "text-red-500" : isWarning ? "text-amber-500" : "text-emerald-500"
                )}>
                    {percentage.toFixed(0)}% used
                </span>
                <span className={cn(
                    "font-bold",
                    isOverBudget ? "text-red-500" : "text-slate-500 dark:text-zinc-500"
                )}>
                    {isOverBudget
                        ? `$${Math.abs(remaining).toFixed(2)} over`
                        : `$${remaining.toFixed(2)} left`
                    }
                </span>
            </div>
        </div>
    );
}
