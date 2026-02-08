"use client";

import { useState } from "react";
import { RefreshCw, Trash2, Plus } from "lucide-react";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Modal } from "./Modal";

interface RecurringTransaction {
    id: string;
    amount: number;
    type: string;
    category: string;
    description: string;
    dayOfMonth: number;
    lastGenerated?: string | null;
}

interface RecurringManagerProps {
    recurringTransactions: RecurringTransaction[];
}

const CATEGORIES = [
    "Food", "Transport", "Housing", "Salary", "Freelance",
    "Utilities", "Entertainment", "Health", "Shopping", "Other"
];

export function RecurringManager({ recurringTransactions }: RecurringManagerProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [formData, setFormData] = useState({
        type: "expense",
        category: CATEGORIES[0],
        amount: "",
        description: "",
        dayOfMonth: "1",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!session) {
        return null; // Recurring only works for authenticated users
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.amount) return;

        setIsSubmitting(true);
        try {
            const date = new Date();
            date.setDate(parseInt(formData.dayOfMonth));

            await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: formData.type,
                    category: formData.category,
                    amount: parseFloat(formData.amount),
                    description: formData.description,
                    date: date.toISOString(),
                    isRecurring: true,
                }),
            });
            setFormData({
                type: "expense",
                category: CATEGORIES[0],
                amount: "",
                description: "",
                dayOfMonth: "1",
            });
            setIsOpen(false);
            router.refresh();
        } catch (err) {
            console.error("Failed to create recurring transaction", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this recurring transaction? Future generations will stop.")) return;

        try {
            await fetch(`/api/transactions/recurring/${id}`, { method: 'DELETE' });
            router.refresh();
        } catch (err) {
            console.error("Failed to delete", err);
        }
    };

    if (recurringTransactions.length === 0) {
        return (
            <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/30">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <RefreshCw className="h-5 w-5 text-slate-400 dark:text-zinc-600" />
                        <div>
                            <h4 className="font-bold text-slate-700 dark:text-zinc-300 text-sm">Recurring Transactions</h4>
                            <p className="text-xs text-slate-500 dark:text-zinc-500">No recurring transactions set</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(true)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                    >
                        <Plus className="h-3 w-3" />
                        Add
                    </button>
                </div>

                <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Add Recurring Transaction">
                    <RecurringForm formData={formData} setFormData={setFormData} handleSubmit={handleSubmit} isSubmitting={isSubmitting} />
                </Modal>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-blue-500" />
                    Recurring Transactions
                </h4>
                <button
                    onClick={() => setIsOpen(true)}
                    className="flex items-center gap-1 px-2 py-1 rounded text-xs font-bold text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
                >
                    <Plus className="h-3 w-3" />
                    Add
                </button>
            </div>

            <div className="space-y-2">
                {recurringTransactions.map(rt => (
                    <div
                        key={rt.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 group"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${rt.type === 'income' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            <div>
                                <div className="font-bold text-sm text-slate-900 dark:text-white">
                                    {rt.description || rt.category}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-zinc-500">
                                    Day {rt.dayOfMonth} of each month
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`font-bold font-mono ${rt.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>
                                {rt.type === 'income' ? '+' : '-'}${rt.amount.toFixed(2)}
                            </span>
                            <button
                                onClick={() => handleDelete(rt.id)}
                                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Add Recurring Transaction">
                <RecurringForm formData={formData} setFormData={setFormData} handleSubmit={handleSubmit} isSubmitting={isSubmitting} />
            </Modal>
        </div>
    );
}

function RecurringForm({ formData, setFormData, handleSubmit, isSubmitting }: any) {
    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-2">
            <div className="grid grid-cols-2 gap-3">
                <button
                    type="button"
                    onClick={() => setFormData((f: any) => ({ ...f, type: 'expense' }))}
                    className={`py-2 rounded-lg font-bold text-sm transition-all ${formData.type === 'expense' ? 'bg-red-500 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'}`}
                >
                    Expense
                </button>
                <button
                    type="button"
                    onClick={() => setFormData((f: any) => ({ ...f, type: 'income' }))}
                    className={`py-2 rounded-lg font-bold text-sm transition-all ${formData.type === 'income' ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'}`}
                >
                    Income
                </button>
            </div>

            <div>
                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase mb-2 block">Category</label>
                <select
                    value={formData.category}
                    onChange={(e) => setFormData((f: any) => ({ ...f, category: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-mono"
                >
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
            </div>

            <div>
                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase mb-2 block">Amount ($)</label>
                <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData((f: any) => ({ ...f, amount: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-mono"
                    required
                />
            </div>

            <div>
                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase mb-2 block">Description</label>
                <input
                    type="text"
                    placeholder="e.g., Netflix, Rent"
                    value={formData.description}
                    onChange={(e) => setFormData((f: any) => ({ ...f, description: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-mono"
                />
            </div>

            <div>
                <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase mb-2 block">Day of Month</label>
                <select
                    value={formData.dayOfMonth}
                    onChange={(e) => setFormData((f: any) => ({ ...f, dayOfMonth: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-mono"
                >
                    {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                        <option key={day} value={day}>{day}</option>
                    ))}
                </select>
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-lg bg-blue-500 text-white font-bold hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
                {isSubmitting ? "Creating..." : "Create Recurring"}
            </button>
        </form>
    );
}
