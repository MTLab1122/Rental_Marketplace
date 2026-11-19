import { Injectable } from '@nestjs/common';
import { PaymentProvider } from './payment-provider.interface';
import { ManualBankTransferProvider } from './manual-bank-transfer.provider';
import { JazzCashProvider } from './jazzcash.provider';
import { EasypaisaProvider } from './easypaisa.provider';
import { StripeProvider } from './stripe.provider';
import { PaymentMethodType } from '@rental-peshawar/shared-types';

@Injectable()
export class PaymentProviderFactory {
  constructor(
    private readonly manualProvider: ManualBankTransferProvider,
    private readonly jazzcashProvider: JazzCashProvider,
    private readonly easypaisaProvider: EasypaisaProvider,
    private readonly stripeProvider: StripeProvider,
  ) {}

  getProvider(providerNameOrMethod?: string | PaymentMethodType): PaymentProvider {
    const selected =
      providerNameOrMethod || process.env['PAYMENT_PROVIDER'] || 'manual_bank_transfer';
    const normalized = selected.toString().toLowerCase();

    if (
      normalized.includes('jazzcash') ||
      normalized === PaymentMethodType.JAZZCASH.toLowerCase()
    ) {
      return this.jazzcashProvider;
    }
    if (
      normalized.includes('easypaisa') ||
      normalized === PaymentMethodType.EASYPAISA.toLowerCase()
    ) {
      return this.easypaisaProvider;
    }
    if (normalized.includes('stripe') || normalized === PaymentMethodType.STRIPE.toLowerCase()) {
      return this.stripeProvider;
    }

    // Default compliant offline/manual bank transfer workflow
    return this.manualProvider;
  }
}
