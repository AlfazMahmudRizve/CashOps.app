"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Modal } from "./Modal";
import { useSession } from "next-auth/react";
import { useGuestTransactions } from "@/hooks/useGuestTransactions";

const FIXED_CATEGORIES = [
    "Food", "Transport", "Housing", "Salary", "Freelance",
    "Utilities", "Entertainment", "Health", "Shopping", "Other"
];

export function AddTransactionDialog() {
    const router = useRouter();
    const { data: session } = useSession();
    const { addTransaction } = useGuestTransactions();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Keyboard Shortcut (Cmd+K / Ctrl+K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setIsModalOpen((prev) => !prev);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const [formData, setFormData] = useState({
        description: "",
        amount: "",
        type: "expense",
        category: "Food",
        date: new Date().toISOString().split("T")[0],
        isRecurring: false
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (session) {
                // Authenticated: Send categoryName, backend handles upsert
                await fetch("/api/transactions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        ...formData,
                        categoryName: formData.category
                    }),
                });
                router.refresh();
            } else {
                // Guest: Local Storage
                addTransaction({
                    description: formData.description,
                    amount: Number(formData.amount),
                    type: formData.type,
                    category: { name: formData.category },
                    date: formData.date
                } as any);
                window.dispatchEvent(new Event("guest-transaction-updated"));
            }

            setIsModalOpen(false);
            setFormData({
                description: "",
                amount: "",
                type: "expense",
                category: "Food",
                date: new Date().toISOString().split("T")[0],
                isRecurring: false
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
                className="inline-flex items-center justify-center rounded-sm bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 transition-all font-mono shadow-sm shadow-blue-900/20"
            >
                <Plus className="mr-2 h-4 w-4" /> Add Record
            </button>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Financial Record">
                <form onSubmit={handleSubmit} className="space-y-5 font-mono">
                    {/* Amount Input - Prominent */}
                    <div>
                        <label className="mb-2 block text-xs uppercase tracking-wider text-zinc-500 font-bold">Amount</label>
                        <div className="relative">
                            <span className="absolute left-4 top-3 text-zinc-400 font-bold">$</span>
                            <input
                                type="number"
                                required
                                step="0.01"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                className="block w-full rounded-sm border border-zinc-800 bg-zinc-900 pl-8 p-3 text-lg font-bold text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    {/* Type Selection - Red/Green Tokens */}
                    <div>
                        <label className="mb-2 block text-xs uppercase tracking-wider text-zinc-500 font-bold">Transaction Type</label>
                        <div className="grid grid-cols-2 gap-4">
                            <label className={`
                                cursor-pointer rounded-sm border p-3 flex items-center justify-center space-x-2 transition-all
                                ${formData.type === 'expense'
                                    ? 'bg-red-500/10 border-red-500 text-red-500'
                                    : 'border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700'}
                            `}>
                                <input type="radio" value="expense" checked={formData.type === 'expense'} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="hidden" />
                                <span className="font-bold">Expense</span>
                            </label>

                            <label className={`
                                cursor-pointer rounded-sm border p-3 flex items-center justify-center space-x-2 transition-all
                                ${formData.type === 'income'
                                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500'
                                    : 'border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700'}
                            `}>
                                <input type="radio" value="income" checked={formData.type === 'income'} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="hidden" />
                                <span className="font-bold">Income</span>
                            </label>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="mb-2 block text-xs uppercase tracking-wider text-zinc-500 font-bold">Details</label>
                        <input
                            type="text"
                            required
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="block w-full rounded-sm border border-zinc-800 bg-zinc-900 p-3 text-sm text-zinc-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            placeholder="e.g. AWS Invoice"
                        />
                    </div>

                    {/* Category & Date */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-2 block text-xs uppercase tracking-wider text-zinc-500 font-bold">Category</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="block w-full rounded-sm border border-zinc-800 bg-zinc-900 p-3 text-sm text-zinc-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            >
                                {FIXED_CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="mb-2 block text-xs uppercase tracking-wider text-zinc-500 font-bold">Date</label>
                            <input
                                type="date"
                                required
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="block w-full rounded-sm border border-zinc-800 bg-zinc-900 p-3 text-sm text-zinc-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Recurring Toggle */}
                    <div className="flex items-center space-x-2 pt-2">
                        <input
                            type="checkbox"
                            id="recurring"
                            checked={formData.isRecurring}
                            onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                            className="rounded border-zinc-700 bg-zinc-900 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="recurring" className="text-sm text-zinc-400 select-none">
                            Recurring monthly
                        </label>
                    </div>

                    <div className="flex justify-end pt-6 space-x-3">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="rounded-sm border border-zinc-800 px-5 py-2.5 text-sm font-bold text-zinc-400 hover:text-white hover:bg-zinc-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="rounded-sm bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:opacity-50"
                        >
                            {isSubmitting ? "Processing..." : "Confirm"}
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
