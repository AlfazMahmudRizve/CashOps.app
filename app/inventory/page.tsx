import prisma from "@/lib/prisma";
import { InventoryManager } from "@/components/InventoryManager";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export default async function InventoryPage() {
    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as any).id : undefined;

    let initialProducts: any[] = [];
    let initialSellers: any[] = [];
    let initialSellerProducts: any[] = [];

    if (userId && typeof userId === 'string') {
        try {
            const [products, sellers, sellerProducts] = await Promise.all([
                prisma.product.findMany({ where: { userId }, orderBy: { name: 'asc' } }),
                prisma.seller.findMany({ where: { userId }, orderBy: { name: 'asc' } }),
                prisma.sellerProduct.findMany({
                    where: {
                        product: { userId }
                    },
                    include: {
                        product: true,
                        seller: true
                    },
                    orderBy: {
                        product: { name: 'asc' }
                    }
                })
            ]);
            initialProducts = products;
            initialSellers = sellers;
            initialSellerProducts = sellerProducts;
        } catch (e) {
            console.error("Failed to fetch initial inventory catalog data", e);
        }
    }

    return (
        <InventoryManager
            initialProducts={initialProducts}
            initialSellers={initialSellers}
            initialSellerProducts={initialSellerProducts}
        />
    );
}
