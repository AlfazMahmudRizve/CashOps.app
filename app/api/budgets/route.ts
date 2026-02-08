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

        const budgets = await prisma.budget.findMany({
            where: {
                userId: (session.user as any).id,
            },
            orderBy: {
                category: 'asc',
            },
        });
        return NextResponse.json(budgets);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch budgets' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { category, limit, period = 'monthly' } = body;
        const userId = (session.user as any).id;

        // Upsert - update if exists, create if not
        const budget = await prisma.budget.upsert({
            where: {
                userId_category: {
                    userId,
                    category,
                },
            },
            update: {
                limit: Number(limit),
                period,
            },
            create: {
                category,
                limit: Number(limit),
                period,
                userId,
            },
        });

        return NextResponse.json(budget);
    } catch (error) {
        console.error("Budget Error", error);
        return NextResponse.json({ error: 'Failed to create/update budget' }, { status: 500 });
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
            return NextResponse.json({ error: 'Budget ID required' }, { status: 400 });
        }

        await prisma.budget.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete budget' }, { status: 500 });
    }
}
