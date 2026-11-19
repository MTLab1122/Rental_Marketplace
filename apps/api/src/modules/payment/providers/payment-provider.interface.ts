import { PaymentStatus } from '@rental-peshawar/shared-types';

export interface CreatePaymentIntentParams {
  amountPkr: number;
  currency: string;
  bookingId: string;
  userId: string;
  idempotencyKey: string;
  metadata?: Record<string, any>;
}

export interface CreatePaymentIntentResult {
  paymentIntentId: string;
  clientSecret?: string;
  status: PaymentStatus;
  redirectUrl?: string;
  instructions?: Record<string, any>;
}

export interface WebhookVerificationResult {
  isValid: boolean;
  event: string;
  providerTransactionId: string;
  amountPkr: number;
  currency: string;
  status: PaymentStatus;
  rawPayload: Record<string, any>;
}

export interface ProcessRefundParams {
  paymentId: string;
  providerTransactionId?: string;
  amountPkr: number;
  reason: string;
}

export interface ProcessRefundResult {
  refundId: string;
  status: string;
  rawResponse?: Record<string, any>;
}

export interface PaymentProvider {
  readonly providerName: string;
  createPaymentIntent(params: CreatePaymentIntentParams): Promise<CreatePaymentIntentResult>;
  verifyWebhook(
    payload: any,
    signature: string,
    secret?: string,
  ): Promise<WebhookVerificationResult>;
  processRefund(params: ProcessRefundParams): Promise<ProcessRefundResult>;
  getPaymentStatus(providerTransactionId: string): Promise<PaymentStatus>;
}
