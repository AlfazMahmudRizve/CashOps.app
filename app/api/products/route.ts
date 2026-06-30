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
        const products = await prisma.product.findMany({
            where: { userId: (session.user as any).id },
            orderBy: { name: 'asc' },
        });
        return NextResponse.json(products);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const body = await request.json();
        const { name, category, description, sku, sellerId, costPrice } = body;
        const userId = (session.user as any).id;

        if (!name) {
            return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            const product = await tx.product.create({
                data: {
                    name,
                    category: category || 'Other',
                    description: description || '',
                    sku: sku || '',
                    userId,
                },
            });

            if (sellerId && costPrice !== undefined) {
                const seller = await tx.seller.findUnique({
                    where: { id: sellerId },
                });
                if (seller && seller.userId === userId) {
                    await tx.sellerProduct.create({
                        data: {
                            productId: product.id,
                            sellerId,
                            costPrice: Number(costPrice),
                        },
                    });
                }
            }

            return product;
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("Product creation error", error);
        return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const body = await request.json();
        const { id, name, category, description, sku } = body;
        const userId = (session.user as any).id;

        if (!id) {
            return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
        }

        const existing = await prisma.product.findUnique({
            where: { id }
        });

        if (!existing) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        if (existing.userId !== userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const updated = await prisma.product.update({
            where: { id },
            data: {
                name: name !== undefined ? name : existing.name,
                category: category !== undefined ? category : existing.category,
                description: description !== undefined ? description : existing.description,
                sku: sku !== undefined ? sku : existing.sku,
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Product update error", error);
        return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
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
        const userId = (session.user as any).id;

        if (!id) {
            return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
        }

        const existing = await prisma.product.findUnique({
            where: { id }
        });

        if (!existing) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        if (existing.userId !== userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await prisma.product.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Product deletion error", error);
        return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
    }
}
