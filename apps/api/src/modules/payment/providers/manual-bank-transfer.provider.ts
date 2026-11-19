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
export class ManualBankTransferProvider implements PaymentProvider {
  readonly providerName = 'manual_bank_transfer';
  private readonly logger = new Logger(ManualBankTransferProvider.name);

  // Designated platform holding account for Peshawar rentals escrow/verification
  private readonly defaultAccount = {
    bankName: 'Bank of Khyber (BOK)',
    accountTitle: 'Peshawar Rental Escrow Trust',
    accountNumber: '00123456789012',
    iban: 'PK36BOKH0000001234567890',
    branch: 'Saddar Road Branch, Peshawar',
  };

  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<CreatePaymentIntentResult> {
    const paymentIntentId = `manual_${crypto.randomUUID()}`;
    this.logger.log(
      `Created manual bank transfer intent ${paymentIntentId} for PKR ${params.amountPkr}`,
    );

    return {
      paymentIntentId,
      status: PaymentStatus.PENDING,
      clientSecret: `ibft_ref_${params.bookingId.substring(0, 8)}`,
      instructions: {
        ...this.defaultAccount,
        referenceCode: `BOOK-${params.bookingId.substring(0, 8).toUpperCase()}`,
        amountPkr: params.amountPkr,
        note: 'Please include the reference code in your IBFT transfer description and upload receipt slip.',
      },
    };
  }

  async verifyWebhook(
    payload: any,
    signature: string,
    secret?: string,
  ): Promise<WebhookVerificationResult> {
    // Manual verification is signed by internal admin/operator token or HMAC
    const expected = secret
      ? crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex')
      : signature;

    const isValid = !secret || signature === expected;

    return {
      isValid,
      event: payload.event || 'payment.manual_verification',
      providerTransactionId:
        payload.referenceNumber || payload.transactionId || `man_tx_${Date.now()}`,
      amountPkr: Number(payload.amountPkr || payload.amount || 0),
      currency: 'PKR',
      status: payload.status === 'REJECTED' ? PaymentStatus.FAILED : PaymentStatus.SUCCEEDED,
      rawPayload: payload,
    };
  }

  async processRefund(params: ProcessRefundParams): Promise<ProcessRefundResult> {
    const refundId = `ref_manual_${crypto.randomUUID()}`;
    this.logger.log(
      `Initiated manual refund ${refundId} of PKR ${params.amountPkr} for payment ${params.paymentId}`,
    );
    return {
      refundId,
      status: 'PENDING_BANK_DISBURSEMENT',
      rawResponse: {
        reason: params.reason,
        method: 'MANUAL_IBFT',
        processedAt: new Date().toISOString(),
      },
    };
  }

  async getPaymentStatus(_providerTransactionId: string): Promise<PaymentStatus> {
    return PaymentStatus.PENDING;
  }
}
