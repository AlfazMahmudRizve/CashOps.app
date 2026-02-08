"use client";

import { useState } from "react";
import { Plus, Target } from "lucide-react";
import { Modal } from "./Modal";
import { BudgetCard } from "./BudgetCard";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useGuestBudgets } from "@/hooks/useGuestBudgets";
import { Transaction } from "@/lib/analytics";

const CATEGORIES = [
    "Food", "Transport", "Housing", "Utilities",
    "Entertainment", "Health", "Shopping", "Other"
];

interface Budget {
    id: string;
    category: string;
    limit: number;
    period: string;
}

interface BudgetManagerProps {
    transactions: Transaction[];
    serverBudgets?: Budget[];
}

export function BudgetManager({ transactions, serverBudgets = [] }: BudgetManagerProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const { budgets: guestBudgets, addBudget: addGuestBudget, deleteBudget: deleteGuestBudget } = useGuestBudgets();

    const [isOpen, setIsOpen] = useState(false);
    const [formData, setFormData] = useState({ category: CATEGORIES[0], limit: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const budgets = session ? serverBudgets : guestBudgets;

    // Calculate spending per category from transactions (current month only)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const spendingByCategory = transactions
        .filter(t => t.type === 'expense' && new Date(t.date) >= startOfMonth)
        .reduce((acc, t) => {
            const cat = typeof t.category === 'string' ? t.category : 'Other';
            acc[cat] = (acc[cat] || 0) + t.amount;
            return acc;
        }, {} as Record<string, number>);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.limit) return;

        setIsSubmitting(true);
        try {
            if (session) {
                await fetch('/api/budgets', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        category: formData.category,
                        limit: parseFloat(formData.limit),
                    }),
                });
                router.refresh();
            } else {
                addGuestBudget({
                    category: formData.category,
                    limit: parseFloat(formData.limit),
                    period: 'monthly',
                });
            }
            setFormData({ category: CATEGORIES[0], limit: "" });
            setIsOpen(false);
        } catch (err) {
            console.error("Failed to save budget", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (budget: Budget) => {
        if (!confirm(`Remove budget for ${budget.category}?`)) return;

        try {
            if (session) {
                await fetch(`/api/budgets?id=${budget.id}`, { method: 'DELETE' });
                router.refresh();
            } else {
                deleteGuestBudget(budget.id);
            }
        } catch (err) {
            console.error("Failed to delete budget", err);
        }
    };

    // Filter out categories that already have budgets
    const availableCategories = CATEGORIES.filter(
        cat => !budgets.some(b => b.category === cat)
    );

    if (budgets.length === 0 && availableCategories.length === CATEGORIES.length) {
        return (
            <div className="p-6 rounded-xl border border-dashed border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/30 text-center">
                <Target className="h-10 w-10 mx-auto mb-3 text-slate-400 dark:text-zinc-600" />
                <h3 className="font-bold text-slate-700 dark:text-zinc-300 mb-1">No Budgets Set</h3>
                <p className="text-sm text-slate-500 dark:text-zinc-500 mb-4">
                    Set spending limits for categories to track your progress
                </p>
                <button
                    onClick={() => setIsOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-bold hover:bg-blue-600 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Create Budget
                </button>

                <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Create Budget">
                    <form onSubmit={handleSubmit} className="space-y-4 p-2">
                        <div>
                            <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase mb-2 block">Category</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData(f => ({ ...f, category: e.target.value }))}
                                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-mono"
                            >
                                {availableCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase mb-2 block">Monthly Limit ($)</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="500.00"
                                value={formData.limit}
                                onChange={(e) => setFormData(f => ({ ...f, limit: e.target.value }))}
                                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-mono"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3 rounded-lg bg-blue-500 text-white font-bold hover:bg-blue-600 disabled:opacity-50 transition-colors"
                        >
                            {isSubmitting ? "Saving..." : "Create Budget"}
                        </button>
                    </form>
                </Modal>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-mono flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-500" />
                    Budget Tracker
                </h3>
                {availableCategories.length > 0 && (
                    <button
                        onClick={() => setIsOpen(true)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
                    >
                        <Plus className="h-3 w-3" />
                        Add
                    </button>
                )}
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {budgets.map(budget => (
                    <BudgetCard
                        key={budget.id}
                        category={budget.category}
                        limit={budget.limit}
                        spent={spendingByCategory[budget.category] || 0}
                        onDelete={() => handleDelete(budget)}
                    />
                ))}
            </div>

            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Create Budget">
                <form onSubmit={handleSubmit} className="space-y-4 p-2">
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase mb-2 block">Category</label>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData(f => ({ ...f, category: e.target.value }))}
                            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-mono"
                        >
                            {availableCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase mb-2 block">Monthly Limit ($)</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="500.00"
                            value={formData.limit}
                            onChange={(e) => setFormData(f => ({ ...f, limit: e.target.value }))}
                            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-mono"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 rounded-lg bg-blue-500 text-white font-bold hover:bg-blue-600 disabled:opacity-50 transition-colors"
                    >
                        {isSubmitting ? "Saving..." : "Create Budget"}
                    </button>
                </form>
            </Modal>
        </div>
    );
}
