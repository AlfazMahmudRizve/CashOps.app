import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = (session.user as any).id;

        // Fetch all products, sellers, purchases, sales for this user in parallel
        const [products, sellers, purchases, sales] = await Promise.all([
            prisma.product.findMany({ where: { userId } }),
            prisma.seller.findMany({ where: { userId } }),
            prisma.purchase.findMany({
                where: { userId },
                include: { product: true, seller: true },
                orderBy: { date: 'desc' }
            }),
            prisma.sale.findMany({
                where: { userId },
                include: { product: true },
                orderBy: { date: 'desc' }
            })
        ]);

        const totalInvestment = purchases.reduce((sum, p) => sum + p.totalCost, 0);
        const totalRevenue = sales.reduce((sum, s) => sum + s.totalRevenue, 0);
        const netProfit = totalRevenue - totalInvestment;
        const averageMargin = totalRevenue > 0 ? (totalRevenue - totalInvestment) / totalRevenue : 0;

        // Group total sourcing costs per seller
        const vendorMap: Record<string, { name: string; totalCost: number; totalItems: number }> = {};
        sellers.forEach(s => {
            vendorMap[s.id] = { name: s.name, totalCost: 0, totalItems: 0 };
        });
        purchases.forEach(p => {
            if (vendorMap[p.sellerId]) {
                vendorMap[p.sellerId].totalCost += p.totalCost;
                vendorMap[p.sellerId].totalItems += p.quantity;
            } else {
                vendorMap[p.sellerId] = {
                    name: p.seller?.name || 'Unknown',
                    totalCost: p.totalCost,
                    totalItems: p.quantity
                };
            }
        });
        const vendorList = Object.values(vendorMap).filter(v => v.totalCost > 0);

        // Product stock counts
        const stockMap: Record<string, { id: string; name: string; category: string; purchased: number; sold: number; stock: number; currentStock: number; totalInvestment: number; totalRevenue: number }> = {};
        products.forEach(p => {
            stockMap[p.id] = { id: p.id, name: p.name, category: p.category, purchased: 0, sold: 0, stock: 0, currentStock: 0, totalInvestment: 0, totalRevenue: 0 };
        });
        purchases.forEach(p => {
            if (stockMap[p.productId]) {
                stockMap[p.productId].purchased += p.quantity;
                stockMap[p.productId].stock += p.quantity;
                stockMap[p.productId].currentStock += p.quantity;
                stockMap[p.productId].totalInvestment += p.totalCost;
            }
        });
        sales.forEach(s => {
            if (stockMap[s.productId]) {
                stockMap[s.productId].sold += s.quantity;
                stockMap[s.productId].stock -= s.quantity;
                stockMap[s.productId].currentStock -= s.quantity;
                stockMap[s.productId].totalRevenue += s.totalRevenue;
            }
        });
        const stockList = Object.values(stockMap);

        return NextResponse.json({
            totalInvestment,
            totalRevenue,
            profitMargin: netProfit, // For backward compatibility with older client code if any
            netProfit,
            averageMargin,
            vendorList,
            stockList,
            vendorDistribution: vendorList.map(v => ({ name: v.name, value: v.totalCost })), // For the Recharts chart
            productStocks: stockList.map(s => ({
                id: s.id,
                name: s.name,
                category: s.category,
                purchased: s.purchased,
                sold: s.sold,
                stock: s.stock
            })),
            products,
            sellers,
            purchases,
            sales
        });
    } catch (error) {
        console.error("Analytics fetch error:", error);
        return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }
}
