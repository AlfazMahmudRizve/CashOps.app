"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Modal } from "./Modal";
import { useSession } from "next-auth/react";
import { useGuestTransactions } from "@/hooks/useGuestTransactions";

export function AddTransactionDialog() {
    const router = useRouter();
    const { data: session } = useSession();
    const { addTransaction } = useGuestTransactions();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        description: "",
        amount: "",
        type: "expense",
        category: "Food", // Default category
        date: new Date().toISOString().split("T")[0],
    });

    const categories = ["Food", "Transport", "Rent", "Salary", "Entertainment", "Utilities", "Health", "Other"];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (session) {
                // Authenticated: Save to DB
                await fetch("/api/transactions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData),
                });
                router.refresh();
            } else {
                // Guest: Save to LocalStorage
                addTransaction({
                    description: formData.description,
                    amount: Number(formData.amount),
                    type: formData.type,
                    category: formData.category,
                    date: formData.date
                });
                // We might need to trigger a re-render in DashboardContainer if it doesn't pick up changes automatically.
                // The useGuestTransactions hook uses separate state per instance unless we use a Context or a window event.
                // Actually, custom hooks don't share state between components. 
                // We need a proper Context or dispatch a custom event.
                window.dispatchEvent(new Event("guest-transaction-updated"));
            }

            setIsModalOpen(false);
            setFormData({
                description: "",
                amount: "",
                type: "expense",
                category: "Food",
                date: new Date().toISOString().split("T")[0],
            });

        } catch (error) {
            console.error("Failed to add transaction", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
                <Plus className="mr-2 h-4 w-4" /> Add Transaction
            </button>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Transaction">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-900 dark:text-slate-200">Description</label>
                        <input
                            type="text"
                            required
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-emerald-500"
                            placeholder="e.g. Lunch with colleagues"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-900 dark:text-slate-200">Amount</label>
                        <input
                            type="number"
                            required
                            step="0.01"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-emerald-500"
                            placeholder="0.00"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-900 dark:text-slate-200">Type</label>
                        <div className="flex space-x-4">
                            <label className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
                                <input type="radio" value="expense" checked={formData.type === 'expense'} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                                <span>Expense</span>
                            </label>
                            <label className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
                                <input type="radio" value="income" checked={formData.type === 'income'} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                                <span>Income</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-900 dark:text-slate-200">Category</label>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="block w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-emerald-500"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="mr-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-2.5 text-sm font-medium text-slate-900 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-blue-700 dark:hover:text-blue-400"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-300 disabled:opacity-50"
                        >
                            {isSubmitting ? "Adding..." : "Add Transaction"}
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
