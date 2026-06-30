import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({ transactions: [], nextCursor: null });
}

export async function POST() {
    return NextResponse.json({ error: "Deprecated. Use /api/purchases and /api/sales endpoints." }, { status: 400 });
}
