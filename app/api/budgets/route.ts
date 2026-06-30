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

        const budgets = await prisma.budget.findMany({
            where: {
                userId,
            },
            orderBy: {
                category: 'asc',
            },
        });

        // Get spending (purchases) for current month grouped by category
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const spending = await prisma.purchase.findMany({
            where: {
                userId,
                date: {
                    gte: startOfMonth,
                },
            },
            include: {
                product: true,
            },
        });

        const spendingMap: Record<string, number> = {};
        spending.forEach(p => {
            const category = p.product?.category || 'Other';
            spendingMap[category] = (spendingMap[category] || 0) + p.totalCost;
        });

        const budgetsWithSpent = budgets.map(b => ({
            ...b,
            spent: spendingMap[b.category] || 0,
        }));

        return NextResponse.json(budgetsWithSpent);
    } catch (error) {
        console.error("Budget GET Error:", error);
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
        console.error("Budget POST Error:", error);
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

        const userId = (session.user as any).id;

        const budget = await prisma.budget.findUnique({
            where: { id },
        });

        if (!budget) {
            return NextResponse.json({ error: 'Budget not found' }, { status: 404 });
        }

        if (budget.userId !== userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await prisma.budget.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Budget DELETE Error:", error);
        return NextResponse.json({ error: 'Failed to delete budget' }, { status: 500 });
    }
}
