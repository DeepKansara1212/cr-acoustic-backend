const { z } = require('zod');

const createReviewSchema = z.object({
  body: z.object({
    rating: z.number().int().min(1).max(5),
    reviewTitle: z.string().min(1, 'Review title is required'),
    reviewText: z.string().optional(),
  }),
});

const updateReviewSchema = z.object({
  body: createReviewSchema.shape.body.partial(),
});

module.exports = { createReviewSchema, updateReviewSchema };
