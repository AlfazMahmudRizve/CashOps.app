"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import { Upload, X, FileText, Check, AlertCircle, Eye } from "lucide-react";
import { Modal } from "./Modal";
import { useRouter } from "next/navigation";
import { useGuestTransactions } from "@/hooks/useGuestTransactions";
import { useSession } from "next-auth/react";

interface CsvTransaction {
    date: string;
    amount: number;
    description: string;
    category: string;
    type: "income" | "expense";
}

export function CsvImportDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [previewData, setPreviewData] = useState<CsvTransaction[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();
    const { data: session } = useSession();
    const { addTransaction } = useGuestTransactions();

    const onDrop = (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setError(null);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                try {
                    const parsed = results.data.map((row: any) => {
                        // Basic validation and mapping
                        // Expect headers: Date, Amount, Description, Category, Type
                        if (!row.Date || !row.Amount) {
                            throw new Error("Missing required columns: Date, Amount");
                        }

                        // Parse amount - handle currency symbols
                        const amount = parseFloat(String(row.Amount).replace(/[^0-9.-]+/g, ""));
                        if (isNaN(amount)) throw new Error("Invalid amount format");

                        // Validate Type
                        let type = "expense";
                        if (row.Type && row.Type.toLowerCase().includes("income")) type = "income";
                        // Auto-detect positive income if type missing?
                        // Let's stick to explicit type or default expense.

                        return {
                            date: new Date(row.Date).toISOString().split('T')[0], // YYYY-MM-DD
                            amount: Math.abs(amount),
                            description: row.Description || "Imported Transaction",
                            category: row.Category || "Uncategorized",
                            type: type as "income" | "expense"
                        };
                    });
                    setPreviewData(parsed);
                } catch (e: any) {
                    setError(e.message || "Failed to parse CSV. Check format.");
                    setPreviewData([]);
                }
            },
            error: (err) => {
                setError("Error reading file: " + err.message);
            }
        });
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'text/csv': ['.csv'] },
        maxFiles: 1
    });

    const handleImport = async () => {
        setIsSubmitting(true);
        try {
            if (session) {
                // Bulk Import API
                const res = await fetch("/api/transactions/import", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ transactions: previewData }),
                });

                if (!res.ok) throw new Error("Import failed");
                router.refresh();
            } else {
                // Guest Mode - Add one by one (or bulk add if hook supports it... hook currently only adds one)
                // We'll just loop for now, fast enough for local array
                previewData.forEach(t => {
                    addTransaction({
                        ...t,
                        category: { name: t.category } // Hook expects object
                    } as any);
                });
                window.dispatchEvent(new Event("guest-transaction-updated"));
            }

            setIsOpen(false);
            setPreviewData([]);
        } catch (e) {
            console.error(e);
            setError("Failed to import data.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="hidden sm:inline-flex items-center justify-center rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all font-mono ml-2"
                title="Import CSV"
            >
                <Upload className="h-4 w-4 mr-2" /> Import
            </button>

            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Import CSV Transactions">
                <div className="space-y-4">
                    {!previewData.length ? (
                        <div
                            {...getRootProps()}
                            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                                ${isDragActive ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-slate-300 dark:border-slate-700 hover:border-blue-400"}
                            `}
                        >
                            <input {...getInputProps()} />
                            <Upload className="mx-auto h-8 w-8 text-slate-400 mb-3" />
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                {isDragActive ? "Drop the CSV here..." : "Drag 'n' drop a CSV file, or click to select"}
                            </p>
                            <p className="text-xs text-slate-500 mt-2">
                                Required columns: Date, Amount, Description, Category, Type
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-md border border-emerald-100 dark:border-emerald-800">
                                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                                    <Check className="h-5 w-5" />
                                    <span className="font-bold">{previewData.length} records found</span>
                                </div>
                                <button onClick={() => setPreviewData([])} className="text-slate-400 hover:text-slate-600">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-md text-sm">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0 text-xs uppercase text-slate-500">
                                        <tr>
                                            <th className="p-2 font-medium">Date</th>
                                            <th className="p-2 font-medium">Desc</th>
                                            <th className="p-2 font-medium text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {previewData.slice(0, 50).map((row, i) => (
                                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                <td className="p-2 text-slate-600 dark:text-slate-400 truncate max-w-[80px]">{row.date}</td>
                                                <td className="p-2 font-medium text-slate-900 dark:text-white truncate max-w-[120px]">{row.description}</td>
                                                <td className={`p-2 text-right font-bold ${row.type === 'income' ? 'text-emerald-500' : 'text-slate-900 dark:text-white'}`}>
                                                    {row.type === 'expense' ? '-' : '+'}${row.amount.toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {previewData.length > 50 && (
                                    <p className="p-2 text-center text-xs text-slate-500 italic border-t border-slate-100 dark:border-slate-800">
                                        ...and {previewData.length - 50} more
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    onClick={() => { setPreviewData([]); setIsOpen(false); }}
                                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleImport}
                                    disabled={isSubmitting}
                                    className="px-4 py-2 rounded-sm bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {isSubmitting ? "Importing..." : "Confirm Import"}
                                </button>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 rounded-md flex items-start gap-2 text-red-600 dark:text-red-400 text-sm">
                            <AlertCircle className="h-5 w-5 flex-shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}
                </div>
            </Modal>
        </>
    );
}
