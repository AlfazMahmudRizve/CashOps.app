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

    const metrics = calculateDashboardMetrics(transactions);

    return (
        <>
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    {status === "loading" ? (
                        <div className="h-8 w-48 bg-slate-100 animate-pulse rounded-md" />
                    ) : isAuth ? (
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-500">Welcome back,</span>
                            <span className="text-2xl font-bold text-slate-900">{session.user?.name || session.user?.email?.split('@')[0] || "User"}!</span>
                        </div>
                    ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
                            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-emerald-900">Guest Mode Active</h3>
                                <p className="text-sm text-emerald-700">Your data is saved locally. <Link href="/login" className="underline font-medium hover:text-emerald-900">Login to sync devices</Link>.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <DashboardView {...metrics} />
        </>
    );
}
