"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useGuestSourcing, Product, Seller } from "@/hooks/useGuestSourcing";
import { 
    Plus, Trash2, Tag, Truck, List, HelpCircle, 
    CheckCircle, AlertCircle, Info, Edit3, DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Modal } from "./Modal";

interface InventoryManagerProps {
    initialProducts?: Product[];
    initialSellers?: Seller[];
    initialSellerProducts?: any[];
}

export function InventoryManager({ 
    initialProducts = [], 
    initialSellers = [],
    initialSellerProducts = []
}: InventoryManagerProps) {
    const { data: session, status } = useSession();
    const isAuth = status === "authenticated";
    const guestSourcing = useGuestSourcing();

    // Local states
    const [activeTab, setActiveTab] = useState<"products" | "sellers" | "prices">("products");
    const [products, setProducts] = useState<Product[]>(isAuth ? initialProducts : []);
    const [sellers, setSellers] = useState<Seller[]>(isAuth ? initialSellers : []);
    const [sellerProducts, setSellerProducts] = useState<any[]>(isAuth ? initialSellerProducts : []);
    
    // Modals
    const [productModalOpen, setProductModalOpen] = useState(false);
    const [sellerModalOpen, setSellerModalOpen] = useState(false);
    const [priceModalOpen, setPriceModalOpen] = useState(false);

    // Form inputs
    const [productForm, setProductForm] = useState({ name: "", category: "Other", description: "", sku: "", sellerId: "", costPrice: "" });
    const [sellerForm, setSellerForm] = useState({ name: "", contactInfo: "" });
    const [priceForm, setPriceForm] = useState({ productId: "", sellerId: "", costPrice: "" });

    // Custom category states
    const [isCustomCategory, setIsCustomCategory] = useState(false);
    const [customCategory, setCustomCategory] = useState("");

    // Calculate unique categories dynamically from products
    const defaultCategories = ["Electronics", "Health", "Food", "Other"];
    const categories = React.useMemo(() => {
        const unique = new Set(defaultCategories);
        products.forEach(p => {
            if (p.category) unique.add(p.category);
        });
        return Array.from(unique);
    }, [products]);

    // Status messages
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Sync state on load/auth change
    useEffect(() => {
        if (isAuth) {
            setProducts(initialProducts);
            setSellers(initialSellers);
            setSellerProducts(initialSellerProducts);
        } else {
            setProducts(guestSourcing.products);
            setSellers(guestSourcing.sellers);
            setSellerProducts(guestSourcing.sellerProducts);
        }
    }, [isAuth, initialProducts, initialSellers, initialSellerProducts, guestSourcing.products, guestSourcing.sellers, guestSourcing.sellerProducts]);

    // Handle adding Product
    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!productForm.name.trim()) return;

        setIsSubmitting(true);
        setErrorMessage("");
        setSuccessMessage("");

        const finalCategory = isCustomCategory ? (customCategory.trim() || "Other") : productForm.category;

        try {
            if (isAuth) {
                const response = await fetch("/api/products", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        ...productForm,
                        category: finalCategory,
                        sellerId: productForm.sellerId || undefined,
                        costPrice: productForm.costPrice ? Number(productForm.costPrice) : undefined
                    }),
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || "Failed to create product");
                
                setProducts([...products, data]);

                // Sync pricing relations if linked during creation
                if (productForm.sellerId && productForm.costPrice) {
                    const spRes = await fetch("/api/seller-products");
                    if (spRes.ok) {
                        const spData = await spRes.json();
                        setSellerProducts(spData);
                    }
                }
            } else {
                const newProduct = guestSourcing.addProduct(
                    productForm.name,
                    finalCategory,
                    productForm.description || undefined,
                    productForm.sku || undefined
                );
                if (productForm.sellerId && productForm.costPrice) {
                    guestSourcing.addSellerProduct(newProduct.id, productForm.sellerId, Number(productForm.costPrice));
                }
            }

            setSuccessMessage(`Product "${productForm.name}" created successfully!`);
            setProductForm({ name: "", category: "Other", description: "", sku: "", sellerId: "", costPrice: "" });
            setIsCustomCategory(false);
            setCustomCategory("");
            setProductModalOpen(false);
        } catch (err: any) {
            setErrorMessage(err.message || "An error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle adding Seller
    const handleAddSeller = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sellerForm.name.trim()) return;

        setIsSubmitting(true);
        setErrorMessage("");
        setSuccessMessage("");

        try {
            if (isAuth) {
                const response = await fetch("/api/sellers", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(sellerForm),
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || "Failed to create seller");

                setSellers([...sellers, data]);
            } else {
                const newSeller = guestSourcing.addSeller(
                    sellerForm.name,
                    sellerForm.contactInfo || undefined
                );
                // Hook updates the local state automatically via useEffect
            }

            setSuccessMessage(`Seller "${sellerForm.name}" created successfully!`);
            setSellerForm({ name: "", contactInfo: "" });
            setSellerModalOpen(false);
        } catch (err: any) {
            setErrorMessage(err.message || "An error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle deleting Product
    const handleDeleteProduct = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete product "${name}"?\nThis will also cascade delete all associated purchase and sales records.`)) return;

        setErrorMessage("");
        setSuccessMessage("");

        try {
            if (isAuth) {
                const response = await fetch(`/api/products?id=${id}`, {
                    method: "DELETE",
                });
                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || "Failed to delete product");
                }
                setProducts(products.filter(p => p.id !== id));
            } else {
                guestSourcing.deleteProduct(id);
            }
            setSuccessMessage(`Product "${name}" deleted successfully.`);
        } catch (err: any) {
            setErrorMessage(err.message || "An error occurred");
        }
    };

    // Handle deleting Seller
    const handleDeleteSeller = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete seller "${name}"?\nThis will also delete associated purchase records for this seller.`)) return;

        setErrorMessage("");
        setSuccessMessage("");

        try {
            if (isAuth) {
                const response = await fetch(`/api/sellers?id=${id}`, {
                    method: "DELETE",
                });
                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || "Failed to delete seller");
                }
                setSellers(sellers.filter(s => s.id !== id));
            } else {
                guestSourcing.deleteSeller(id);
            }
            setSuccessMessage(`Seller "${name}" deleted successfully.`);
        } catch (err: any) {
            setErrorMessage(err.message || "An error occurred");
        }
    };

    // Handle adding SellerProduct Cost Price
    const handleAddPrice = async (e: React.FormEvent) => {
        e.preventDefault();
        const { productId, sellerId, costPrice } = priceForm;
        if (!productId || !sellerId || !costPrice) return;

        setIsSubmitting(true);
        setErrorMessage("");
        setSuccessMessage("");

        const priceNum = Number(costPrice);

        try {
            if (isAuth) {
                const response = await fetch("/api/seller-products", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ productId, sellerId, costPrice: priceNum }),
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || "Failed to link price");

                const existingIdx = sellerProducts.findIndex(sp => sp.productId === productId && sp.sellerId === sellerId);
                if (existingIdx > -1) {
                    const updated = [...sellerProducts];
                    updated[existingIdx] = data;
                    setSellerProducts(updated);
                } else {
                    setSellerProducts([...sellerProducts, data]);
                }
            } else {
                guestSourcing.addSellerProduct(productId, sellerId, priceNum);
            }

            const pName = products.find(p => p.id === productId)?.name || "Product";
            const sName = sellers.find(s => s.id === sellerId)?.name || "Seller";
            setSuccessMessage(`Cost price for "${pName}" by "${sName}" set to $${priceNum.toFixed(2)} successfully!`);
            setPriceForm({ productId: "", sellerId: "", costPrice: "" });
            setPriceModalOpen(false);
        } catch (err: any) {
            setErrorMessage(err.message || "An error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle deleting SellerProduct Cost Price
    const handleDeletePrice = async (id: string, productName: string, sellerName: string) => {
        if (!confirm(`Are you sure you want to remove the sourcing price for "${productName}" from "${sellerName}"?`)) return;

        setErrorMessage("");
        setSuccessMessage("");

        try {
            if (isAuth) {
                const response = await fetch(`/api/seller-products?id=${id}`, {
                    method: "DELETE",
                });
                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || "Failed to remove cost price");
                }
                setSellerProducts(sellerProducts.filter(sp => sp.id !== id));
            } else {
                guestSourcing.deleteSellerProduct(id);
            }
            setSuccessMessage(`Sourcing cost relation deleted successfully.`);
        } catch (err: any) {
            setErrorMessage(err.message || "An error occurred");
        }
    };

    return (
        <>
            <div className="space-y-8 animate-fade-in-up pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-700 pb-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-50 flex items-center gap-2">
                        <List className="h-5 w-5 text-amber-500" />
                        Inventory Catalog Management
                    </h2>
                    <p className="text-sm text-slate-400">
                        Manage products details, categories, SKUs, and sourcing vendors/sellers.
                    </p>
                </div>
                {!isAuth && (
                    <div className="mt-3 md:mt-0 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800 text-emerald-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                        <Info className="h-4 w-4" /> Guest Mode: Changes saved locally
                    </div>
                )}
            </div>

            {successMessage && (
                <div className="rounded-lg bg-emerald-950/30 border border-emerald-900/50 p-4 text-sm text-emerald-400 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 flex-shrink-0" />
                    <span>{successMessage}</span>
                </div>
            )}

            {errorMessage && (
                <div className="rounded-lg bg-red-950/30 border border-red-900/50 p-4 text-sm text-red-400 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <span>{errorMessage}</span>
                </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-slate-800 pb-2">
                <div className="flex bg-slate-900/50 border border-slate-800 p-1 rounded-lg w-fit">
                    <button
                        onClick={() => {
                            setActiveTab("products");
                            setSuccessMessage("");
                            setErrorMessage("");
                        }}
                        className={cn(
                            "px-4 py-2 text-sm font-bold rounded-md flex items-center gap-2 transition-all cursor-pointer",
                            activeTab === "products"
                                ? "bg-amber-500 text-slate-900 shadow-sm"
                                : "text-slate-400 hover:text-slate-200"
                        )}
                    >
                        <Tag className="h-4 w-4" />
                        Products ({products.length})
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab("sellers");
                            setSuccessMessage("");
                            setErrorMessage("");
                        }}
                        className={cn(
                            "px-4 py-2 text-sm font-bold rounded-md flex items-center gap-2 transition-all cursor-pointer",
                            activeTab === "sellers"
                                ? "bg-amber-500 text-slate-900 shadow-sm"
                                : "text-slate-400 hover:text-slate-200"
                        )}
                    >
                        <Truck className="h-4 w-4" />
                        Sellers ({sellers.length})
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab("prices");
                            setSuccessMessage("");
                            setErrorMessage("");
                        }}
                        className={cn(
                            "px-4 py-2 text-sm font-bold rounded-md flex items-center gap-2 transition-all cursor-pointer",
                            activeTab === "prices"
                                ? "bg-amber-500 text-slate-900 shadow-sm"
                                : "text-slate-400 hover:text-slate-200"
                        )}
                    >
                        <DollarSign className="h-4 w-4" />
                        Sourcing Prices ({sellerProducts.length})
                    </button>
                </div>

                <button
                    onClick={() => {
                        if (activeTab === "products") {
                            setProductModalOpen(true);
                        } else if (activeTab === "sellers") {
                            setSellerModalOpen(true);
                        } else {
                            setPriceModalOpen(true);
                        }
                    }}
                    className="inline-flex items-center gap-2 bg-[#8B5CF6] hover:bg-[#7c3aed] text-white text-sm font-bold px-4 py-2 rounded-lg cursor-pointer shadow shadow-violet-950/40 hover:shadow-lg transition-all"
                >
                    <Plus className="h-4 w-4" />
                    {activeTab === "products" ? "Create Product" : activeTab === "sellers" ? "Create Seller" : "Link Sourcing Price"}
                </button>
            </div>

            {/* List Table */}
            <div className="rounded-xl border border-slate-800 bg-[#0B1120] overflow-hidden">
                {activeTab === "products" && (
                    products.length === 0 ? (
                        <div className="py-12 text-center text-slate-400">
                            <Tag className="h-12 w-12 mx-auto text-slate-700 mb-3" />
                            <p className="font-medium text-slate-300">No products found</p>
                            <p className="text-xs text-slate-500 mt-1">Create your first product by clicking the button above.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left text-sm text-slate-300">
                                <thead className="bg-slate-900/50 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                                    <tr>
                                        <th className="px-6 py-3.5">Name</th>
                                        <th className="px-6 py-3.5">Category</th>
                                        <th className="px-6 py-3.5">Description</th>
                                        <th className="px-6 py-3.5 font-mono">SKU</th>
                                        <th className="px-6 py-3.5 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800 bg-slate-900/10">
                                    {products.map((p) => (
                                        <tr key={p.id} className="hover:bg-slate-800/20 transition-colors">
                                            <td className="px-6 py-4 font-bold text-slate-100">{p.name}</td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex rounded-full bg-slate-800 border border-slate-700 px-2.5 py-0.5 text-xs text-slate-300 font-medium">
                                                    {p.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-400 max-w-xs truncate" title={p.description || ""}>
                                                {p.description || <span className="text-slate-600 italic">None</span>}
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs text-slate-500">
                                                {p.sku || <span className="text-slate-600 italic">None</span>}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => handleDeleteProduct(p.id, p.name)}
                                                    className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-950/20 transition-colors cursor-pointer"
                                                    title="Delete Product"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                )}

                {activeTab === "sellers" && (
                    sellers.length === 0 ? (
                        <div className="py-12 text-center text-slate-400">
                            <Truck className="h-12 w-12 mx-auto text-slate-700 mb-3" />
                            <p className="font-medium text-slate-300">No sellers found</p>
                            <p className="text-xs text-slate-500 mt-1">Create your first seller by clicking the button above.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left text-sm text-slate-300">
                                <thead className="bg-slate-900/50 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                                    <tr>
                                        <th className="px-6 py-3.5">Name</th>
                                        <th className="px-6 py-3.5">Contact Details / Notes</th>
                                        <th className="px-6 py-3.5 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800 bg-slate-900/10">
                                    {sellers.map((s) => (
                                        <tr key={s.id} className="hover:bg-slate-800/20 transition-colors">
                                            <td className="px-6 py-4 font-bold text-slate-100">{s.name}</td>
                                            <td className="px-6 py-4 text-slate-400">
                                                {s.contactInfo || <span className="text-slate-600 italic">None</span>}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => handleDeleteSeller(s.id, s.name)}
                                                    className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-950/20 transition-colors cursor-pointer"
                                                    title="Delete Seller"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                )}

                {activeTab === "prices" && (
                    sellerProducts.length === 0 ? (
                        <div className="py-12 text-center text-slate-400">
                            <DollarSign className="h-12 w-12 mx-auto text-slate-700 mb-3" />
                            <p className="font-medium text-slate-300">No vendor sourcing prices defined</p>
                            <p className="text-xs text-slate-500 mt-1">Link a product to a seller and define its cost price by clicking the button above.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left text-sm text-slate-300">
                                <thead className="bg-slate-900/50 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                                    <tr>
                                        <th className="px-6 py-3.5">Product Name</th>
                                        <th className="px-6 py-3.5">Category</th>
                                        <th className="px-6 py-3.5">Vendor / Seller</th>
                                        <th className="px-6 py-3.5 text-right">Sourcing Cost Price</th>
                                        <th className="px-6 py-3.5 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800 bg-slate-900/10">
                                    {sellerProducts.map((sp) => {
                                        const product = products.find(p => p.id === sp.productId);
                                        const seller = sellers.find(s => s.id === sp.sellerId);
                                        const pName = product ? product.name : sp.product?.name || "Unknown Product";
                                        const pCat = product ? product.category : sp.product?.category || "Other";
                                        const sName = seller ? seller.name : sp.seller?.name || "Unknown Seller";

                                        return (
                                            <tr key={sp.id} className="hover:bg-slate-800/20 transition-colors">
                                                <td className="px-6 py-4 font-bold text-slate-100">{pName}</td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex rounded-full bg-slate-800 border border-slate-700 px-2.5 py-0.5 text-xs text-slate-300 font-medium">
                                                        {pCat}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-medium text-amber-500">{sName}</td>
                                                <td className="px-6 py-4 text-right font-bold font-mono text-slate-200">${sp.costPrice.toFixed(2)}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => handleDeletePrice(sp.id, pName, sName)}
                                                        className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-950/20 transition-colors cursor-pointer"
                                                        title="Remove Sourcing Price"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )
                )}
            </div>
        </div>

        {/* Create Product Modal */}
            <Modal isOpen={productModalOpen} onClose={() => setProductModalOpen(false)} title="Create New Product">
                <form onSubmit={handleAddProduct} className="space-y-4 p-2">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Product Name *</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Kattle"
                            value={productForm.name}
                            onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Category</label>
                        {!isCustomCategory ? (
                            <select
                                value={productForm.category}
                                onChange={(e) => {
                                    if (e.target.value === "custom") {
                                        setIsCustomCategory(true);
                                    } else {
                                        setProductForm({ ...productForm, category: e.target.value });
                                    }
                                }}
                                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            >
                                {categories.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                                <option value="custom" className="text-violet-400 font-bold">
                                    + Add New Category
                                </option>
                            </select>
                        ) : (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Toys"
                                    value={customCategory}
                                    onChange={(e) => setCustomCategory(e.target.value)}
                                    className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsCustomCategory(false);
                                        setCustomCategory("");
                                    }}
                                    className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all border border-slate-700 cursor-pointer"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Description</label>
                        <textarea
                            placeholder="Product details..."
                            value={productForm.description}
                            onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                            rows={3}
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">SKU (Stock Keeping Unit)</label>
                        <input
                            type="text"
                            placeholder="e.g. ELEC-KAT-01"
                            value={productForm.sku}
                            onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                        />
                    </div>
                    <div className="border-t border-slate-800 my-4 pt-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500 mb-3">Link Sourcing Price (Optional)</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Seller</label>
                                <select
                                    value={productForm.sellerId}
                                    onChange={(e) => setProductForm({ ...productForm, sellerId: e.target.value })}
                                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                >
                                    <option value="">-- None --</option>
                                    {sellers.map((s) => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Cost Price ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="e.g. 11.50"
                                    value={productForm.costPrice}
                                    onChange={(e) => setProductForm({ ...productForm, costPrice: e.target.value })}
                                    required={!!productForm.sellerId}
                                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                                />
                            </div>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 rounded-lg bg-[#8B5CF6] hover:bg-[#7c3aed] text-white font-bold transition-all disabled:opacity-50 shadow-md shadow-violet-950/40 cursor-pointer"
                    >
                        {isSubmitting ? "Creating..." : "Add Product"}
                    </button>
                </form>
            </Modal>

            {/* Create Seller Modal */}
            <Modal isOpen={sellerModalOpen} onClose={() => setSellerModalOpen(false)} title="Create New Sourcing Seller">
                <form onSubmit={handleAddSeller} className="space-y-4 p-2">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Seller / Sourcing Name *</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Asad"
                            value={sellerForm.name}
                            onChange={(e) => setSellerForm({ ...sellerForm, name: e.target.value })}
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Contact Details / Notes</label>
                        <textarea
                            placeholder="e.g. Email, phone number, terms..."
                            value={sellerForm.contactInfo}
                            onChange={(e) => setSellerForm({ ...sellerForm, contactInfo: e.target.value })}
                            rows={4}
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 rounded-lg bg-[#8B5CF6] hover:bg-[#7c3aed] text-white font-bold transition-all disabled:opacity-50 shadow-md shadow-violet-950/40 cursor-pointer"
                    >
                        {isSubmitting ? "Creating..." : "Add Seller"}
                    </button>
                </form>
            </Modal>
            {/* Create Price Modal */}
            <Modal isOpen={priceModalOpen} onClose={() => setPriceModalOpen(false)} title="Link Product Sourcing Cost Price">
                <form onSubmit={handleAddPrice} className="space-y-4 p-2">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Select Sourcing Seller *</label>
                        <select
                            value={priceForm.sellerId}
                            onChange={(e) => setPriceForm({ ...priceForm, sellerId: e.target.value })}
                            required
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                            <option value="">-- Choose Seller --</option>
                            {sellers.map((s) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Select Product *</label>
                        <select
                            value={priceForm.productId}
                            onChange={(e) => setPriceForm({ ...priceForm, productId: e.target.value })}
                            required
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                            <option value="">-- Choose Product --</option>
                            {products.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Sourcing Cost Price ($) *</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            placeholder="e.g. 11.50"
                            value={priceForm.costPrice}
                            onChange={(e) => setPriceForm({ ...priceForm, costPrice: e.target.value })}
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 rounded-lg bg-[#8B5CF6] hover:bg-[#7c3aed] text-white font-bold transition-all disabled:opacity-50 shadow-md shadow-violet-950/40 cursor-pointer"
                    >
                        {isSubmitting ? "Linking..." : "Save Cost Price"}
                    </button>
                </form>
            </Modal>
        </>
    );
}
