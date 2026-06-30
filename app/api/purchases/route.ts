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
        const purchases = await prisma.purchase.findMany({
            where: { userId: (session.user as any).id },
            orderBy: { date: 'desc' },
            include: { product: true, seller: true }
        });
        return NextResponse.json(purchases);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch purchases' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const body = await request.json();
        const { productId, sellerId, quantity, unitPrice, date } = body;
        const userId = (session.user as any).id;

        const qty = parseInt(quantity, 10);
        const price = parseFloat(unitPrice);

        if (!productId || !sellerId || isNaN(qty) || qty <= 0 || isNaN(price) || price < 0 || !date) {
            return NextResponse.json({ error: 'Invalid or missing fields' }, { status: 400 });
        }

        // Validate product ownership
        const product = await prisma.product.findFirst({
            where: { id: productId, userId }
        });
        if (!product) {
            return NextResponse.json({ error: 'Unauthorized product access' }, { status: 401 });
        }

        // Validate seller ownership
        const seller = await prisma.seller.findFirst({
            where: { id: sellerId, userId }
        });
        if (!seller) {
            return NextResponse.json({ error: 'Unauthorized seller access' }, { status: 401 });
        }

        const purchase = await prisma.purchase.create({
            data: {
                productId,
                sellerId,
                quantity: qty,
                unitPrice: price,
                totalCost: qty * price,
                date: new Date(date),
                userId,
            },
            include: { product: true, seller: true }
        });

        // Ensure SellerProduct relationship matches
        try {
            await prisma.sellerProduct.upsert({
                where: {
                    sellerId_productId: {
                        sellerId,
                        productId,
                    }
                },
                update: { costPrice: price },
                create: {
                    sellerId,
                    productId,
                    costPrice: price,
                }
            });
        } catch (err) {
            console.error("Failed to upsert SellerProduct", err);
        }

        return NextResponse.json(purchase);
    } catch (error) {
        console.error("Purchase creation error", error);
        return NextResponse.json({ error: 'Failed to create purchase' }, { status: 500 });
    }
}
