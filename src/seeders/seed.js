require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const categoriesData = require('./data/categories.data');
const productsData = require('./data/products.data');

const destroyData = async () => {
  await Promise.all([Product.deleteMany(), Category.deleteMany()]);
  await User.deleteMany({ email: process.env.ADMIN_EMAIL || 'admin@cracoustic.com' });
  console.log('Data destroyed');
};

const importData = async () => {
  const categories = await Category.insertMany(categoriesData);
  const categoryByName = new Map(categories.map((c) => [c.name, c._id]));

  const products = productsData.map((p) => ({ ...p, category: categoryByName.get(p.category) }));
  await Product.insertMany(products);

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@cracoustic.com';
  const existingAdmin = await User.findOne({ email: adminEmail });
  if (!existingAdmin) {
    await User.create({
      firstName: process.env.ADMIN_FIRST_NAME || 'CR',
      lastName: process.env.ADMIN_LAST_NAME || 'Admin',
      email: adminEmail,
      password: process.env.ADMIN_PASSWORD || 'AdminPass123!',
      isAdmin: true,
    });
  }

  console.log(`Seeded ${categories.length} categories, ${products.length} products, and admin user (${adminEmail})`);
};

const run = async () => {
  await connectDB();

  let exitCode = 0;
  try {
    if (process.argv.includes('-d')) {
      await destroyData();
    } else {
      await destroyData();
      await importData();
    }
  } catch (error) {
    console.error(`Seeding failed: ${error.message}`);
    exitCode = 1;
  }

  await mongoose.disconnect();
  process.exit(exitCode);
};

run();
