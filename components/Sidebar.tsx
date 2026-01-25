"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Receipt, LogOut, LogIn, X, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession, signOut } from "next-auth/react";
import { ThemeToggle } from "./ThemeToggle";

const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/transactions", label: "Transactions", icon: Receipt },
    { href: "/guide", label: "User Manual", icon: BookOpen },
];

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();
    const { data: session } = useSession();

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={cn(
                    "fixed inset-0 z-30 bg-slate-900/80 backdrop-blur-sm transition-opacity sm:hidden",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed left-0 top-0 z-40 h-screen w-64 border-r bg-[#0B1120] border-slate-800 transition-transform duration-300 ease-in-out flex flex-col",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Header / Logo */}
                <div className="flex h-16 items-center px-6 border-b border-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="relative h-8 w-8 overflow-hidden rounded-lg">
                            <img src="/logo.png" alt="CashOps Logo" className="h-full w-full object-cover" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-white font-mono">
                            CashOps
                        </span>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <div className="origin-center scale-75">
                            <ThemeToggle className="text-slate-400 hover:text-white hover:bg-slate-800" />
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 rounded-md hover:bg-slate-800 text-slate-400 sm:hidden"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto py-6 px-4 space-y-6">
                    {/* Status & Login Section */}
                    {session ? (
                        <div className="rounded-xl bg-slate-900/50 border border-slate-800 p-4 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <p className="text-xs text-blue-400 font-medium mb-1 uppercase tracking-wider">Welcome back</p>
                            <p className="text-sm font-bold text-white truncate">{session.user?.name || session.user?.email?.split('@')[0] || "User"}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="rounded-xl bg-emerald-950/30 border border-emerald-900/50 p-4 relative overflow-hidden">
                                <div className="flex items-center gap-2 mb-1.5 text-emerald-400">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 shadow shadow-emerald-500/50 animate-pulse" />
                                    <span className="text-[11px] font-bold uppercase tracking-widest">Guest Mode</span>
                                </div>
                                <p className="text-xs text-emerald-500/70 font-medium">Data saved locally.</p>
                            </div>

                            <Link
                                href="/login"
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 active:scale-[0.98]"
                            >
                                <LogIn className="h-4 w-4" />
                                <span>Login</span>
                            </Link>
                        </div>
                    )}

                    {/* Navigation */}
                    <nav>
                        <ul className="space-y-1">
                            {links.map((link) => {
                                const Icon = link.icon;
                                const isActive = pathname === link.href;
                                return (
                                    <li key={link.href}>
                                        <Link
                                            href={link.href}
                                            onClick={() => window.innerWidth < 640 && onClose()}
                                            className={cn(
                                                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                                                isActive
                                                    ? "bg-slate-800 text-white shadow-sm ring-1 ring-white/10"
                                                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                                            )}
                                        >
                                            <Icon className={cn("h-5 w-5 transition-colors", isActive ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300")} />
                                            <span>{link.label}</span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-800/50 space-y-4 bg-slate-900/20">

                    {session && (
                        <button
                            onClick={() => signOut()}
                            className="flex w-full items-center justify-center gap-2 rounded-xl p-2.5 text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                            <LogOut className="h-4 w-4" />
                            <span>Sign Out</span>
                        </button>
                    )}
                </div>
            </aside>
        </>
    );
}
