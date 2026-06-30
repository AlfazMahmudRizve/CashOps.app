"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function Shell({ children }: { children: React.ReactNode }) {
    // Default open on desktop (can be smarter, but start simple)
    // Actually, to avoid hydration mismatch, let's start with false or rely on useEffect to set it.
    // Or better, just default to true and let CSS handle mobile hiding initially?
    // User wants toggle.
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const pathname = usePathname();

    return (
        <div>
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div className={cn(
                "min-h-screen transition-all duration-300 ease-in-out p-4 bg-slate-50 dark:bg-slate-950",
                isSidebarOpen ? "sm:ml-64" : "ml-0"
            )}>
                {/* Header / Toggle Bar */}
                <div className="mb-8 flex items-center justify-between">
                    <div className="flex items-center">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 mr-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            aria-label="Toggle Sidebar"
                        >
                            <Menu className="h-6 w-6" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                {pathname === "/" ? "Dashboard" :
                                    pathname === "/transactions" ? "Daily Journal" :
                                        "CashOps"}
                            </h1>
                        </div>
                    </div>
                </div>

                {children}
            </div>
        </div>
    );
}
