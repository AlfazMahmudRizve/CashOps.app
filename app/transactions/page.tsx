import prisma from "@/lib/prisma";
import { DailyJournalView } from "@/components/DailyJournalView";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export default async function TransactionsPage() {
    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as any).id : undefined;

    let initialProducts: any[] = [];
    let initialSellers: any[] = [];
    let initialPurchases: any[] = [];
    let initialSales: any[] = [];

    if (userId && typeof userId === 'string') {
        try {
            const [products, sellers, purchases, sales] = await Promise.all([
                prisma.product.findMany({ where: { userId }, orderBy: { name: 'asc' } }),
                prisma.seller.findMany({ where: { userId }, orderBy: { name: 'asc' } }),
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
            initialProducts = products;
            initialSellers = sellers;
            initialPurchases = purchases;
            initialSales = sales;
        } catch (e) {
            console.error("Failed to fetch initial daily journal data", e);
        }
    }

    // Format dates for client components
    const formattedPurchases = initialPurchases.map(p => ({
        ...p,
        date: p.date.toISOString(),
    }));
    const formattedSales = initialSales.map(s => ({
        ...s,
        date: s.date.toISOString(),
    }));

    return (
        <DailyJournalView
            initialProducts={initialProducts}
            initialSellers={initialSellers}
            initialPurchases={formattedPurchases}
            initialSales={formattedSales}
        />
    );
}
