import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({ error: "Deprecated" }, { status: 400 });
}

export async function PUT() {
    return NextResponse.json({ error: "Deprecated" }, { status: 400 });
}

export async function DELETE() {
    return NextResponse.json({ error: "Deprecated" }, { status: 400 });
}
