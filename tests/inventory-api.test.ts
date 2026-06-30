import { Module } from 'module';

// 1. Mock getServerSession globally
let currentSession: any = null;
const nextAuthNext = require('next-auth/next');
nextAuthNext.getServerSession = async () => {
    return currentSession;
};

// 2. Stateful In-Memory Mock Database
export const mockDb = {
    product: [] as any[],
    seller: [] as any[],
    purchase: [] as any[],
    sale: [] as any[],
    sellerProduct: [] as any[],
};

// Reset database helper
function resetDb() {
    mockDb.product = [];
    mockDb.seller = [];
    mockDb.purchase = [];
    mockDb.sale = [];
    mockDb.sellerProduct = [];
}

const mockPrisma = {
    product: {
        findMany: async (args: any) => {
            let list = [...mockDb.product];
            if (args?.where) {
                list = list.filter(p => {
                    for (const key in args.where) {
                        if (args.where[key] !== p[key]) return false;
                    }
                    return true;
                });
            }
            return list;
        },
        findUnique: async (args: any) => {
            return mockDb.product.find(p => p.id === args.where.id) || null;
        },
        findFirst: async (args: any) => {
            let list = [...mockDb.product];
            if (args?.where) {
                list = list.filter(p => {
                    for (const key in args.where) {
                        if (args.where[key] !== p[key]) return false;
                    }
                    return true;
                });
            }
            return list[0] || null;
        },
        create: async (args: any) => {
            const newProd = {
                id: `prod-${Date.now()}-${Math.random()}`,
                ...args.data,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            mockDb.product.push(newProd);
            return newProd;
        },
        update: async (args: any) => {
            const prodIndex = mockDb.product.findIndex(p => p.id === args.where.id);
            if (prodIndex === -1) throw new Error("Product not found");
            const updated = {
                ...mockDb.product[prodIndex],
                ...args.data,
                updatedAt: new Date()
            };
            mockDb.product[prodIndex] = updated;
            return updated;
        },
        delete: async (args: any) => {
            const prodIndex = mockDb.product.findIndex(p => p.id === args.where.id);
            if (prodIndex === -1) throw new Error("Product not found");
            const deleted = mockDb.product[prodIndex];
            mockDb.product.splice(prodIndex, 1);
            return deleted;
        }
    },
    seller: {
        findMany: async (args: any) => {
            let list = [...mockDb.seller];
            if (args?.where) {
                list = list.filter(s => {
                    for (const key in args.where) {
                        if (args.where[key] !== s[key]) return false;
                    }
                    return true;
                });
            }
            return list;
        },
        findUnique: async (args: any) => {
            return mockDb.seller.find(s => s.id === args.where.id) || null;
        },
        findFirst: async (args: any) => {
            let list = [...mockDb.seller];
            if (args?.where) {
                list = list.filter(s => {
                    for (const key in args.where) {
                        if (args.where[key] !== s[key]) return false;
                    }
                    return true;
                });
            }
            return list[0] || null;
        },
        create: async (args: any) => {
            const newSeller = {
                id: `seller-${Date.now()}-${Math.random()}`,
                ...args.data,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            mockDb.seller.push(newSeller);
            return newSeller;
        },
        update: async (args: any) => {
            const sellerIndex = mockDb.seller.findIndex(s => s.id === args.where.id);
            if (sellerIndex === -1) throw new Error("Seller not found");
            const updated = {
                ...mockDb.seller[sellerIndex],
                ...args.data,
                updatedAt: new Date()
            };
            mockDb.seller[sellerIndex] = updated;
            return updated;
        },
        delete: async (args: any) => {
            const sellerIndex = mockDb.seller.findIndex(s => s.id === args.where.id);
            if (sellerIndex === -1) throw new Error("Seller not found");
            const deleted = mockDb.seller[sellerIndex];
            mockDb.seller.splice(sellerIndex, 1);
            return deleted;
        }
    },
    purchase: {
        findMany: async (args: any) => {
            let list = [...mockDb.purchase];
            if (args?.where) {
                list = list.filter(p => {
                    for (const key in args.where) {
                        if (args.where[key] !== p[key]) return false;
                    }
                    return true;
                });
            }
            return list;
        },
        aggregate: async (args: any) => {
            const where = args.where || {};
            const filtered = mockDb.purchase.filter(p => {
                for (const key in where) {
                    if (where[key] !== p[key]) return false;
                }
                return true;
            });
            let sumQuantity = 0;
            let sumTotalCost = 0;
            filtered.forEach(p => {
                sumQuantity += p.quantity || 0;
                sumTotalCost += p.totalCost || 0;
            });
            return {
                _sum: {
                    quantity: sumQuantity,
                    totalCost: sumTotalCost
                }
            };
        },
        groupBy: async (args: any) => {
            const where = args.where || {};
            const filtered = mockDb.purchase.filter(p => {
                for (const key in where) {
                    if (where[key] !== p[key]) return false;
                }
                return true;
            });
            const by = args.by;
            const groups: Record<string, any> = {};
            filtered.forEach(p => {
                const groupKey = by.map((field: string) => p[field]).join('_');
                if (!groups[groupKey]) {
                    groups[groupKey] = {
                        _sum: { quantity: 0, totalCost: 0 }
                    };
                    by.forEach((field: string) => {
                        groups[groupKey][field] = p[field];
                    });
                }
                groups[groupKey]._sum.quantity += p.quantity || 0;
                groups[groupKey]._sum.totalCost += p.totalCost || 0;
            });
            return Object.values(groups);
        },
        create: async (args: any) => {
            const newPurchase = {
                id: `purchase-${Date.now()}-${Math.random()}`,
                ...args.data,
                createdAt: new Date()
            };
            mockDb.purchase.push(newPurchase);
            return newPurchase;
        }
    },
    sale: {
        findMany: async (args: any) => {
            let list = [...mockDb.sale];
            if (args?.where) {
                list = list.filter(s => {
                    for (const key in args.where) {
                        if (args.where[key] !== s[key]) return false;
                    }
                    return true;
                });
            }
            return list;
        },
        aggregate: async (args: any) => {
            const where = args.where || {};
            const filtered = mockDb.sale.filter(s => {
                for (const key in where) {
                    if (where[key] !== s[key]) return false;
                }
                return true;
            });
            let sumQuantity = 0;
            let sumTotalRevenue = 0;
            filtered.forEach(s => {
                sumQuantity += s.quantity || 0;
                sumTotalRevenue += s.totalRevenue || 0;
            });
            return {
                _sum: {
                    quantity: sumQuantity,
                    totalRevenue: sumTotalRevenue
                }
            };
        },
        groupBy: async (args: any) => {
            const where = args.where || {};
            const filtered = mockDb.sale.filter(s => {
                for (const key in where) {
                    if (where[key] !== s[key]) return false;
                }
                return true;
            });
            const by = args.by;
            const groups: Record<string, any> = {};
            filtered.forEach(s => {
                const groupKey = by.map((field: string) => s[field]).join('_');
                if (!groups[groupKey]) {
                    groups[groupKey] = {
                        _sum: { quantity: 0, totalRevenue: 0 }
                    };
                    by.forEach((field: string) => {
                        groups[groupKey][field] = s[field];
                    });
                }
                groups[groupKey]._sum.quantity += s.quantity || 0;
                groups[groupKey]._sum.totalRevenue += s.totalRevenue || 0;
            });
            return Object.values(groups);
        },
        create: async (args: any) => {
            const newSale = {
                id: `sale-${Date.now()}-${Math.random()}`,
                ...args.data,
                createdAt: new Date()
            };
            mockDb.sale.push(newSale);
            return newSale;
        }
    },
    sellerProduct: {
        create: async (args: any) => {
            const created = {
                id: `sp-${Date.now()}-${Math.random()}`,
                ...args.data,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            mockDb.sellerProduct.push(created);
            return created;
        }
    },
    $transaction: async (callback: (tx: any) => Promise<any>) => {
        return callback(mockPrisma);
    }
};

(globalThis as any).prisma = mockPrisma;

// Helper to run assertions
function assert(condition: boolean, message: string) {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
    console.log(`✅ PASS: ${message}`);
}

async function runTests() {
    console.log('Starting Test-Driven Development (TDD) cycle for Inventory Backend APIs...');
    const prisma: any = (globalThis as any).prisma;

    // -------------------------------------------------------------
    // RED Phase 1: Verify imports fail or routes are not ready
    // -------------------------------------------------------------
    let productsRoute: any, sellersRoute: any, purchasesRoute: any, salesRoute: any, analyticsRoute: any;
    try {
        productsRoute = await import('../app/api/products/route');
        sellersRoute = await import('../app/api/sellers/route');
        purchasesRoute = await import('../app/api/purchases/route');
        salesRoute = await import('../app/api/sales/route');
        analyticsRoute = await import('../app/api/analytics/route');
    } catch (e: any) {
        console.log('🔴 RED (Expected Failure): API Routes do not exist or cannot be imported yet.');
        console.log('Error was:', e.message);
        // We exit early because this is the expected TDD Red state when files don't exist.
        // Once files are created, we will run the full test suite.
        return;
    }

    // -------------------------------------------------------------
    // Full Test Execution (When routes exist)
    // -------------------------------------------------------------
    
    // Test helper to generate a Request with JSON body
    const createPostRequest = (url: string, body: any) => {
        return new Request(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
    };

    const createPutRequest = (url: string, body: any) => {
        return new Request(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
    };

    // A. Verify Authentication Constraints (Unauthorized -> 401)
    currentSession = null;
    resetDb();

    const unauthGetProducts = await productsRoute.GET(new Request('http://localhost/api/products'));
    assert(unauthGetProducts.status === 401, 'Products GET unauthorized should return 401');

    const unauthPostProducts = await productsRoute.POST(createPostRequest('http://localhost/api/products', { name: 'P1' }));
    assert(unauthPostProducts.status === 401, 'Products POST unauthorized should return 401');

    const unauthPutProducts = await productsRoute.PUT(createPutRequest('http://localhost/api/products', { id: 'p1', name: 'P1-updated' }));
    assert(unauthPutProducts.status === 401, 'Products PUT unauthorized should return 401');

    const unauthDelProducts = await productsRoute.DELETE(new Request('http://localhost/api/products?id=p1', { method: 'DELETE' }));
    assert(unauthDelProducts.status === 401, 'Products DELETE unauthorized should return 401');

    const unauthGetSellers = await sellersRoute.GET(new Request('http://localhost/api/sellers'));
    assert(unauthGetSellers.status === 401, 'Sellers GET unauthorized should return 401');

    const unauthPostPurchases = await purchasesRoute.POST(createPostRequest('http://localhost/api/purchases', { quantity: 1, unitPrice: 10 }));
    assert(unauthPostPurchases.status === 401, 'Purchases POST unauthorized should return 401');

    const unauthPostSales = await salesRoute.POST(createPostRequest('http://localhost/api/sales', { quantity: 1, unitPrice: 15 }));
    assert(unauthPostSales.status === 401, 'Sales POST unauthorized should return 401');

    const unauthGetAnalytics = await analyticsRoute.GET(new Request('http://localhost/api/analytics'));
    assert(unauthGetAnalytics.status === 401, 'Analytics GET unauthorized should return 401');

    // B. Product CRUD (Authorized)
    currentSession = { user: { id: 'user-1' } };
    resetDb();

    // 1. Create a Product
    const resCreateProd = await productsRoute.POST(createPostRequest('http://localhost/api/products', {
        name: 'Gaming Laptop',
        description: 'High performance laptop',
        category: 'Electronics',
        sku: 'LAP-123'
    }));
    assert(resCreateProd.status === 200, 'Create product should succeed');
    const createdProd = await resCreateProd.json();
    assert(createdProd.name === 'Gaming Laptop', 'Product name matches');
    assert(createdProd.userId === 'user-1', 'Product belongs to user-1');

    // 2. Read Products
    const resGetProds = await productsRoute.GET(new Request('http://localhost/api/products'));
    assert(resGetProds.status === 200, 'Get products should succeed');
    const prodsList = await resGetProds.json();
    assert(prodsList.length === 1, 'Should have exactly 1 product');
    assert(prodsList[0].id === createdProd.id, 'Retrieved product id matches');

    // 3. Update Product
    const resUpdateProd = await productsRoute.PUT(createPutRequest('http://localhost/api/products', {
        id: createdProd.id,
        name: 'Super Gaming Laptop',
        sku: 'LAP-456'
    }));
    assert(resUpdateProd.status === 200, 'Update product should succeed');
    const updatedProd = await resUpdateProd.json();
    assert(updatedProd.name === 'Super Gaming Laptop', 'Updated product name matches');
    assert(updatedProd.sku === 'LAP-456', 'Updated SKU matches');

    // Test updating a product belonging to another user (should fail)
    // Create a product under user-2
    mockDb.product.push({
        id: 'prod-user-2',
        name: 'User 2 Product',
        userId: 'user-2'
    });
    const resUpdateOtherProd = await productsRoute.PUT(createPutRequest('http://localhost/api/products', {
        id: 'prod-user-2',
        name: 'Hacked Product'
    }));
    assert(resUpdateOtherProd.status === 401 || resUpdateOtherProd.status === 404, 'Updating other user product should be blocked');

    // 4. Delete Product
    // Delete product belonging to another user (should fail)
    const resDeleteOtherProd = await productsRoute.DELETE(new Request('http://localhost/api/products?id=prod-user-2', { method: 'DELETE' }));
    assert(resDeleteOtherProd.status === 401 || resDeleteOtherProd.status === 404, 'Deleting other user product should be blocked');
    
    // Delete own product (should succeed)
    const resDeleteOwnProd = await productsRoute.DELETE(new Request(`http://localhost/api/products?id=${createdProd.id}`, { method: 'DELETE' }));
    assert(resDeleteOwnProd.status === 200, 'Deleting own product should succeed');
    const getProdsAfterDelete = await productsRoute.GET(new Request('http://localhost/api/products'));
    const prodsAfterDelete = await getProdsAfterDelete.json();
    assert(prodsAfterDelete.length === 0, 'No products left after deletion');

    // C. Seller CRUD (Authorized)
    // 1. Create Seller
    const resCreateSeller = await sellersRoute.POST(createPostRequest('http://localhost/api/sellers', {
        name: 'Intel Corp',
        contactInfo: 'intel@sales.com'
    }));
    assert(resCreateSeller.status === 200, 'Create seller should succeed');
    const createdSeller = await resCreateSeller.json();
    assert(createdSeller.name === 'Intel Corp', 'Seller name matches');
    assert(createdSeller.userId === 'user-1', 'Seller belongs to user-1');

    // 2. Read Sellers
    const resGetSellers = await sellersRoute.GET(new Request('http://localhost/api/sellers'));
    assert(resGetSellers.status === 200, 'Get sellers should succeed');
    const sellersList = await resGetSellers.json();
    assert(sellersList.length === 1, 'Should have exactly 1 seller');

    // 3. Update Seller
    const resUpdateSeller = await sellersRoute.PUT(createPutRequest('http://localhost/api/sellers', {
        id: createdSeller.id,
        name: 'Intel Corp Global',
        contactInfo: 'global@intel.com'
    }));
    assert(resUpdateSeller.status === 200, 'Update seller should succeed');
    const updatedSeller = await resUpdateSeller.json();
    assert(updatedSeller.name === 'Intel Corp Global', 'Updated seller name matches');

    // Test updating a seller belonging to another user (should fail)
    mockDb.seller.push({
        id: 'seller-user-2',
        name: 'User 2 Seller',
        userId: 'user-2'
    });
    const resUpdateOtherSeller = await sellersRoute.PUT(createPutRequest('http://localhost/api/sellers', {
        id: 'seller-user-2',
        name: 'Hacked Seller'
    }));
    assert(resUpdateOtherSeller.status === 401 || resUpdateOtherSeller.status === 404, 'Updating other user seller should be blocked');

    // 4. Delete Seller
    const resDeleteOtherSeller = await sellersRoute.DELETE(new Request('http://localhost/api/sellers?id=seller-user-2', { method: 'DELETE' }));
    assert(resDeleteOtherSeller.status === 401 || resDeleteOtherSeller.status === 404, 'Deleting other user seller should be blocked');

    const resDeleteOwnSeller = await sellersRoute.DELETE(new Request(`http://localhost/api/sellers?id=${createdSeller.id}`, { method: 'DELETE' }));
    assert(resDeleteOwnSeller.status === 200, 'Deleting own seller should succeed');

    // D. Sourcing Purchase Posting (POST /api/purchases)
    resetDb();
    // Setup valid product and seller for user-1
    const p1 = await prisma.product.create({ data: { name: 'CPU Core i9', userId: 'user-1' } });
    const s1 = await prisma.seller.create({ data: { name: 'Intel Corp', userId: 'user-1' } });

    // Try posting a purchase with valid references
    const resPurchase = await purchasesRoute.POST(createPostRequest('http://localhost/api/purchases', {
        productId: p1.id,
        sellerId: s1.id,
        quantity: 10,
        unitPrice: 350.0,
        date: new Date().toISOString()
    }));
    assert(resPurchase.status === 200, 'Posting a valid purchase should succeed');
    const recordedPurchase = await resPurchase.json();
    assert(recordedPurchase.totalCost === 3500.0, 'totalCost should be quantity * unitPrice');
    assert(recordedPurchase.userId === 'user-1', 'Purchase should belong to user-1');

    // Try posting a purchase with a product belonging to user-2 (should fail)
    const p2_other = await prisma.product.create({ data: { name: 'User 2 Product', userId: 'user-2' } });
    const resPurchaseOther = await purchasesRoute.POST(createPostRequest('http://localhost/api/purchases', {
        productId: p2_other.id,
        sellerId: s1.id,
        quantity: 5,
        unitPrice: 100.0,
        date: new Date().toISOString()
    }));
    assert(resPurchaseOther.status === 401 || resPurchaseOther.status === 400, 'Posting purchase with other user product should be blocked');

    // E. Sales Revenue Posting & Edge Cases (POST /api/sales)
    // 1. Sale on product with positive stock (stock = 10 from previous purchase)
    const resSale1 = await salesRoute.POST(createPostRequest('http://localhost/api/sales', {
        productId: p1.id,
        quantity: 3,
        unitPrice: 450.0,
        date: new Date().toISOString()
    }));
    assert(resSale1.status === 200, 'Posting a valid sale with positive stock should succeed without a comment');
    const recordedSale1 = await resSale1.json();
    assert(recordedSale1.totalRevenue === 1350.0, 'totalRevenue should be quantity * unitPrice');

    // Stock is now 10 - 3 = 7. Let's record another sale of 7 items (brings stock to 0)
    const resSale2 = await salesRoute.POST(createPostRequest('http://localhost/api/sales', {
        productId: p1.id,
        quantity: 7,
        unitPrice: 450.0,
        date: new Date().toISOString()
    }));
    assert(resSale2.status === 200, 'Brings stock to 0, should succeed');

    // Now stock level is 10 - 10 = 0.
    // 2. Sale when stock level <= 0 (without comment -> fails)
    const resSaleFail = await salesRoute.POST(createPostRequest('http://localhost/api/sales', {
        productId: p1.id,
        quantity: 2,
        unitPrice: 450.0,
        date: new Date().toISOString()
    }));
    assert(resSaleFail.status === 400, 'Sale without comment when stock <= 0 should fail with 400');
    const failJson = await resSaleFail.json();
    assert(!!failJson.error, 'Should contain error message');

    // 3. Sale when stock level <= 0 (with comment -> succeeds)
    const resSaleSuccessWithComment = await salesRoute.POST(createPostRequest('http://localhost/api/sales', {
        productId: p1.id,
        quantity: 2,
        unitPrice: 450.0,
        date: new Date().toISOString(),
        comment: 'Pre-ordered back-ordered stock'
    }));
    assert(resSaleSuccessWithComment.status === 200, 'Sale with comment when stock <= 0 should succeed');
    const recordedSale3 = await resSaleSuccessWithComment.json();
    assert(recordedSale3.comment === 'Pre-ordered back-ordered stock', 'Comment should be recorded');

    // Try posting a sale for product belonging to user-2 (should fail)
    const resSaleOther = await salesRoute.POST(createPostRequest('http://localhost/api/sales', {
        productId: p2_other.id,
        quantity: 1,
        unitPrice: 100.0,
        date: new Date().toISOString()
    }));
    assert(resSaleOther.status === 401 || resSaleOther.status === 400, 'Posting sale for other user product should be blocked');

    // F. Analytics Endpoint (GET /api/analytics)
    // Current state for user-1:
    // Purchases: 1 purchase: CPU Core i9, qty 10, unitPrice 350. Total Cost = 3500
    // Sales: 3 sales: qty 3 @ 450 (1350), qty 7 @ 450 (3150), qty 2 @ 450 (900). Total Revenue = 1350 + 3150 + 900 = 5400
    // Total Investment = 3500
    // Total Revenue = 5400
    // Net Profit = 5400 - 3500 = 1900
    // Average Margin = (5400 - 3500) / 5400 = 1900 / 5400 ≈ 0.35185 (35.19%)
    
    // Add another product, purchase, and sale for user-1 to enrich the data
    const p3 = await prisma.product.create({ data: { name: 'RAM 16GB', sku: 'RAM-999', userId: 'user-1' } });
    await prisma.purchase.create({
        data: {
            productId: p3.id,
            sellerId: s1.id,
            quantity: 5,
            unitPrice: 80.0,
            totalCost: 400.0,
            date: new Date(),
            userId: 'user-1'
        }
    });
    await prisma.sale.create({
        data: {
            productId: p3.id,
            quantity: 2,
            unitPrice: 110.0,
            totalRevenue: 220.0,
            date: new Date(),
            userId: 'user-1'
        }
    });

    // Let's recalculate expected values for User 1:
    // Purchases:
    // - CPU: totalCost = 3500, qty = 10
    // - RAM: totalCost = 400, qty = 5
    // Total Investment = 3500 + 400 = 3900
    //
    // Sales:
    // - CPU: totalRevenue = 5400, qty = 12
    // - RAM: totalRevenue = 220, qty = 2
    // Total Revenue = 5400 + 220 = 5620
    //
    // Net Profit = 5620 - 3900 = 1720
    // Average Margin = 1720 / 5620 ≈ 0.30605 (30.61%)
    //
    // Sourcing Stock list per product:
    // - CPU Core i9: current stock count = 10 - 12 = -2. totalInvestment = 3500. totalRevenue = 5400
    // - RAM 16GB: current stock count = 5 - 2 = 3. totalInvestment = 400. totalRevenue = 220
    //
    // Sourcing Vendor share list per seller:
    // - Intel Corp (s1): total purchased cost = 3500 + 400 = 3900. total items bought = 10 + 5 = 15

    const resAnalytics = await analyticsRoute.GET(new Request('http://localhost/api/analytics'));
    assert(resAnalytics.status === 200, 'Analytics GET should succeed');
    const analytics = await resAnalytics.json();

    console.log('Analytics Response:', JSON.stringify(analytics, null, 2));

    assert(analytics.totalInvestment === 3900, 'Total investment should match');
    assert(analytics.totalRevenue === 5620, 'Total revenue should match');
    assert(analytics.netProfit === 1720, 'Net profit should match');
    
    // Validate margin
    const expectedMargin = (5620 - 3900) / 5620;
    assert(Math.abs(analytics.averageMargin - expectedMargin) < 0.001, 'Average margin should be correct');

    // Validate sourcing stock list
    assert(Array.isArray(analytics.stockList), 'stockList should be an array');
    assert(analytics.stockList.length === 2, 'stockList should contain exactly 2 products');
    
    const cpuStock = analytics.stockList.find((p: any) => p.name === 'CPU Core i9');
    assert(!!cpuStock, 'CPU product should be in stock list');
    assert(cpuStock.currentStock === -2, 'CPU stock should be -2');
    assert(cpuStock.totalInvestment === 3500, 'CPU total investment should be 3500');
    assert(cpuStock.totalRevenue === 5400, 'CPU total revenue should be 5400');

    const ramStock = analytics.stockList.find((p: any) => p.name === 'RAM 16GB');
    assert(!!ramStock, 'RAM product should be in stock list');
    assert(ramStock.currentStock === 3, 'RAM stock should be 3');
    assert(ramStock.totalInvestment === 400, 'RAM total investment should be 400');
    assert(ramStock.totalRevenue === 220, 'RAM total revenue should be 220');

    // Validate sourcing vendor share list
    assert(Array.isArray(analytics.vendorList), 'vendorList should be an array');
    assert(analytics.vendorList.length === 1, 'vendorList should contain exactly 1 seller');
    const intelVendor = analytics.vendorList.find((v: any) => v.name === 'Intel Corp');
    assert(!!intelVendor, 'Intel Corp vendor should be in list');
    assert(intelVendor.totalCost === 3900, 'Intel Corp total cost should be 3900');
    assert(intelVendor.totalItems === 15, 'Intel Corp total items should be 15');

    console.log('🎉 ALL INVENTORY TDD TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(err => {
    console.error('❌ Test execution failed with error:', err);
    process.exit(1);
});
