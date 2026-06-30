import prisma from "@/lib/prisma";
import { DashboardContainer } from "@/components/DashboardContainer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await getServerSession(authOptions);
  const userId = session?.user ? (session.user as any).id : undefined;

  let initialData: any = null;

  if (userId && typeof userId === 'string') {
    try {
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

      // Calculate totals
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
              vendorMap[p.sellerId] = { name: p.seller?.name || 'Unknown', value: p.totalCost };
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

      initialData = JSON.parse(JSON.stringify({
        totalInvestment,
        totalRevenue,
        profitMargin,
        vendorDistribution,
        productStocks,
        products,
        sellers,
        purchases,
        sales
      }));
    } catch (e) {
      console.error("Failed to fetch initial dashboard data", e);
    }
  }

  return (
    <DashboardContainer initialData={initialData} />
  );
}
