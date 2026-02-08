import { Transaction } from "./analytics";
import { format } from "date-fns";

export function exportToCSV(transactions: Transaction[], filename: string) {
    const headers = ["Date", "Description", "Category", "Type", "Amount"];
    const rows = transactions.map(t => [
        format(new Date(t.date), "yyyy-MM-dd"),
        t.description || "",
        typeof t.category === 'string' ? t.category : "",
        t.type,
        t.amount.toString()
    ]);

    const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
}

export function generateReportHTML(
    transactions: Transaction[],
    metrics: { totalIncome: number; totalExpense: number; totalBalance: number }
) {
    const totalIncome = metrics.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 });
    const totalExpense = metrics.totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2 });
    const totalBalance = metrics.totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 });

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>CashOps Financial Report</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'JetBrains Mono', 'SF Mono', monospace; padding: 40px; background: #0a0a0a; color: #fff; }
                h1 { color: #3b82f6; margin-bottom: 8px; }
                .date { color: #737373; margin-bottom: 32px; }
                .summary { display: flex; gap: 20px; margin: 20px 0; }
                .stat { padding: 24px; background: #171717; border-radius: 12px; flex: 1; border: 1px solid #262626; }
                .stat-label { font-size: 12px; color: #737373; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
                .stat-value { font-size: 28px; font-weight: bold; }
                .income { color: #22c55e; }
                .expense { color: #ef4444; }
                .balance { color: #3b82f6; }
                table { width: 100%; border-collapse: collapse; margin-top: 32px; }
                th, td { padding: 16px; text-align: left; border-bottom: 1px solid #262626; }
                th { color: #737373; text-transform: uppercase; font-size: 11px; letter-spacing: 1px; background: #171717; }
                .amount-income { color: #22c55e; font-weight: bold; }
                .amount-expense { color: #ef4444; font-weight: bold; }
                .category { background: #262626; padding: 4px 8px; border-radius: 4px; font-size: 11px; }
                @media print { body { background: white; color: black; } .stat { border: 1px solid #ccc; background: #f5f5f5; } th { background: #eee; } }
            </style>
        </head>
        <body>
            <h1>💸 CashOps Financial Report</h1>
            <p class="date">Generated: ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}</p>
            <div class="summary">
                <div class="stat"><div class="stat-label">Balance</div><div class="stat-value balance">$${totalBalance}</div></div>
                <div class="stat"><div class="stat-label">Total Income</div><div class="stat-value income">+$${totalIncome}</div></div>
                <div class="stat"><div class="stat-label">Total Expenses</div><div class="stat-value expense">-$${totalExpense}</div></div>
            </div>
            <table>
                <thead><tr><th>Date</th><th>Description</th><th>Category</th><th style="text-align:right">Amount</th></tr></thead>
                <tbody>
                    ${transactions.map(t => `
                        <tr>
                            <td>${format(new Date(t.date), "MMM d, yyyy")}</td>
                            <td>${t.description || "—"}</td>
                            <td><span class="category">${typeof t.category === 'string' ? t.category : ''}</span></td>
                            <td style="text-align:right" class="amount-${t.type}">${t.type === 'income' ? '+' : '-'}$${Math.abs(t.amount).toFixed(2)}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
            <p style="margin-top: 32px; color: #737373; font-size: 12px;">
                Total: ${transactions.length} transactions | Powered by CashOps
            </p>
        </body>
        </html>
    `;
}

export function exportToPDF(
    transactions: Transaction[],
    metrics: { totalIncome: number; totalExpense: number; totalBalance: number }
) {
    const html = generateReportHTML(transactions, metrics);
    const printWindow = window.open("", "_blank");
    if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 250);
    }
}
