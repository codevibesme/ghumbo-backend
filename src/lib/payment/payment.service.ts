import { Injectable, InternalServerErrorException } from '@nestjs/common';

import Razorpay from 'razorpay';
import {
  validatePaymentVerification,
  validateWebhookSignature,
} from 'razorpay/dist/utils/razorpay-utils.js';
import { Orders } from 'razorpay/dist/types/orders.js';

@Injectable()
export class PaymentService {
  private client: Razorpay;
  constructor() {
    this.client = new Razorpay({
      key_id: process.env.RAZORPAY_API_KEY,
      key_secret: process.env.RAZORPAY_API_SECRET,
    });
  }

  async createOrder(
    record: Orders.RazorpayOrderCreateRequestBody,
  ): Promise<Orders.RazorpayOrder> {
    return await this.client.orders.create({
      amount: record.amount,
      currency: record.currency.toUpperCase(),
      receipt: record.receipt,
      notes: record.notes,
    });
  }

  async getOrder(id: string): Promise<Orders.RazorpayOrder> {
    return await this.client.orders.fetch(id);
  }

  async refundBooking(bookingId: string, paymentId: string, amount: number) {
    return await this.client.payments.refund(paymentId, {
      amount,
      notes: {
        bookingId,
      },
      receipt: bookingId,
      speed: 'optimum',
    });
  }

  validateWebhook(webhookBody: string, signature: string): boolean {
    if (!process.env.RAZORPAY_WEBHOOK_SECRET)
      throw new InternalServerErrorException('Payment webhook secret missing');

    return validateWebhookSignature(
      webhookBody,
      signature,
      process.env.RAZORPAY_WEBHOOK_SECRET,
    );
  }

  validatePaymentSignature(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
  ): boolean {
    if (!process.env.RAZORPAY_API_SECRET)
      throw new InternalServerErrorException('Payment api secret missing');

    return validatePaymentVerification(
      {
        order_id: razorpayOrderId,
        payment_id: razorpayPaymentId,
      },
      razorpaySignature,
      process.env.RAZORPAY_API_SECRET,
    );
  }
}
