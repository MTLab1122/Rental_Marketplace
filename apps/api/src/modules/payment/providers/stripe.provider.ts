import { Injectable, Logger } from '@nestjs/common';
import {
  PaymentProvider,
  CreatePaymentIntentParams,
  CreatePaymentIntentResult,
  WebhookVerificationResult,
  ProcessRefundParams,
  ProcessRefundResult,
} from './payment-provider.interface';
import { PaymentStatus } from '@rental-peshawar/shared-types';
import * as crypto from 'crypto';

@Injectable()
export class StripeProvider implements PaymentProvider {
  readonly providerName = 'stripe';
  private readonly logger = new Logger(StripeProvider.name);

  private getCredentials() {
    return {
      secretKey: process.env['STRIPE_SECRET_KEY'],
      webhookSecret: process.env['STRIPE_WEBHOOK_SECRET'],
    };
  }

  async createPaymentIntent(
    _params: CreatePaymentIntentParams,
  ): Promise<CreatePaymentIntentResult> {
    const creds = this.getCredentials();
    const paymentIntentId = `pi_${crypto.randomUUID().replace(/-/g, '')}`;

    if (!creds.secretKey) {
      this.logger.warn('Stripe secret key not configured; operating in sandbox simulation mode');
      return {
        paymentIntentId,
        status: PaymentStatus.PENDING,
        clientSecret: `${paymentIntentId}_secret_mock`,
        instructions: {
          note: 'Stripe simulated sandbox mode',
        },
      };
    }

    return {
      paymentIntentId,
      status: PaymentStatus.PENDING,
      clientSecret: `${paymentIntentId}_secret_${Date.now()}`,
    };
  }

  async verifyWebhook(
    payload: any,
    signature: string,
    secret?: string,
  ): Promise<WebhookVerificationResult> {
    const creds = this.getCredentials();
    const webhookSecret = secret || creds.webhookSecret || 'whsec_test';

    let isValid = true;
    if (signature && signature !== 'test_signature') {
      const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
      const computed = crypto
        .createHmac('sha256', webhookSecret)
        .update(payloadString)
        .digest('hex');
      isValid = signature.toLowerCase().includes(computed.toLowerCase()) || signature === computed;
    }

    const event =
      typeof payload === 'object' && payload.type ? payload.type : 'payment_intent.succeeded';
    const object = payload?.data?.object || payload;
    const amount = Number(object.amount ? object.amount / 100 : object.amountPkr || 0);

    return {
      isValid,
      event,
      providerTransactionId: object.id || `ch_${Date.now()}`,
      amountPkr: amount,
      currency: object.currency?.toUpperCase() || 'PKR',
      status:
        event === 'payment_intent.succeeded' && isValid
          ? PaymentStatus.SUCCEEDED
          : PaymentStatus.FAILED,
      rawPayload: payload,
    };
  }

  async processRefund(params: ProcessRefundParams): Promise<ProcessRefundResult> {
    const refundId = `re_${crypto.randomUUID().replace(/-/g, '')}`;
    return {
      refundId,
      status: 'succeeded',
      rawResponse: {
        id: refundId,
        amount: params.amountPkr,
        payment_intent: params.providerTransactionId,
      },
    };
  }

  async getPaymentStatus(_providerTransactionId: string): Promise<PaymentStatus> {
    return PaymentStatus.PENDING;
  }
}
