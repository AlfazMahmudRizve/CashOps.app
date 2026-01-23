import Link from "next/link";
import { ArrowLeft, Command, Upload, RefreshCw, BarChart2 } from "lucide-react";

export default function GuidePage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-12">
            <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                    <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white mb-4 transition-colors">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                    </Link>
                    <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">User Manual</h1>
                    <p className="text-xl text-slate-500 dark:text-slate-400">Mastering your finances with CashOps.</p>
                </div>

                <div className="space-y-10">
                    {/* Shortcuts */}
                    <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                                <Command className="h-6 w-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Keyboard Shortcuts</h2>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                            Navigate efficiently without leaving your keyboard.
                        </p>
                        <ul className="space-y-3">
                            <li className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 last:border-0 last:pb-0">
                                <span className="font-medium text-slate-700 dark:text-slate-200">Open "Add Transaction" Dialog</span>
                                <div className="flex gap-1">
                                    <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-sm font-mono text-slate-500 border border-slate-200 dark:border-slate-700">Cmd</kbd>
                                    <span className="text-slate-400">+</span>
                                    <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-sm font-mono text-slate-500 border border-slate-200 dark:border-slate-700">K</kbd>
                                </div>
                            </li>
                        </ul>
                    </section>

                    {/* CSV Import */}
                    <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                                <Upload className="h-6 w-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Bulk CSV Import</h2>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                            Migrate data from other apps or bank statements easily.
                        </p>
                        <ol className="list-decimal list-inside space-y-2 text-slate-600 dark:text-slate-300 marker:text-emerald-500 marker:font-bold">
                            <li>Click the <strong>Import</strong> button next to "Add Record".</li>
                            <li>Drag and drop your <strong>.csv</strong> file into the dropzone.</li>
                            <li>Review the parsed data in the preview table.</li>
                            <li>Click <strong>Confirm Import</strong> to save bulk records.</li>
                        </ol>
                        <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-sm text-slate-500">
                            <strong>Note:</strong> Ensure your CSV creates columns for <code>Date</code>, <code>Amount</code>, <code>Description</code> (optional), and <code>Category</code> (optional).
                        </div>
                    </section>

                    {/* Analytics */}
                    <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                                <BarChart2 className="h-6 w-6" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Burn Rate Chart</h2>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                            Monitor your spending velocity with the new <strong>Burn Rate</strong> chart at the bottom of the dashboard.
                        </p>
                        <p className="text-slate-600 dark:text-slate-300">
                            It visualizes your daily spending over the last 30 days, helping you identify spending spikes and potential cash flow issues.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
