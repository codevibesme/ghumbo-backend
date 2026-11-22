import z from 'zod';

export const RazorpayErrorCallback = z.object({
  code: z.string(),
  description: z.string(),
  reason: z.string(),
  metadata: z.object({
    order_id: z.string(),
    payment_id: z.string(),
  }),
});

export const RazorpayCallbackBody = z.object({
  razorpay_payment_id: z.string().optional(),
  razorpay_order_id: z.string().optional(),
  razorpay_signature: z.string().optional(),
  error: RazorpayErrorCallback.optional(),
});

export type TRazorpayCallbackBody = z.infer<typeof RazorpayCallbackBody>;
export type TRazorpayErrorCallback = z.infer<typeof RazorpayErrorCallback>;
