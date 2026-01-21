"use client";

import { X } from "lucide-react";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-lg bg-white dark:bg-slate-900 shadow-xl border dark:border-slate-800">
                <div className="flex items-center justify-between border-b dark:border-slate-800 p-4">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
                    <button
                        onClick={onClose}
                        className="rounded-full p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        <X className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                    </button>
                </div>
                <div className="p-4">{children}</div>
            </div>
        </div>
    );
}
