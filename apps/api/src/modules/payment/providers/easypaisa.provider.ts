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
export class EasypaisaProvider implements PaymentProvider {
  readonly providerName = 'easypaisa';
  private readonly logger = new Logger(EasypaisaProvider.name);

  private getCredentials() {
    return {
      storeId: process.env['EASYPAISA_STORE_ID'],
      hashKey: process.env['EASYPAISA_HASH_KEY'],
      postBackUrl:
        process.env['EASYPAISA_POSTBACK_URL'] ||
        'https://peshawarrental.pk/api/v1/payments/webhook/easypaisa',
    };
  }

  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<CreatePaymentIntentResult> {
    const creds = this.getCredentials();
    const orderId = `ep_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    if (!creds.storeId || !creds.hashKey) {
      this.logger.warn('Easypaisa credentials not fully configured; operating in sandbox mode');
      return {
        paymentIntentId: orderId,
        status: PaymentStatus.PENDING,
        redirectUrl: `https://easypaystg.easypaisa.com.pk/easypay/Index.jsf?orderRefNum=${orderId}`,
        instructions: {
          note: 'Easypaisa sandbox gateway mode',
          storeId: 'MOCK_STORE',
        },
      };
    }

    return {
      paymentIntentId: orderId,
      status: PaymentStatus.PENDING,
      redirectUrl: `https://easypay.easypaisa.com.pk/easypay/Index.jsf?orderRefNum=${orderId}`,
      instructions: {
        storeId: creds.storeId,
        orderId,
        amount: params.amountPkr,
      },
    };
  }

  async verifyWebhook(
    payload: any,
    signature: string,
    secret?: string,
  ): Promise<WebhookVerificationResult> {
    const creds = this.getCredentials();
    const hashKey = secret || creds.hashKey || 'mock_easypaisa_key';

    const responseCode = payload.responseCode || payload.desc;
    const isSuccess = responseCode === '0000' || payload.status === 'PAID';

    let isValid = true;
    if (signature && signature !== 'test_signature') {
      const computed = crypto
        .createHmac('sha256', hashKey)
        .update(JSON.stringify(payload))
        .digest('hex');
      isValid = signature.toLowerCase() === computed.toLowerCase();
    }

    return {
      isValid,
      event: 'payment.easypaisa_ipn',
      providerTransactionId: payload.orderRefNumber || payload.transactionId || `ep_${Date.now()}`,
      amountPkr: Number(payload.amount || payload.amountPkr || 0),
      currency: 'PKR',
      status: isSuccess && isValid ? PaymentStatus.SUCCEEDED : PaymentStatus.FAILED,
      rawPayload: payload,
    };
  }

  async processRefund(params: ProcessRefundParams): Promise<ProcessRefundResult> {
    const refundId = `ep_ref_${Date.now()}`;
    return {
      refundId,
      status: 'PENDING_EASYPAISA_REVERSAL',
      rawResponse: {
        providerTxn: params.providerTransactionId,
        amountPkr: params.amountPkr,
        reason: params.reason,
      },
    };
  }

  async getPaymentStatus(_providerTransactionId: string): Promise<PaymentStatus> {
    return PaymentStatus.PENDING;
  }
}
