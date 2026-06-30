import { useState, useEffect } from "react";

export interface Product {
    id: string;
    name: string;
    description?: string | null;
    category: string;
    sku?: string | null;
}

export interface Seller {
    id: string;
    name: string;
    contactInfo?: string | null;
}

export interface Purchase {
    id: string;
    productId: string;
    product?: Product;
    sellerId: string;
    seller?: Seller;
    quantity: number;
    unitPrice: number;
    totalCost: number;
    date: string;
    createdAt?: string;
}

export interface Sale {
    id: string;
    productId: string;
    product?: Product;
    sellerId?: string | null;
    seller?: Seller;
    quantity: number;
    unitPrice: number;
    totalRevenue: number;
    comment?: string | null;
    date: string;
    createdAt?: string;
}

export interface SellerProduct {
    id: string;
    productId: string;
    product?: Product;
    sellerId: string;
    seller?: Seller;
    costPrice: number;
    createdAt?: string;
}

const PRODUCTS_KEY = "cashops_guest_products";
const SELLERS_KEY = "cashops_guest_sellers";
const PURCHASES_KEY = "cashops_guest_purchases";
const SALES_KEY = "cashops_guest_sales";
const SELLER_PRODUCTS_KEY = "cashops_guest_seller_products";

const INITIAL_SELLER_PRODUCTS = [
    { id: "sp1", productId: "p1", sellerId: "s1", costPrice: 11.50 },
    { id: "sp2", productId: "p2", sellerId: "s1", costPrice: 4.75 },
    { id: "sp3", productId: "p3", sellerId: "s1", costPrice: 6.00 },
    { id: "sp4", productId: "p5", sellerId: "s1", costPrice: 7.50 },
    { id: "sp5", productId: "p7", sellerId: "s2", costPrice: 40.00 },
];

const INITIAL_PRODUCTS: Product[] = [
    { id: "p1", name: "Kattle", category: "Electronics" },
    { id: "p2", name: "Anjo", category: "Other" },
    { id: "p3", name: "En-lotion (500)", category: "Health" },
    { id: "p4", name: "M. Hot pillow", category: "Other" },
    { id: "p5", name: "Gone D/N", category: "Other" },
    { id: "p6", name: "Fresh care", category: "Health" },
    { id: "p7", name: "Coffee", category: "Food" },
];

const INITIAL_SELLERS: Seller[] = [
    { id: "s1", name: "Asad", contactInfo: "Contact for Asad" },
    { id: "s2", name: "Sakib", contactInfo: "Contact for Sakib" },
    { id: "s3", name: "Misbah", contactInfo: "Contact for Misbah" },
    { id: "s4", name: "Bacchu", contactInfo: "Contact for Bacchu" },
    { id: "s5", name: "Atiq", contactInfo: "Contact for Atiq" },
];

const INITIAL_PURCHASES = (products: Product[], sellers: Seller[]): Purchase[] => [
    { id: "pur1", productId: "p1", sellerId: "s1", quantity: 55, unitPrice: 11.50, totalCost: 632.50, date: "2026-06-27T12:00:00Z" },
    { id: "pur2", productId: "p2", sellerId: "s1", quantity: 50, unitPrice: 4.50, totalCost: 225.00, date: "2026-06-27T12:00:00Z" },
    { id: "pur3", productId: "p3", sellerId: "s1", quantity: 45, unitPrice: 6.00, totalCost: 270.00, date: "2026-06-27T12:00:00Z" },
    { id: "pur4", productId: "p5", sellerId: "s1", quantity: 11, unitPrice: 7.50, totalCost: 82.50, date: "2026-06-27T12:00:00Z" },
    { id: "pur5", productId: "p7", sellerId: "s2", quantity: 1, unitPrice: 40.00, totalCost: 40.00, date: "2026-06-27T12:00:00Z" },
];

