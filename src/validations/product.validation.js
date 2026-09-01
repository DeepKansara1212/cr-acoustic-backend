const { z } = require('zod');
const BRANDS = require('../constants/brands');

const imageSchema = z.object({
  url: z.string().url(),
  alt: z.string().optional(),
  isDefault: z.boolean().optional(),
});

const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    shortDescription: z.string().optional(),
    fullDescription: z.string().min(1, 'Full description is required'),
    price: z.number().positive('Price must be greater than 0'),
    comparePrice: z.number().positive().optional(),
    costPrice: z.number().positive().optional(),
    stock: z.number().int().min(0).default(0),
    lowStockThreshold: z.number().int().min(0).optional(),
    category: z.string().min(1, 'Category is required'),
    brand: z.enum(BRANDS),
    tags: z.array(z.string()).optional(),
    badge: z.string().optional(),
    images: z.array(imageSchema).max(6).optional(),
    isFeatured: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }),
});

const updateProductSchema = z.object({
  body: createProductSchema.shape.body.partial(),
});

module.exports = { createProductSchema, updateProductSchema };
