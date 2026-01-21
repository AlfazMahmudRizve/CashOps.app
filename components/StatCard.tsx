import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
    title: string;
    value: string;
    icon: LucideIcon;
    color?: "default" | "green" | "red";
    trend?: string;
}

export function StatCard({ title, value, icon: Icon, color = "default", trend }: StatCardProps) {
    const colorStyles = {
        default: {
            text: "text-blue-600",
            bg: "bg-blue-50",
            border: "border-slate-100",
            hover: "hover:shadow-blue-100/50"
        },
        green: {
            text: "text-emerald-600",
            bg: "bg-emerald-50",
            border: "border-slate-100",
            hover: "hover:shadow-emerald-100/50"
        },
        red: {
            text: "text-red-500",
            bg: "bg-red-50",
            border: "border-slate-100",
            hover: "hover:shadow-red-100/50"
        },
    };

    const currentStyle = colorStyles[color];

    return (
        <div className={cn(
            "relative overflow-hidden rounded-2xl border bg-white dark:bg-slate-900/50 p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
            currentStyle.border.replace("border-slate-100", "border-slate-100 dark:border-slate-800"),
            currentStyle.hover
        )}>
            <div className="flex flex-row items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
                    <h3 className={cn("text-3xl font-bold mt-2 tracking-tight text-slate-900 dark:text-white")}>{value}</h3>
                </div>
                <div className={cn("p-3 rounded-xl", currentStyle.bg, "dark:bg-opacity-20")}>
                    <Icon className={cn("h-6 w-6", currentStyle.text)} />
                </div>
            </div>

            {/* Decorative gradient overlay */}
            <div className={cn(
                "absolute -right-6 -bottom-6 h-24 w-24 rounded-full opacity-5 dark:opacity-10 pointer-events-none",
                currentStyle.bg.replace("bg-", "bg-") // Just reusing the color for a blob
            )} style={{ backgroundColor: "currentColor" }} />
        </div>
    );
}