const INITIAL_SALES = (products: Product[]): Sale[] => [
    { id: "sal1", productId: "p1", quantity: 12, unitPrice: 25.00, totalRevenue: 300.00, comment: "Regular store sale", date: "2026-06-28T14:00:00Z" },
    { id: "sal2", productId: "p2", quantity: 25, unitPrice: 10.00, totalRevenue: 250.00, comment: "Regular store sale", date: "2026-06-28T14:00:00Z" },
    { id: "sal3", productId: "p3", quantity: 15, unitPrice: 12.00, totalRevenue: 180.00, comment: "Regular store sale", date: "2026-06-28T14:00:00Z" },
    { id: "sal4", productId: "p5", quantity: 15, unitPrice: 15.00, totalRevenue: 225.00, comment: "Sold more than in stock - customer request", date: "2026-06-28T14:00:00Z" },
];

export function useGuestSourcing() {
    const [products, setProducts] = useState<Product[]>([]);
    const [sellers, setSellers] = useState<Seller[]>([]);
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    const [sellerProducts, setSellerProducts] = useState<SellerProduct[]>([]);

    useEffect(() => {
        const loadAll = () => {
            // Load or seed products
            let currentProducts = INITIAL_PRODUCTS;
            const storedProducts = localStorage.getItem(PRODUCTS_KEY);
            if (storedProducts) {
                try {
                    currentProducts = JSON.parse(storedProducts);
                } catch (e) {
                    console.error("Failed to parse products", e);
                }
            } else {
                localStorage.setItem(PRODUCTS_KEY, JSON.stringify(INITIAL_PRODUCTS));
            }
            setProducts(currentProducts);

            // Load or seed sellers
            let currentSellers = INITIAL_SELLERS;
            const storedSellers = localStorage.getItem(SELLERS_KEY);
            if (storedSellers) {
                try {
                    currentSellers = JSON.parse(storedSellers);
                } catch (e) {
                    console.error("Failed to parse sellers", e);
                }
            } else {
                localStorage.setItem(SELLERS_KEY, JSON.stringify(INITIAL_SELLERS));
            }
            setSellers(currentSellers);

            // Load or seed purchases
            let currentPurchases = INITIAL_PURCHASES(currentProducts, currentSellers);
            const storedPurchases = localStorage.getItem(PURCHASES_KEY);
            if (storedPurchases) {
                try {
                    currentPurchases = JSON.parse(storedPurchases);
                } catch (e) {
                    console.error("Failed to parse purchases", e);
                }
            } else {
                localStorage.setItem(PURCHASES_KEY, JSON.stringify(currentPurchases));
            }
            setPurchases(currentPurchases);

            // Load or seed sales
            let currentSales = INITIAL_SALES(currentProducts);
            const storedSales = localStorage.getItem(SALES_KEY);
            if (storedSales) {
                try {
                    currentSales = JSON.parse(storedSales);
                } catch (e) {
                    console.error("Failed to parse sales", e);
                }
            } else {
                localStorage.setItem(SALES_KEY, JSON.stringify(currentSales));
            }
            setSales(currentSales);

            // Load or seed seller products
            let currentSellerProducts = INITIAL_SELLER_PRODUCTS;
            const storedSellerProducts = localStorage.getItem(SELLER_PRODUCTS_KEY);
            if (storedSellerProducts) {
                try {
                    currentSellerProducts = JSON.parse(storedSellerProducts);
                } catch (e) {
                    console.error("Failed to parse seller products", e);
                }
            } else {
                localStorage.setItem(SELLER_PRODUCTS_KEY, JSON.stringify(INITIAL_SELLER_PRODUCTS));
            }
            setSellerProducts(currentSellerProducts);
        };

        loadAll();

        const handleStorageChange = () => loadAll();
        window.addEventListener("guest-sourcing-updated", handleStorageChange);
        window.addEventListener("storage", handleStorageChange);

        return () => {
            window.removeEventListener("guest-sourcing-updated", handleStorageChange);
            window.removeEventListener("storage", handleStorageChange);
        };
    }, []);

    const generateId = () => {
        if (typeof crypto !== "undefined" && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return Math.random().toString(36).substring(2, 15);
    };

    const notifyUpdate = () => {
        window.dispatchEvent(new Event("guest-sourcing-updated"));
    };

    const addProduct = (name: string, category: string, description?: string, sku?: string) => {
        const newProduct: Product = {
            id: "p_" + generateId(),
            name,
            category,
            description,
            sku
        };
        const updated = [...products, newProduct];
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(updated));
        setProducts(updated);
        notifyUpdate();
        return newProduct;
    };

    const addSeller = (name: string, contactInfo?: string) => {
        const newSeller: Seller = {
            id: "s_" + generateId(),
            name,
            contactInfo
        };
        const updated = [...sellers, newSeller];
        localStorage.setItem(SELLERS_KEY, JSON.stringify(updated));
        setSellers(updated);
        notifyUpdate();
        return newSeller;
    };

    const addPurchase = (purchase: Omit<Purchase, "id" | "totalCost" | "createdAt">) => {
        const newPurchase: Purchase = {
            ...purchase,
            id: "pur_" + generateId(),
            totalCost: purchase.quantity * purchase.unitPrice,
            createdAt: new Date().toISOString()
        };
        const updated = [newPurchase, ...purchases];
        localStorage.setItem(PURCHASES_KEY, JSON.stringify(updated));
        setPurchases(updated);
        notifyUpdate();
        return newPurchase;
    };

    const addSale = (sale: Omit<Sale, "id" | "totalRevenue" | "createdAt">) => {
        const newSale: Sale = {
            ...sale,
            id: "sal_" + generateId(),
            totalRevenue: sale.quantity * sale.unitPrice,
            createdAt: new Date().toISOString()
        };
        const updated = [newSale, ...sales];
        localStorage.setItem(SALES_KEY, JSON.stringify(updated));
        setSales(updated);
        notifyUpdate();
        return newSale;
    };

    const deleteProduct = (id: string) => {
        const updated = products.filter(p => p.id !== id);
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(updated));
        setProducts(updated);
        
        const updatedPurchases = purchases.filter(p => p.productId !== id);
        localStorage.setItem(PURCHASES_KEY, JSON.stringify(updatedPurchases));
        setPurchases(updatedPurchases);
        
        const updatedSales = sales.filter(s => s.productId !== id);
        localStorage.setItem(SALES_KEY, JSON.stringify(updatedSales));
        setSales(updatedSales);

        const updatedSellerProducts = sellerProducts.filter(sp => sp.productId !== id);
        localStorage.setItem(SELLER_PRODUCTS_KEY, JSON.stringify(updatedSellerProducts));
        setSellerProducts(updatedSellerProducts);
        
        notifyUpdate();
    };

    const deleteSeller = (id: string) => {
        const updated = sellers.filter(s => s.id !== id);
        localStorage.setItem(SELLERS_KEY, JSON.stringify(updated));
        setSellers(updated);
        
        const updatedPurchases = purchases.filter(p => p.sellerId !== id);
        localStorage.setItem(PURCHASES_KEY, JSON.stringify(updatedPurchases));
        setPurchases(updatedPurchases);

        const updatedSellerProducts = sellerProducts.filter(sp => sp.sellerId !== id);
        localStorage.setItem(SELLER_PRODUCTS_KEY, JSON.stringify(updatedSellerProducts));
        setSellerProducts(updatedSellerProducts);
        
        notifyUpdate();
    };

    const addSellerProduct = (productId: string, sellerId: string, costPrice: number) => {
        const existingIdx = sellerProducts.findIndex(sp => sp.productId === productId && sp.sellerId === sellerId);
        let updated: SellerProduct[] = [];
        
        if (existingIdx > -1) {
            updated = [...sellerProducts];
            updated[existingIdx] = {
                ...updated[existingIdx],
                costPrice
            };
        } else {
            const newSP: SellerProduct = {
                id: "sp_" + generateId(),
                productId,
                sellerId,
                costPrice,
                createdAt: new Date().toISOString()
            };
            updated = [...sellerProducts, newSP];
        }

        localStorage.setItem(SELLER_PRODUCTS_KEY, JSON.stringify(updated));
        setSellerProducts(updated);
        notifyUpdate();
    };

    const deleteSellerProduct = (id: string) => {
        const updated = sellerProducts.filter(sp => sp.id !== id);
        localStorage.setItem(SELLER_PRODUCTS_KEY, JSON.stringify(updated));
        setSellerProducts(updated);
        notifyUpdate();
    };

    return {
        products,
        sellers,
        purchases,
        sales,
        sellerProducts,
        addProduct,
        addSeller,
        addPurchase,
        addSale,
        deleteProduct,
        deleteSeller,
        addSellerProduct,
        deleteSellerProduct
    };
}
