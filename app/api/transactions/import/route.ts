
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
        if (!userId) {
            return new NextResponse("Invalid User ID", { status: 400 });
        }

        const body = await req.json();
        const { transactions } = body;

        if (!Array.isArray(transactions) || transactions.length === 0) {
            return new NextResponse("No transactions provided", { status: 400 });
        }

        // Validate and format
        const dataToInsert = transactions.map((t: any) => ({
            userId,
            amount: Number(t.amount),
            type: t.type || "expense",
            category: t.category || "Uncategorized",
            description: t.description || "Imported",
            date: new Date(t.date),
        }));

        await prisma.transaction.createMany({
            data: dataToInsert
        });

        return NextResponse.json({ success: true, count: dataToInsert.length });

    } catch (error) {
        console.error("[IMPORT_API_ERROR]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
