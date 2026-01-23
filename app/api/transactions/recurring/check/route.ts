
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }
        const userId = (session.user as any).id;

        const recurringOps = await prisma.recurringTransaction.findMany({
            where: { userId }
        });

        const now = new Date();
        const createdTransactions: any[] = [];

        for (const op of recurringOps) {
            const dayOfMonth = op.dayOfMonth;

            // Should generate for this month?
            const targetDate = new Date(now.getFullYear(), now.getMonth(), dayOfMonth);

            // Check if already generated: lastGenerated is in current month/year?
            let alreadyGenerated = false;
            if (op.lastGenerated) {
                const last = new Date(op.lastGenerated);
                if (last.getMonth() === now.getMonth() && last.getFullYear() === now.getFullYear()) {
                    alreadyGenerated = true;
                }
            }

            // Only generate if today >= targetDate (it's due) AND not generated yet
            if (now.getDate() >= dayOfMonth && !alreadyGenerated) {
                const newTx = await prisma.transaction.create({
                    data: {
                        userId,
                        amount: op.amount,
                        type: op.type,
                        category: op.category,
                        description: `${op.description} (Recurring)`,
                        date: targetDate,
                    }
                });

                await prisma.recurringTransaction.update({
                    where: { id: op.id },
                    data: { lastGenerated: now }
                });

                createdTransactions.push(newTx);
            }
        }

        return NextResponse.json({ processed: recurringOps.length, created: createdTransactions.length });

    } catch (error) {
        console.error("Recurring Check Error", error);
        return new NextResponse("Error checking recurring", { status: 500 });
    }
}
