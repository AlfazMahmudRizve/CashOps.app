"use client";

import React, { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useGuestSourcing, Product, Seller, Purchase, Sale } from "@/hooks/useGuestSourcing";
import { 
    Plus, Trash2, AlertTriangle, CheckCircle, 
    TrendingUp, TrendingDown, Calendar, FileText, 
    ArrowRight, Info 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DailyJournalViewProps {
    initialProducts: Product[];
    initialSellers: Seller[];
    initialPurchases: Purchase[];
    initialSales: Sale[];
}

interface StagedEntry {
    tempId: string;
    type: "purchase" | "sale";
    productId: string;
    sellerId?: string; // only for purchase
    quantity: number;
    unitPrice: number;
    date: string;
    comment?: string; // required for low stock override
}

export function DailyJournalView({
    initialProducts = [],
    initialSellers = [],
    initialPurchases = [],
    initialSales = [],
}: DailyJournalViewProps) {
    const { data: session, status } = useSession();
    const isAuth = status === "authenticated";

    // Guest hooks
    const guestSourcing = useGuestSourcing();

    // Active lists based on auth state
    const products = isAuth ? initialProducts : guestSourcing.products;
    const sellers = isAuth ? initialSellers : guestSourcing.sellers;
    const dbPurchases = isAuth ? initialPurchases : guestSourcing.purchases;
    const dbSales = isAuth ? initialSales : guestSourcing.sales;

    // Form inputs state
    const [entryType, setEntryType] = useState<"purchase" | "sale">("purchase");
    const [selectedProductId, setSelectedProductId] = useState("");
    const [selectedSellerId, setSelectedSellerId] = useState("");
    const [quantity, setQuantity] = useState<number | "">("");
    const [unitPrice, setUnitPrice] = useState<number | "">("");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [comment, setComment] = useState("");

    // Staged entries state
    const [stagedEntries, setStagedEntries] = useState<StagedEntry[]>([]);

    // Warning modal state
    const [warningModalOpen, setWarningModalOpen] = useState(false);
    const [pendingEntry, setPendingEntry] = useState<StagedEntry | null>(null);
    const [overrideComment, setOverrideComment] = useState("");
    const [modalStockInfo, setModalStockInfo] = useState({ productName: "", stock: 0, requested: 0 });

    // Submission states
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    // Calculate current live stock of each product
    const liveStockMap = useMemo(() => {
        const stock: Record<string, number> = {};
        
        // Initialize
        products.forEach(p => {
            stock[p.id] = 0;
        });

        // Add purchases (investment)
        dbPurchases.forEach(p => {
            if (stock[p.productId] !== undefined) {
                stock[p.productId] += p.quantity;
            }
        });

        // Subtract existing sales (revenue)
        dbSales.forEach(s => {
            if (stock[s.productId] !== undefined) {
                stock[s.productId] -= s.quantity;
            }
        });

        // Account for staged entries that are not yet committed
        stagedEntries.forEach(entry => {
            if (stock[entry.productId] !== undefined) {
                if (entry.type === "purchase") {
                    stock[entry.productId] += entry.quantity;
                } else {
                    stock[entry.productId] -= entry.quantity;
                }
            }
        });

        return stock;
    }, [products, dbPurchases, dbSales, stagedEntries]);

    // Handle adding row to entry sheet stage
    const handleAddRow = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage("");
        setSuccessMessage("");

        if (!selectedProductId) {
            setErrorMessage("Please select a product");
            return;
        }

        if (entryType === "purchase" && !selectedSellerId) {
            setErrorMessage("Please select a seller for purchase");
            return;
        }

        const qtyNum = Number(quantity);
        const priceNum = Number(unitPrice);

        if (isNaN(qtyNum) || qtyNum <= 0) {
            setErrorMessage("Quantity must be greater than 0");
            return;
        }

        if (isNaN(priceNum) || priceNum < 0) {
            setErrorMessage("Price must be a positive number");
            return;
        }

        const product = products.find(p => p.id === selectedProductId);
        const productName = product ? product.name : "Selected Product";

        const newEntry: StagedEntry = {
            tempId: Math.random().toString(36).substring(2, 9),
            type: entryType,
            productId: selectedProductId,
            sellerId: selectedSellerId || undefined,
            quantity: qtyNum,
            unitPrice: priceNum,
            date: date || new Date().toISOString().split("T")[0],
            comment: entryType === "sale" ? comment : undefined
        };

        // If it's a sale, validate quantity against live stock
        if (entryType === "sale") {
            const currentStock = liveStockMap[selectedProductId] || 0;
            if (qtyNum > currentStock) {
                // Open Warning Modal
                setModalStockInfo({
                    productName,
                    stock: currentStock,
                    requested: qtyNum
                });
                setPendingEntry(newEntry);
                setOverrideComment("");
                setWarningModalOpen(true);
                return;
            }
        }

        // Add to staged list directly
        setStagedEntries([...stagedEntries, newEntry]);
        resetFormRow();
    };

    // Confirm proceeds with warning override comment
    const handleProceedOverride = () => {
        if (!overrideComment.trim()) {
            alert("Override comment is required to proceed.");
            return;
        }

        if (pendingEntry) {
            const updatedEntry = {
                ...pendingEntry,
                comment: overrideComment
            };
            setStagedEntries([...stagedEntries, updatedEntry]);
        }

        setWarningModalOpen(false);
        setPendingEntry(null);
        resetFormRow();
    };

    const resetFormRow = () => {
        setSelectedProductId("");
        setSelectedSellerId("");
        setQuantity("");
        setUnitPrice("");
        setComment("");
    };

    // Remove a staged row from sheet
    const handleRemoveRow = (tempId: string) => {
        setStagedEntries(stagedEntries.filter(entry => entry.tempId !== tempId));
    };

    // Submit journal entries to API or LocalStorage
    const handleSubmitJournal = async () => {
        if (stagedEntries.length === 0) {
            setErrorMessage("No entries staged to submit.");
            return;
        }

        setIsSubmitting(true);
        setErrorMessage("");
        setSuccessMessage("");

        try {
            if (isAuth) {
                // Submit to backend APIs in sequence or parallel
                for (const entry of stagedEntries) {
                    const url = entry.type === "purchase" ? "/api/purchases" : "/api/sales";
                    const payload = entry.type === "purchase"
                        ? {
                            productId: entry.productId,
                            sellerId: entry.sellerId,
                            quantity: entry.quantity,
                            unitPrice: entry.unitPrice,
                            date: entry.date,
                        }
                        : {
                            productId: entry.productId,
                            sellerId: entry.sellerId || undefined,
                            quantity: entry.quantity,
                            unitPrice: entry.unitPrice,
                            date: entry.date,
                            comment: entry.comment,
                        };

                    const response = await fetch(url, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(payload),
                    });

                    if (!response.ok) {
                        const errData = await response.json();
                        throw new Error(errData.error || `Failed to submit ${entry.type}`);
                    }
                }
            } else {
                // Submit to Local Storage via guest hook
                for (const entry of stagedEntries) {
                    if (entry.type === "purchase") {
                        guestSourcing.addPurchase({
                            productId: entry.productId,
                            sellerId: entry.sellerId || "",
                            quantity: entry.quantity,
                            unitPrice: entry.unitPrice,
                            date: new Date(entry.date).toISOString(),
                        });
                    } else {
                        guestSourcing.addSale({
                            productId: entry.productId,
                            sellerId: entry.sellerId || null,
                            quantity: entry.quantity,
                            unitPrice: entry.unitPrice,
                            date: new Date(entry.date).toISOString(),
                            comment: entry.comment || null,
                        });
                    }
                }
            }

            setSuccessMessage(`Successfully submitted ${stagedEntries.length} journal entry records!`);
            setStagedEntries([]);
            
            // Refresh if authenticated to trigger server re-fetch
            if (isAuth) {
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            }
        } catch (err: any) {
            setErrorMessage(err.message || "Failed to submit journal entries.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <div className="space-y-8 animate-fade-in-up pb-10">
            {/* Header info */}
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-700 pb-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-50 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-amber-500" />
                        Sourcing & Store Entry Sheet
                    </h2>
                    <p className="text-sm text-slate-400">
                        Record daily purchase acquisitions (Investment) and store checkout sales (Revenue).
                    </p>
                </div>
                {!isAuth && (
                    <div className="mt-3 md:mt-0 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800 text-emerald-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                        <Info className="h-4 w-4" /> Guest Mode: Auto-saved to LocalStorage
                    </div>
                )}
            </div>

            {/* Entry Form */}
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-violet-500 to-amber-500" />
                <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
                    <Plus className="h-5 w-5 text-violet-500" /> Add Record to Sheet
                </h3>

                <form onSubmit={handleAddRow} className={cn(
                    "grid grid-cols-1 gap-4 items-end",
                    entryType === "purchase" ? "md:grid-cols-6" : "md:grid-cols-7"
                )}>
                    {/* Record Type Selection */}
                    <div className="col-span-1">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                            Entry Type
                        </label>
                        <div className="flex rounded-lg overflow-hidden border border-slate-700 bg-slate-900/50 p-0.5">
                            <button
                                type="button"
                                onClick={() => {
                                    setEntryType("purchase");
                                    resetFormRow();
                                }}
                                className={cn(
                                    "flex-1 py-1.5 text-xs font-bold rounded-md transition-all",
                                    entryType === "purchase"
                                        ? "bg-amber-500 text-slate-900 shadow-sm"
                                        : "text-slate-400 hover:text-slate-200"
                                )}
                            >
                                Purchase
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setEntryType("sale");
                                    resetFormRow();
                                }}
                                className={cn(
                                    "flex-1 py-1.5 text-xs font-bold rounded-md transition-all",
                                    entryType === "sale"
                                        ? "bg-violet-500 text-white shadow-sm"
                                        : "text-slate-400 hover:text-slate-200"
                                )}
                            >
                                Sale
                            </button>
                        </div>
                    </div>

                    {/* Product Selection */}
                    <div className="col-span-1">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                            Product
                        </label>
                        <select
                            value={selectedProductId}
                            onChange={(e) => setSelectedProductId(e.target.value)}
                            required
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                            <option value="">-- Choose Product --</option>
                            {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name} (Stock: {liveStockMap[p.id] ?? 0})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Seller Dropdown (Required for Purchase, Optional for Sale) */}
                    <div className="col-span-1">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                            {entryType === "purchase" ? "Seller *" : "Source Seller (Opt)"}
                        </label>
                        <select
                            value={selectedSellerId}
                            onChange={(e) => setSelectedSellerId(e.target.value)}
                            required={entryType === "purchase"}
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                            <option value="">{entryType === "purchase" ? "-- Choose Seller --" : "-- None (Optional) --"}</option>
                            {sellers.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Optional Comment (Only for Sale) */}
                    {entryType === "sale" && (
                        <div className="col-span-1">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                                Optional Comment
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Bulk discount"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                        </div>
                    )}

                    {/* Quantity */}
                    <div className="col-span-1">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                            Quantity
                        </label>
                        <input
                            type="number"
                            min="1"
                            placeholder="Qty"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value === "" ? "" : Number(e.target.value))}
                            required
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                    </div>

                    {/* Price */}
                    <div className="col-span-1">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                            {entryType === "purchase" ? "Unit Cost" : "Unit Sale Price"}
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Price"
                            value={unitPrice}
                            onChange={(e) => setUnitPrice(e.target.value === "" ? "" : Number(e.target.value))}
                            required
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                    </div>

                    {/* Date */}
                    <div className="col-span-1 flex gap-2">
                        <div className="flex-1">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                                Date
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                        </div>
                        <button
                            type="submit"
                            className={cn(
                                "flex items-center justify-center p-2 rounded-lg cursor-pointer text-white shadow shadow-violet-900/30 btn-press h-10 w-10 self-end",
                                entryType === "purchase" ? "bg-[#8B5CF6] hover:bg-[#7c3aed]" : "bg-[#8B5CF6] hover:bg-[#7c3aed]"
                            )}
                            title="Add Entry"
                        >
                            <Plus className="h-5 w-5" />
                        </button>
                    </div>
                </form>

                {errorMessage && (
                    <div className="mt-4 rounded-lg bg-red-950/30 border border-red-900/50 p-3 text-sm text-red-400">
                        {errorMessage}
                    </div>
                )}
            </div>

            {/* Staged Journal Sheet */}
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 backdrop-blur-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/30">
                    <h3 className="text-md font-bold text-slate-200 flex items-center gap-2">
                        Staged Entries ({stagedEntries.length})
                    </h3>
                    {stagedEntries.length > 0 && (
                        <button
                            onClick={handleSubmitJournal}
                            disabled={isSubmitting}
                            className="bg-[#8B5CF6] text-white hover:bg-[#7c3aed] px-4 py-2 rounded-xl text-sm font-bold shadow-md shadow-violet-950/40 disabled:opacity-50 btn-press flex items-center gap-2 cursor-pointer"
                        >
                            {isSubmitting ? (
                                <span>Submitting...</span>
                            ) : (
                                <>
                                    <span>Submit Journal Sheet</span>
                                    <ArrowRight className="h-4 w-4" />
                                </>
                            )}
                        </button>
                    )}
                </div>

                {successMessage && (
                    <div className="mx-6 mt-4 rounded-lg bg-emerald-950/30 border border-emerald-900/50 p-4 text-sm text-emerald-400 flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 flex-shrink-0" />
                        <span>{successMessage}</span>
                    </div>
                )}

                {stagedEntries.length === 0 ? (
                    <div className="py-12 text-center text-slate-400">
                        <Calendar className="h-12 w-12 mx-auto text-slate-600 mb-3" />
                        <p className="font-medium">No staged entries in sheet.</p>
                        <p className="text-xs text-slate-500 mt-1">Use the form above to add items to your daily journal sheet.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-sm text-slate-300">
                            <thead className="bg-slate-900/50 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-700">
                                <tr>
                                    <th className="px-6 py-3">Type</th>
                                    <th className="px-6 py-3">Product</th>
                                    <th className="px-6 py-3">Seller / Comment</th>
                                    <th className="px-6 py-3 text-right">Quantity</th>
                                    <th className="px-6 py-3 text-right">Unit Price</th>
                                    <th className="px-6 py-3 text-right">Total</th>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700 bg-slate-800/20">
                                {stagedEntries.map((entry) => {
                                    const product = products.find(p => p.id === entry.productId);
                                    const seller = sellers.find(s => s.id === entry.sellerId);
                                    const total = entry.quantity * entry.unitPrice;

                                    return (
                                        <tr key={entry.tempId} className="hover:bg-slate-800/40 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={cn(
                                                    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide",
                                                    entry.type === "purchase"
                                                        ? "bg-amber-500/10 text-[#F59E0B]"
                                                        : "bg-violet-500/10 text-[#8B5CF6]"
                                                )}>
                                                    {entry.type === "purchase" ? (
                                                        <>
                                                            <TrendingDown className="h-3 w-3" />
                                                            <span>Purchase</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <TrendingUp className="h-3 w-3" />
                                                            <span>Sale</span>
                                                        </>
                                                    )}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-slate-200">
                                                {product ? product.name : "Unknown"}
                                            </td>
                                            <td className="px-6 py-4 max-w-[250px] truncate text-slate-300">
                                                {entry.type === "purchase" ? (
                                                    <span className="font-medium text-slate-200">
                                                        Seller: {seller ? seller.name : "Unknown"}
                                                    </span>
                                                ) : (
                                                    <div className="flex flex-col gap-0.5">
                                                        {seller && (
                                                            <span className="text-xs text-amber-500 font-semibold">
                                                                Source: {seller.name}
                                                            </span>
                                                        )}
                                                        <span className="italic text-slate-400 text-xs">
                                                            {entry.comment ? `"${entry.comment}"` : "—"}
                                                        </span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono">
                                                {entry.quantity}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono">
                                                ${entry.unitPrice.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-slate-200 font-mono">
                                                ${total.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-400 font-mono">
                                                {entry.date}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => handleRemoveRow(entry.tempId)}
                                                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                                                    title="Remove from sheet"
                                                >
                                                    <Trash2 className="h-4.5 w-4.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>

        {/* Warning Stock Override Modal */}
            {warningModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in-scale">
                    <div className="w-full max-w-md rounded-xl border border-slate-700 bg-[#1E293B] p-6 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-500" />
                        
                        <div className="flex items-center gap-3 text-[#F59E0B] mb-4">
                            <AlertTriangle className="h-6 w-6 flex-shrink-0" />
                            <h4 className="text-lg font-bold">Warning: Stock Deficiency Alert</h4>
                        </div>

                        <div className="space-y-4">
                            <p className="text-sm text-slate-300">
                                You are attempting to log a sale of <span className="font-bold text-slate-100">{modalStockInfo.requested}</span> units of <span className="font-bold text-slate-100">{modalStockInfo.productName}</span>, but the current live inventory stock count is only <span className="font-bold text-[#F59E0B]">{modalStockInfo.stock}</span>.
                            </p>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                                    Override Comment (Required to Proceed)
                                </label>
                                <textarea
                                    required
                                    rows={3}
                                    placeholder="Explain why stock level is being overridden (e.g. Pending delivery, backorder, inventory count error)..."
                                    value={overrideComment}
                                    onChange={(e) => setOverrideComment(e.target.value)}
                                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-slate-500"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setWarningModalOpen(false);
                                        setPendingEntry(null);
                                    }}
                                    className="px-4 py-2 border border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl text-sm font-semibold transition-all cursor-pointer"
                                >
                                    Abort
                                </button>
                                <button
                                    type="button"
                                    onClick={handleProceedOverride}
                                    className="px-4 py-2 bg-amber-500 text-slate-900 hover:bg-amber-400 rounded-xl text-sm font-bold shadow-md shadow-amber-950/20 transition-all cursor-pointer"
                                >
                                    Proceed Override
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
