"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { DashboardView } from "./DashboardView";
import { calculateDashboardMetrics, Transaction } from "@/lib/analytics";
import { useGuestTransactions } from "@/hooks/useGuestTransactions";
import Link from "next/link";

interface DashboardContainerProps {
    serverTransactions?: Transaction[]; // Passed from page.tsx if logged in
}

export function DashboardContainer({ serverTransactions = [] }: DashboardContainerProps) {
    const { data: session, status } = useSession();
    const { transactions: guestTransactions } = useGuestTransactions();

    // Decide which source to use
    // If loading, maybe show skeleton? For now, we wait.
    // If authenticated, use serverTransactions (which should be real-time if we use router.refresh() on add)
    // If unauthenticated, use guestTransactions.

    const isAuth = status === "authenticated";
    const transactions = isAuth ? serverTransactions : guestTransactions;

    // Check for recurring transactions on load
    useEffect(() => {
        if (status === "authenticated") {
            fetch("/api/transactions/recurring/check", { method: "POST" })
                .then(res => res.json())
                .then(data => {
                    if (data.created > 0) {
                        // Refresh to show new transactions
                        window.location.reload();
                        // or router.refresh() but reload ensures data consistency visually if extensive
                    }
                })
                .catch(err => console.error("Recurring check failed", err));
        }
    }, [status]);

    const metrics = calculateDashboardMetrics(transactions);

    return (
        <>
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    {status === "loading" ? (
                        <div className="h-8 w-48 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-md" />
                    ) : isAuth ? (
                        null

                    ) : (
                        null

                    )}
                </div>
            </div>
            <DashboardView {...metrics} transactions={transactions} />
        </>
    );
}
