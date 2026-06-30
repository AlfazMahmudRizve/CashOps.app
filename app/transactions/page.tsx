import prisma from "@/lib/prisma";
import { DailyJournalView } from "@/components/DailyJournalView";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export default async function TransactionsPage() {
    let initialProducts: any[] = [];
    let initialSellers: any[] = [];
    let initialPurchases: any[] = [];
    let initialSales: any[] = [];

    try {
        const session = await getServerSession(authOptions);
        const userId = session?.user ? (session.user as any).id : undefined;

        if (userId && typeof userId === 'string') {
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
            initialProducts = JSON.parse(JSON.stringify(products));
            initialSellers = JSON.parse(JSON.stringify(sellers));
            initialPurchases = JSON.parse(JSON.stringify(purchases));
            initialSales = JSON.parse(JSON.stringify(sales));
        }
    } catch (e) {
        console.error("Failed to fetch initial daily journal data", e);
    }

    return (
        <DailyJournalView
            initialProducts={initialProducts}
            initialSellers={initialSellers}
            initialPurchases={initialPurchases}
            initialSales={initialSales}
        />
    );
}
