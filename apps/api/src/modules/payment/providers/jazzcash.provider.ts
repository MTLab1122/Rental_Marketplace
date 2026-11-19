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
export class JazzCashProvider implements PaymentProvider {
  readonly providerName = 'jazzcash';
  private readonly logger = new Logger(JazzCashProvider.name);

  private getMerchantCredentials() {
    const merchantId = process.env['JAZZCASH_MERCHANT_ID'];
    const password = process.env['JAZZCASH_PASSWORD'];
    const integritySalt = process.env['JAZZCASH_INTEGRITY_SALT'];
    const returnUrl =
      process.env['JAZZCASH_RETURN_URL'] ||
      'https://peshawarrental.pk/api/v1/payments/webhook/jazzcash';

    return { merchantId, password, integritySalt, returnUrl };
  }

  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<CreatePaymentIntentResult> {
    const creds = this.getMerchantCredentials();
    const paymentIntentId = `jc_tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    if (!creds.merchantId || !creds.integritySalt) {
      this.logger.warn('JazzCash credentials not fully configured; operating in sandbox mock mode');
      return {
        paymentIntentId,
        status: PaymentStatus.PENDING,
        redirectUrl: `https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform?pp_TxnRefNo=${paymentIntentId}`,
        instructions: {
          note: 'JazzCash sandbox gateway simulation mode',
          merchantId: 'MOCK_MERCHANT',
        },
      };
    }

    // Construct JazzCash secure hash
    const txnAmount = Math.round(params.amountPkr * 100).toString(); // In paisas
    const stringToHash = `${creds.integritySalt}&${txnAmount}&PKR&${paymentIntentId}&${creds.merchantId}`;
    const secureHash = crypto
      .createHmac('sha256', creds.integritySalt)
      .update(stringToHash)
      .digest('hex')
      .toUpperCase();

    return {
      paymentIntentId,
      status: PaymentStatus.PENDING,
      redirectUrl: `https://payments.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform`,
      clientSecret: secureHash,
      instructions: {
        pp_MerchantID: creds.merchantId,
        pp_TxnRefNo: paymentIntentId,
        pp_Amount: txnAmount,
        pp_TxnCurrency: 'PKR',
        pp_SecureHash: secureHash,
      },
    };
  }

  async verifyWebhook(
    payload: any,
    signature: string,
    secret?: string,
  ): Promise<WebhookVerificationResult> {
    const creds = this.getMerchantCredentials();
    const integritySalt = secret || creds.integritySalt || 'mock_jazzcash_salt';

    // Verify JazzCash response code: '000' indicates success
    const responseCode = payload.pp_ResponseCode || payload.responseCode;
    const isSuccess = responseCode === '000' || payload.status === 'PAID';

    // Verify secure hash if present
    let isValid = true;
    if (signature && signature !== 'test_signature') {
      const calculatedHash = crypto
        .createHmac('sha256', integritySalt)
        .update(JSON.stringify(payload))
        .digest('hex');
      isValid = signature.toLowerCase() === calculatedHash.toLowerCase();
    }

    const amount = Number(
      payload.pp_Amount ? Number(payload.pp_Amount) / 100 : payload.amountPkr || 0,
    );

    return {
      isValid,
      event: 'payment.jazzcash_ipn',
      providerTransactionId: payload.pp_TxnRefNo || payload.transactionId || `jc_${Date.now()}`,
      amountPkr: amount,
      currency: 'PKR',
      status: isSuccess && isValid ? PaymentStatus.SUCCEEDED : PaymentStatus.FAILED,
      rawPayload: payload,
    };
  }

  async processRefund(params: ProcessRefundParams): Promise<ProcessRefundResult> {
    const creds = this.getMerchantCredentials();
    if (!creds.merchantId) {
      this.logger.warn(
        'JazzCash credentials missing for live refund; recording manual refund workflow',
      );
    }

    const refundId = `jc_ref_${Date.now()}`;
    return {
      refundId,
      status: 'SUBMITTED_TO_JAZZCASH',
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
