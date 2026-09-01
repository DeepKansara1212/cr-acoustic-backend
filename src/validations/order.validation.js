const { z } = require('zod');

const shippingAddressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().min(1).default('India'),
});

const createOrderSchema = z.object({
  body: z.object({
    shippingAddress: shippingAddressSchema,
  }),
});

const updateOrderStatusSchema = z.object({
  body: z.object({
    orderStatus: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']),
  }),
});

module.exports = { createOrderSchema, updateOrderStatusSchema };
