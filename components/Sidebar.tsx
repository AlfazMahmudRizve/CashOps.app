"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Receipt, Wallet, LogOut, LogIn, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession, signOut } from "next-auth/react";

const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/transactions", label: "Transactions", icon: Receipt },
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
                    "fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-sm transition-opacity sm:hidden",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed left-0 top-0 z-40 h-screen w-64 border-r bg-slate-900 text-white transition-transform duration-300 ease-in-out",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="flex h-full flex-col px-3 py-4">
                    <div className="mb-5 flex items-center justify-between pl-2.5">
                        <div className="flex items-center">
                            <div className="mr-3 p-1 bg-emerald-500 rounded-lg">
                                <Wallet className="h-6 w-6 text-white" />
                            </div>
                            <span className="self-center whitespace-nowrap text-xl font-semibold dark:text-white">
                                BudgetBuddy
                            </span>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 rounded-md hover:bg-slate-800 text-slate-400 sm:hidden"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <ul className="space-y-2 font-medium">
                        {links.map((link) => {
                            const Icon = link.icon;
                            const isActive = pathname === link.href;
                            return (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        onClick={() => window.innerWidth < 640 && onClose()}
                                        className={cn(
                                            "flex items-center rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-white group",
                                            isActive && "bg-slate-800 text-emerald-400"
                                        )}
                                    >
                                        <Icon className={cn("h-5 w-5 flex-shrink-0 transition duration-75 text-slate-400 group-hover:text-white", isActive && "text-emerald-400")} />
                                        <span className="ml-3">{link.label}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>

                    <div className="mt-auto border-t border-slate-800 pt-4">
                        {session ? (
                            <div className="space-y-4">
                                <div className="px-2 text-sm text-slate-400">
                                    Signed in as <br /> <span className="text-white font-medium">{session.user?.email}</span>
                                </div>
                                <button
                                    onClick={() => signOut()}
                                    className="flex w-full items-center rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-white group transition-colors"
                                >
                                    <LogOut className="h-5 w-5 flex-shrink-0 text-slate-400 group-hover:text-red-400 transition duration-75" />
                                    <span className="ml-3">Logout</span>
                                </button>
                            </div>
                        ) : (
                            <Link
                                href="/login"
                                className="flex items-center rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-white group transition-colors"
                            >
                                <LogIn className="h-5 w-5 flex-shrink-0 text-slate-400 group-hover:text-emerald-400 transition duration-75" />
                                <span className="ml-3">Login</span>
                            </Link>
                        )}
                    </div>
                </div>
            </aside>
        </>
    );
}
