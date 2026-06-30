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
        const sellers = await prisma.seller.findMany({
            where: { userId: (session.user as any).id },
            orderBy: { name: 'asc' },
        });
        return NextResponse.json(sellers);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch sellers' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const body = await request.json();
        const { name, contactInfo } = body;
        const userId = (session.user as any).id;

        if (!name) {
            return NextResponse.json({ error: 'Seller name is required' }, { status: 400 });
        }

        const seller = await prisma.seller.create({
            data: {
                name,
                contactInfo: contactInfo || '',
                userId,
            },
        });

        return NextResponse.json(seller);
    } catch (error) {
        console.error("Seller creation error", error);
        return NextResponse.json({ error: 'Failed to create seller' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const body = await request.json();
        const { id, name, contactInfo } = body;
        const userId = (session.user as any).id;

        if (!id) {
            return NextResponse.json({ error: 'Seller ID is required' }, { status: 400 });
        }

        const existing = await prisma.seller.findUnique({
            where: { id }
        });

        if (!existing) {
            return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
        }

        if (existing.userId !== userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const updated = await prisma.seller.update({
            where: { id },
            data: {
                name: name !== undefined ? name : existing.name,
                contactInfo: contactInfo !== undefined ? contactInfo : existing.contactInfo,
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Seller update error", error);
        return NextResponse.json({ error: 'Failed to update seller' }, { status: 500 });
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
            return NextResponse.json({ error: 'Seller ID is required' }, { status: 400 });
        }

        const existing = await prisma.seller.findUnique({
            where: { id }
        });

        if (!existing) {
            return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
        }

        if (existing.userId !== userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await prisma.seller.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Seller deletion error", error);
        return NextResponse.json({ error: 'Failed to delete seller' }, { status: 500 });
    }
}
