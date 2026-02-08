"use client";

import { useState } from "react";
import { Download, FileText, Table } from "lucide-react";
import { Modal } from "./Modal";
import { Transaction } from "@/lib/analytics";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";

interface ExportReportDialogProps {
    transactions: Transaction[];
    metrics: { totalIncome: number; totalExpense: number; totalBalance: number };
}

export function ExportReportDialog({ transactions, metrics }: ExportReportDialogProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleCSV = () => {
        exportToCSV(transactions, `cashops-export-${new Date().toISOString().split('T')[0]}`);
        setIsOpen(false);
    };

    const handlePDF = () => {
        exportToPDF(transactions, metrics);
        setIsOpen(false);
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 text-sm font-medium transition-all text-slate-700 dark:text-zinc-300"
            >
                <Download className="h-4 w-4" />
                Export
            </button>

            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Export Report">
                <div className="space-y-4 p-2">
                    <p className="text-sm text-slate-500 dark:text-zinc-400 font-mono">
                        Export {transactions.length} transactions
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={handleCSV}
                            className="flex flex-col items-center gap-3 p-6 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all group"
                        >
                            <Table className="h-10 w-10 text-emerald-500 group-hover:scale-110 transition-transform" />
                            <span className="font-bold text-slate-900 dark:text-white">CSV</span>
                            <span className="text-xs text-slate-500 dark:text-zinc-500">Spreadsheet format</span>
                        </button>
                        <button
                            onClick={handlePDF}
                            className="flex flex-col items-center gap-3 p-6 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:border-red-500 dark:hover:border-red-500 transition-all group"
                        >
                            <FileText className="h-10 w-10 text-red-500 group-hover:scale-110 transition-transform" />
                            <span className="font-bold text-slate-900 dark:text-white">PDF</span>
                            <span className="text-xs text-slate-500 dark:text-zinc-500">Print / Save report</span>
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
