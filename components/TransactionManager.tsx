"use client";

import { useState } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Receipt } from "lucide-react";
import { Modal } from "./Modal";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useGuestTransactions } from "@/hooks/useGuestTransactions";
import { Transaction } from "@/lib/analytics";

interface TransactionManagerProps {
    initialTransactions?: Transaction[]; // For authenticated users
    // For guest users, we might need to rely on the hook within the component or pass data in.
    // To keep it simple, let's assume this component receives the "displayed" transactions
    // but also has the ability to trigger adds/deletes.
}

export function TransactionManager({ initialTransactions = [] }: TransactionManagerProps) {
    // For now, we are just displaying the transactions passed to us.
    // The DashboardContainer handles the source of truth (Guest vs Server).
    // However, for interactions (Delete), we need to know if we are in Guest or Auth mode.
    // We can infer or pass a handler. Let's rely on the parent to pass "transactions"
    // AND we probably need a way to refresh.

    // Actually, let's keep it simple: reliable display first.
    // This component will receive the list of transactions to show.
    // It will emit events or call APIs for actions.

    const router = useRouter();
    const { data: session } = useSession();
    const { transactions: guestTransactions, addTransaction, deleteTransaction } = useGuestTransactions();

    const transactions = initialTransactions;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        amount: "",
        type: "expense",
        category: "",
        date: new Date().toISOString().split("T")[0],
    });
    const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);

    // Sorting: Newest first
    const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const handleDelete = async (id: string) => {
        // Implementation depends on mode. For now, let's just log or emit.
        // In a real app, we'd pass a "onDelete" prop.
        console.log("Delete transaction", id);
        // Dispatch event for guest mode mostly
        window.dispatchEvent(new CustomEvent("guest-transaction-delete", { detail: id }));

        // For server mode, we'd assume the parent handles it or we call an API.
        // Let's assume an API exists for now for completeness if auth.
        try {
            if (session) {
                await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' });
                router.refresh();
            }
        } catch (e) {
            // Ignore error if it's guest mode / 404
            console.error(e);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (session) {
                await fetch("/api/transactions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData),
                });
                router.refresh();
            } else {
                addTransaction({
                    amount: Number(formData.amount),
                    type: formData.type,
                    category: formData.category,
                    description: "", // Simple Manager doesn't have description field in form yet, or we ignored it
                    date: formData.date
                } as any);
                // Trigger global update
                window.dispatchEvent(new Event("guest-transaction-updated"));
            }

            setIsModalOpen(false);
            setFormData({
                amount: "",
                type: "expense",
                category: "",
                date: new Date().toISOString().split("T")[0],
            });
        } catch (error) {
            console.error("Failed to add transaction", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Recent Transactions</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">View and manage your financial records</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-slate-900 text-white hover:bg-slate-900/90 h-10 py-2 px-4 dark:bg-slate-700 dark:hover:bg-slate-600"
                >
                    <Plus className="mr-2 h-4 w-4" /> Add Transaction
                </button>
            </div>

            {/* Transactions List */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-200">Description</th>
                                <th className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-200">Category</th>
                                <th className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-200">Date</th>
                                <th className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-200 text-right">Amount</th>
                                <th className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-200 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {sortedTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                                                <Receipt className="h-6 w-6 text-slate-400" />
                                            </div>
                                            <p className="font-medium">No transactions found</p>
                                            <p className="text-xs mt-1">Add a new transaction to get started</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                sortedTransactions.map((transaction) => (
                                    <tr
                                        key={transaction.id}
                                        className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-200"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900 dark:text-slate-200">{transaction.description || "Untitled Transaction"}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-800 dark:text-slate-300">
                                                {transaction.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                                            {format(new Date(transaction.date), "MMM d, yyyy")}
                                        </td>
                                        <td className={cn(
                                            "px-6 py-4 text-right font-medium",
                                            transaction.type === 'income' ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-slate-200"
                                        )}>
                                            {transaction.type === 'income' ? "+" : "-"}${Math.abs(transaction.amount).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDelete(transaction.id)} // Changed to call handleDelete directly
                                                className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                title="Delete transaction"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Transaction">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-900 dark:text-slate-200">Type</label>
                        <div className="flex space-x-4">
                            <label className="flex items-center space-x-2">
                                <span>Expense</span>
                            </label>
                            <label className="flex items-center space-x-2">
                                <input type="radio" value="income" checked={formData.type === 'income'} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                                <span>Income</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-900">Amount</label>
                        <input
                            type="number"
                            required
                            step="0.01"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            className="block w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:ring-emerald-500"
                            placeholder="0.00"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-900">Category</label>
                        <input
                            type="text"
                            required
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="block w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:ring-emerald-500"
                            placeholder="e.g. Food, Salary"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-900">Date</label>
                        <input
                            type="date"
                            required
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="block w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:ring-emerald-500"
                        />
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="mr-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-900 hover:bg-slate-100 hover:text-blue-700"
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
        </div>
    );
}
