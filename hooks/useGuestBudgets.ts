"use client";

import { useState, useEffect } from "react";

interface Budget {
    id: string;
    category: string;
    limit: number;
    period: string;
}

const STORAGE_KEY = "cashops_guest_budgets";

export function useGuestBudgets() {
    const [budgets, setBudgets] = useState<Budget[]>([]);

    useEffect(() => {
        const loadBudgets = () => {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                try {
                    setBudgets(JSON.parse(stored));
                } catch (e) {
                    console.error("Failed to parse guest budgets", e);
                }
            }
        };

        loadBudgets();

        const handleStorageChange = () => loadBudgets();
        window.addEventListener("guest-budget-updated", handleStorageChange);
        window.addEventListener("storage", handleStorageChange);

        return () => {
            window.removeEventListener("guest-budget-updated", handleStorageChange);
            window.removeEventListener("storage", handleStorageChange);
        };
    }, []);

    const generateId = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    };

    const addBudget = (budget: Omit<Budget, "id">) => {
        // Check if category already exists
        const existing = budgets.find(b => b.category === budget.category);
        if (existing) {
            // Update instead of add
            return updateBudget(existing.id, budget);
        }

        const newBudget = { ...budget, id: generateId() };
        const updated = [...budgets, newBudget];
        setBudgets(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new Event("guest-budget-updated"));
        return newBudget;
    };

    const updateBudget = (id: string, updates: Partial<Omit<Budget, "id">>) => {
        const updated = budgets.map(b => b.id === id ? { ...b, ...updates } : b);
        setBudgets(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new Event("guest-budget-updated"));
        return updated.find(b => b.id === id);
    };

    const deleteBudget = (id: string) => {
        const updated = budgets.filter(b => b.id !== id);
        setBudgets(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new Event("guest-budget-updated"));
    };

    return { budgets, addBudget, updateBudget, deleteBudget };
}
