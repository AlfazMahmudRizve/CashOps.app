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
        const sales = await prisma.sale.findMany({
            where: { userId: (session.user as any).id },
            orderBy: { date: 'desc' },
            include: { product: true, seller: true }
        });
        return NextResponse.json(sales);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const body = await request.json();
        const { productId, sellerId, quantity, unitPrice, date, comment } = body;
        const userId = (session.user as any).id;

        const qty = parseInt(quantity, 10);
        const price = parseFloat(unitPrice);

        if (!productId || isNaN(qty) || qty <= 0 || isNaN(price) || price < 0 || !date) {
            return NextResponse.json({ error: 'Invalid or missing fields' }, { status: 400 });
        }

        // Validate product ownership
        const product = await prisma.product.findFirst({
            where: { id: productId, userId }
        });
        if (!product) {
            return NextResponse.json({ error: 'Unauthorized product access' }, { status: 401 });
        }

        // Validate seller ownership if provided
        let finalSellerId = null;
        if (sellerId) {
            const seller = await prisma.seller.findFirst({
                where: { id: sellerId, userId }
            });
            if (!seller) {
                return NextResponse.json({ error: 'Unauthorized seller access' }, { status: 401 });
            }
            finalSellerId = sellerId;
        }

        // Calculate current stock level for this product
        const purchases = await prisma.purchase.findMany({
            where: { productId, userId }
        });
        const sales = await prisma.sale.findMany({
            where: { productId, userId }
        });
        const totalPurchased = purchases.reduce((sum, p) => sum + p.quantity, 0);
        const totalSold = sales.reduce((sum, s) => sum + s.quantity, 0);
        const currentStock = totalPurchased - totalSold;

        // If the quantity of a sale exceeds live stock, require comment override
        if (currentStock - qty < 0 && (!comment || !comment.trim())) {
            return NextResponse.json({ error: 'Sale quantity exceeds current stock. Override comment required.' }, { status: 400 });
        }

        const sale = await prisma.sale.create({
            data: {
                productId,
                sellerId: finalSellerId,
                quantity: qty,
                unitPrice: price,
                totalRevenue: qty * price,
                comment: comment || '',
                date: new Date(date),
                userId,
            },
            include: { product: true, seller: true }
        });

        return NextResponse.json(sale);
    } catch (error) {
        console.error("Sale creation error", error);
        return NextResponse.json({ error: 'Failed to create sale' }, { status: 500 });
    }
}
