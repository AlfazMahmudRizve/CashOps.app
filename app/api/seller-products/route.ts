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

        const sellerProducts = await prisma.sellerProduct.findMany({
            where: {
                product: {
                    userId,
                },
            },
            include: {
                product: true,
                seller: true,
            },
            orderBy: {
                product: {
                    name: 'asc',
                },
            },
        });

        return NextResponse.json(sellerProducts);
    } catch (error) {
        console.error("SellerProducts GET error:", error);
        return NextResponse.json({ error: 'Failed to fetch seller products' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { productId, sellerId, costPrice } = body;
        const userId = (session.user as any).id;

        if (!productId || !sellerId || costPrice === undefined) {
            return NextResponse.json({ error: 'Product ID, Seller ID, and Cost Price are required' }, { status: 400 });
        }

        // Verify product ownership
        const product = await prisma.product.findUnique({
            where: { id: productId },
        });
        if (!product || product.userId !== userId) {
            return NextResponse.json({ error: 'Product not found or unauthorized' }, { status: 404 });
        }

        // Verify seller ownership
        const seller = await prisma.seller.findUnique({
            where: { id: sellerId },
        });
        if (!seller || seller.userId !== userId) {
            return NextResponse.json({ error: 'Seller not found or unauthorized' }, { status: 404 });
        }

        // Upsert the price relation
        const sellerProduct = await prisma.sellerProduct.upsert({
            where: {
                sellerId_productId: {
                    sellerId,
                    productId,
                },
            },
            update: {
                costPrice: Number(costPrice),
            },
            create: {
                sellerId,
                productId,
                costPrice: Number(costPrice),
            },
            include: {
                product: true,
                seller: true,
            },
        });

        return NextResponse.json(sellerProduct);
    } catch (error) {
        console.error("SellerProducts POST error:", error);
        return NextResponse.json({ error: 'Failed to create/update seller product price' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'SellerProduct relation ID required' }, { status: 400 });
        }

        const userId = (session.user as any).id;

        // Check relation ownership
        const sellerProduct = await prisma.sellerProduct.findUnique({
            where: { id },
            include: {
                product: true,
            },
        });

        if (!sellerProduct) {
            return NextResponse.json({ error: 'Seller product relation not found' }, { status: 404 });
        }

        if (sellerProduct.product.userId !== userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await prisma.sellerProduct.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("SellerProducts DELETE error:", error);
        return NextResponse.json({ error: 'Failed to delete seller product relationship' }, { status: 500 });
    }
}
