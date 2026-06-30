const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create Demo User
  const demoEmail = 'demo@cashops.com';
  const hashedPassword = await bcrypt.hash('password123', 10);

  const user = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {},
    create: {
      email: demoEmail,
      name: 'Demo User',
      password: hashedPassword,
    },
  });

  console.log(`User created/found: ${user.email} (${user.id})`);

  // 2. Create Sellers
  const sellerNames = ['Asad', 'Sakib', 'Misbah', 'Bacchu', 'Atiq'];
  const sellers = {};

  for (const name of sellerNames) {
    const seller = await prisma.seller.upsert({
      where: {
        userId_name: {
          userId: user.id,
          name: name,
        },
      },
      update: {},
      create: {
        name: name,
        userId: user.id,
        contactInfo: `Contact for ${name}`,
      },
    });
    sellers[name] = seller;
  }

  console.log(`Created ${Object.keys(sellers).length} sellers.`);

  // 3. Create Products
  const productData = [
    { name: 'Kattle', category: 'Electronics' },
    { name: 'Anjo', category: 'Other' },
    { name: 'En-lotion (500)', category: 'Health' },
    { name: 'B. Hot pillow', category: 'Other' },
    { name: 'M. Hot pillow', category: 'Other' },
    { name: '937', category: 'Other' },
    { name: 'Fresh care', category: 'Health' },
    { name: 'Gone D/N', category: 'Other' },
    { name: 'Sun cream (100)', category: 'Health' },
    { name: 'Alovena gel', category: 'Health' },
    { name: 'V228', category: 'Other' },
    { name: 'Imperial', category: 'Other' },
    { name: 'B cream', category: 'Other' },
    { name: '6008', category: 'Other' },
    { name: 'En lotion (250)', category: 'Health' },
    { name: '6005', category: 'Other' },
    { name: 'Hair spray', category: 'Health' },
    { name: 'Animate', category: 'Other' },
    { name: 'Rampa', category: 'Other' },
    { name: 'Dr. suncream (75)', category: 'Health' },
    { name: 'Dr. suncream (100)', category: 'Health' },
    { name: 'Coffee', category: 'Food' },
    { name: 'G. D/N', category: 'Other' },
    { name: 'Tasbih', category: 'Other' },
    { name: '071', category: 'Other' },
    { name: 'G. Beauty', category: 'Other' },
    { name: 'M42', category: 'Other' },
    { name: 'En lotion 400ml', category: 'Health' },
    { name: '8383 makeup', category: 'Other' },
  ];

  const products = {};
  for (const item of productData) {
    const product = await prisma.product.upsert({
      where: {
        userId_name: {
          userId: user.id,
          name: item.name,
        },
      },
      update: {},
      create: {
        name: item.name,
        category: item.category,
        userId: user.id,
      },
    });
    products[item.name] = product;
  }

  console.log(`Created ${Object.keys(products).length} products.`);

  // 4. Create SellerProducts (cost prices from the sheets)
  const sellerProductsData = [
    // Asad offers
    { seller: 'Asad', product: 'Kattle', cost: 11.50 },
    { seller: 'Asad', product: 'Anjo', cost: 4.75 }, // average of 4.5 and 5
    { seller: 'Asad', product: 'En-lotion (500)', cost: 6.00 },
    { seller: 'Asad', product: 'B. Hot pillow', cost: 6.00 },
    { seller: 'Asad', product: 'M. Hot pillow', cost: 7.50 },
    { seller: 'Asad', product: '937', cost: 27.00 },
    { seller: 'Asad', product: 'Fresh care', cost: 23.00 },
    { seller: 'Asad', product: 'Gone D/N', cost: 7.50 },
    { seller: 'Asad', product: 'Sun cream (100)', cost: 7.50 },
    { seller: 'Asad', product: 'Alovena gel', cost: 3.50 },
    { seller: 'Asad', product: 'V228', cost: 31.00 },
    { seller: 'Asad', product: 'Imperial', cost: 13.50 },
    { seller: 'Asad', product: 'B cream', cost: 7.50 },
    { seller: 'Asad', product: '6008', cost: 24.00 },
    { seller: 'Asad', product: 'En lotion (250)', cost: 4.40 },
    { seller: 'Asad', product: '6005', cost: 21.00 },
    { seller: 'Asad', product: 'Hair spray', cost: 3.20 },
    { seller: 'Asad', product: 'Animate', cost: 4.00 },
    { seller: 'Asad', product: 'Rampa', cost: 5.00 },

    // Sakib offers
    { seller: 'Sakib', product: '6008', cost: 24.00 },
    { seller: 'Sakib', product: 'Dr. suncream (75)', cost: 7.50 },
    { seller: 'Sakib', product: 'Dr. suncream (100)', cost: 7.50 },
    { seller: 'Sakib', product: 'Coffee', cost: 40.00 },
    { seller: 'Sakib', product: 'G. D/N', cost: 7.50 },
    { seller: 'Sakib', product: 'Tasbih', cost: 1.17 },
    { seller: 'Sakib', product: '071', cost: 22.00 },
    { seller: 'Sakib', product: 'G. Beauty', cost: 7.50 },
    { seller: 'Sakib', product: '6005', cost: 21.00 },

    // Misbah offers
    { seller: 'Misbah', product: 'M42', cost: 42.00 },
    { seller: 'Misbah', product: 'En lotion 400ml', cost: 7.00 },
    { seller: 'Misbah', product: '8383 makeup', cost: 8.50 },

    // Bacchu offers
    { seller: 'Bacchu', product: 'Anjo', cost: 5.30 },

    // Atiq offers
    { seller: 'Atiq', product: 'M. Hot pillow', cost: 7.50 },
  ];

  for (const item of sellerProductsData) {
    const product = products[item.product];
    const seller = sellers[item.seller];
    if (product && seller) {
      await prisma.sellerProduct.upsert({
        where: {
          sellerId_productId: {
            sellerId: seller.id,
            productId: product.id,
          },
        },
        update: { costPrice: item.cost },
        create: {
          sellerId: seller.id,
          productId: product.id,
          costPrice: item.cost,
        },
      });
    }
  }

  console.log('Created seller-product relationships.');

  // 5. Seed Purchases (Investment) from June 27, 2026
  const purchaseDate = new Date('2026-06-27T12:00:00Z');
  
  const purchasesData = [
    // Asad sheet
    { seller: 'Asad', product: 'Kattle', qty: 55, price: 11.50 },
    { seller: 'Asad', product: 'Anjo', qty: 50, price: 4.50 },
    { seller: 'Asad', product: 'Anjo', qty: 48, price: 5.00 },
    { seller: 'Asad', product: 'En-lotion (500)', qty: 45, price: 6.00 },
    { seller: 'Asad', product: 'B. Hot pillow', qty: 6, price: 6.00 },
    { seller: 'Asad', product: 'M. Hot pillow', qty: 1, price: 7.50 },
    { seller: 'Asad', product: '937', qty: 8, price: 27.00 },
    { seller: 'Asad', product: 'Fresh care', qty: 23, price: 23.00 },
    { seller: 'Asad', product: 'Gone D/N', qty: 11, price: 7.50 },
    { seller: 'Asad', product: 'Sun cream (100)', qty: 1, price: 7.50 },
    { seller: 'Asad', product: 'Alovena gel', qty: 2, price: 3.50 },
    { seller: 'Asad', product: 'V228', qty: 1, price: 31.00 },
    { seller: 'Asad', product: 'Imperial', qty: 2, price: 13.50 },
    { seller: 'Asad', product: 'B cream', qty: 2, price: 7.50 },
    { seller: 'Asad', product: '6008', qty: 3, price: 24.00 },
    { seller: 'Asad', product: 'En lotion (250)', qty: 6, price: 4.40 },
    { seller: 'Asad', product: '6005', qty: 2, price: 21.00 },
    { seller: 'Asad', product: 'Hair spray', qty: 1, price: 3.20 },
    { seller: 'Asad', product: 'Animate', qty: 2, price: 4.00 },
    { seller: 'Asad', product: 'Rampa', qty: 1, price: 5.00 },

    // Sakib sheet
    { seller: 'Sakib', product: '6008', qty: 4, price: 24.00 },
    { seller: 'Sakib', product: 'Dr. suncream (75)', qty: 3, price: 7.50 },
    { seller: 'Sakib', product: 'Dr. suncream (100)', qty: 1, price: 7.50 },
    { seller: 'Sakib', product: 'Coffee', qty: 1, price: 40.00 },
    { seller: 'Sakib', product: 'G. D/N', qty: 9, price: 7.50 },
    { seller: 'Sakib', product: 'Tasbih', qty: 4, price: 1.17 },
    { seller: 'Sakib', product: '071', qty: 1, price: 22.00 },
    { seller: 'Sakib', product: 'G. Beauty', qty: 1, price: 7.50 },
    { seller: 'Sakib', product: '6005', qty: 1, price: 21.00 },

    // Misbah sheet
    { seller: 'Misbah', product: 'M42', qty: 6, price: 42.00 },
    { seller: 'Misbah', product: 'En lotion 400ml', qty: 5, price: 7.00 },
    { seller: 'Misbah', product: '8383 makeup', qty: 1, price: 8.50 },

    // Bacchu
    { seller: 'Bacchu', product: 'Anjo', qty: 35, price: 5.30 },

    // Atiq
    { seller: 'Atiq', product: 'M. Hot pillow', qty: 1, price: 7.50 },
  ];

  for (const item of purchasesData) {
    const product = products[item.product];
    const seller = sellers[item.seller];
    if (product && seller) {
      await prisma.purchase.create({
        data: {
          productId: product.id,
          sellerId: seller.id,
          userId: user.id,
          quantity: item.qty,
          unitPrice: item.price,
          totalCost: item.qty * item.price,
          date: purchaseDate,
        },
      });
    }
  }

  console.log('Seeded purchase transactions.');

  // 6. Seed some mock Sales (Revenue) to demonstrate dashboard calculation
  // Let's record sales for a few products so there is some revenue & margin data!
  const saleDate = new Date('2026-06-28T14:00:00Z');
  const salesData = [
    { product: 'Kattle', qty: 12, price: 25.00 }, // cost: 11.50 -> profit: 13.50 * 12
    { product: 'Anjo', qty: 25, price: 10.00 }, // cost: ~4.75 -> profit: 5.25 * 25
    { product: 'En-lotion (500)', qty: 15, price: 12.00 }, // cost: 6 -> profit: 6 * 15
    { blockStockSale: true, product: 'Gone D/N', qty: 15, price: 15.00, comment: 'Sold more than in stock - customer request' }, // stock level was 11, now -4!
  ];

  for (const item of salesData) {
    const product = products[item.product];
    if (product) {
      await prisma.sale.create({
        data: {
          productId: product.id,
          userId: user.id,
          quantity: item.qty,
          unitPrice: item.price,
          totalRevenue: item.qty * item.price,
          comment: item.comment || 'Regular store sale',
          date: saleDate,
        },
      });
    }
  }

  console.log('Seeded sample sale transactions.');
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
