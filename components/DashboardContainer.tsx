"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useMemo } from "react";
import { DashboardView } from "./DashboardView";
import { useGuestSourcing } from "@/hooks/useGuestSourcing";

interface DashboardContainerProps {
    initialData?: {
        totalInvestment: number;
        totalRevenue: number;
        profitMargin: number;
        vendorDistribution: { name: string; value: number }[];
        productStocks: { id: string; name: string; category: string; purchased: number; sold: number; stock: number }[];
        products: any[];
        sellers: any[];
        purchases: any[];
        sales: any[];
    } | null;
}

export function DashboardContainer({ initialData = null }: DashboardContainerProps) {
    const { data: session, status } = useSession();
    const guestSourcing = useGuestSourcing();
    
    const [dbData, setDbData] = useState<any>(initialData);
    const [loading, setLoading] = useState(true);

    const isAuth = status === "authenticated";

    // Fetch analytics on mount if authenticated and no initialData
    useEffect(() => {
        if (status === "authenticated") {
            if (!initialData) {
                setLoading(true);
                fetch("/api/analytics")
                    .then(res => res.json())
                    .then(data => {
                        if (data && !data.error) {
                            setDbData(data);
                        }
                        setLoading(false);
                    })
                    .catch(err => {
                        console.error("Failed to fetch analytics", err);
                        setLoading(false);
                    });
            } else {
                setDbData(initialData);
                setLoading(false);
            }
        } else if (status === "unauthenticated") {
            setLoading(false);
        }
    }, [status, initialData]);

    // Calculate metrics for Guest mode
    const guestMetrics = useMemo(() => {
        if (isAuth) return null;

        const { products, sellers, purchases, sales } = guestSourcing;

        const totalInvestment = purchases.reduce((sum, p) => sum + p.totalCost, 0);
        const totalRevenue = sales.reduce((sum, s) => sum + s.totalRevenue, 0);
        const profitMargin = totalRevenue - totalInvestment;

        // Group total sourcing costs per seller
        const vendorMap: Record<string, { name: string; value: number }> = {};
        sellers.forEach(s => {
            vendorMap[s.id] = { name: s.name, value: 0 };
        });
        purchases.forEach(p => {
            if (vendorMap[p.sellerId]) {
                vendorMap[p.sellerId].value += p.totalCost;
            } else {
                const sName = sellers.find(s => s.id === p.sellerId)?.name || 'Unknown';
                vendorMap[p.sellerId] = { name: sName, value: p.totalCost };
            }
        });
        const vendorDistribution = Object.values(vendorMap).filter(v => v.value > 0);

        // Product stock counts
        const stockMap: Record<string, { product: any; purchased: number; sold: number; stock: number }> = {};
        products.forEach(p => {
            stockMap[p.id] = { product: p, purchased: 0, sold: 0, stock: 0 };
        });
        purchases.forEach(p => {
            if (stockMap[p.productId]) {
                stockMap[p.productId].purchased += p.quantity;
                stockMap[p.productId].stock += p.quantity;
            }
        });
        sales.forEach(s => {
            if (stockMap[s.productId]) {
                stockMap[s.productId].sold += s.quantity;
                stockMap[s.productId].stock -= s.quantity;
            }
        });
        const productStocks = Object.values(stockMap).map(item => ({
            id: item.product.id,
            name: item.product.name,
            category: item.product.category,
            purchased: item.purchased,
            sold: item.sold,
            stock: item.stock
        }));

        const joinedPurchases = purchases.map(p => ({
            ...p,
            product: products.find(prod => prod.id === p.productId),
            seller: sellers.find(sel => sel.id === p.sellerId)
        }));

        const joinedSales = sales.map(s => ({
            ...s,
            product: products.find(prod => prod.id === s.productId)
        }));

        return {
            totalInvestment,
            totalRevenue,
            profitMargin,
            vendorDistribution,
            productStocks,
            purchases: joinedPurchases,
            sales: joinedSales
        };
    }, [isAuth, guestSourcing]);

    if (status === "loading" || loading) {
        return (
            <div className="space-y-8 animate-pulse pb-10">
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-3">
                    <div className="h-28 bg-slate-800/50 rounded-xl border border-slate-700" />
                    <div className="h-28 bg-slate-800/50 rounded-xl border border-slate-700" />
                    <div className="h-28 bg-slate-800/50 rounded-xl border border-slate-700" />
                </div>
                <div className="h-32 bg-slate-800/50 rounded-xl border border-slate-700" />
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                    <div className="h-72 bg-slate-800/50 rounded-xl border border-slate-700" />
                    <div className="h-72 bg-slate-800/50 rounded-xl border border-slate-700" />
                </div>
            </div>
        );
    }

    const data = isAuth ? dbData : guestMetrics;

    return (
        <DashboardView
            totalInvestment={data?.totalInvestment || 0}
            totalRevenue={data?.totalRevenue || 0}
            profitMargin={data?.profitMargin || 0}
            vendorDistribution={data?.vendorDistribution || []}
            productStocks={data?.productStocks || []}
            purchases={data?.purchases || []}
            sales={data?.sales || []}
        />
    );
}
