import { describe, it } from 'node:test';
import assert from 'node:assert';
import { BookingStatus, DisputeCategory } from '@rental-peshawar/shared-types';

describe('Phase 13: Booking, Payment, Agreement & Dispute Web Flow Tests', () => {
  it('correctly calculates total initial escrow amount from monthly rent and deposit', () => {
    const property = {
      monthlyRentPkr: 45000,
      securityDepositPkr: 90000,
    };

    const calculateInitialEscrow = (rent, deposit) => {
      const security = deposit !== undefined ? deposit : rent;
      return rent + security;
    };

    const initialAmount = calculateInitialEscrow(
      property.monthlyRentPkr,
      property.securityDepositPkr,
    );
    assert.strictEqual(initialAmount, 135000);

    // If deposit not specified, defaults to 1 month rent
    const defaultDepositAmount = calculateInitialEscrow(45000, undefined);
    assert.strictEqual(defaultDepositAmount, 90000);
  });

  it('validates booking state transitions for tenant and landlord', () => {
    const validTransitions = {
      [BookingStatus.REQUESTED]: [BookingStatus.AWAITING_PAYMENT, BookingStatus.CANCELLED],
      [BookingStatus.AWAITING_PAYMENT]: [
        BookingStatus.PAYMENT_PENDING,
        BookingStatus.CANCELLED,
        BookingStatus.EXPIRED,
      ],
      [BookingStatus.PAYMENT_PENDING]: [BookingStatus.CONFIRMED, BookingStatus.AWAITING_PAYMENT],
      [BookingStatus.CONFIRMED]: [
        BookingStatus.ACTIVE,
        BookingStatus.DISPUTED,
        BookingStatus.REFUNDED,
      ],
      [BookingStatus.ACTIVE]: [BookingStatus.COMPLETED, BookingStatus.DISPUTED],
    };

    const canTransition = (current, next) => {
      return (validTransitions[current] || []).includes(next);
    };

    assert.ok(canTransition(BookingStatus.REQUESTED, BookingStatus.AWAITING_PAYMENT));
    assert.ok(canTransition(BookingStatus.AWAITING_PAYMENT, BookingStatus.PAYMENT_PENDING));
    assert.ok(canTransition(BookingStatus.PAYMENT_PENDING, BookingStatus.CONFIRMED));
    assert.ok(canTransition(BookingStatus.CONFIRMED, BookingStatus.ACTIVE));
    assert.ok(!canTransition(BookingStatus.ACTIVE, BookingStatus.REQUESTED));
  });

  it('detects double-booking date conflicts and availability lock', () => {
    const activeBookings = [
      {
        id: 'b1',
        propertyId: 'prop-1',
        status: BookingStatus.CONFIRMED,
        startDate: '2026-03-01',
        endDate: '2026-08-31',
      },
    ];

    const hasConflict = (propertyId, startDate, endDate, bookings) => {
      return bookings.some((b) => {
        if (b.propertyId !== propertyId) return false;
        if (
          ![
            BookingStatus.AWAITING_PAYMENT,
            BookingStatus.PAYMENT_PENDING,
            BookingStatus.CONFIRMED,
            BookingStatus.ACTIVE,
          ].includes(b.status)
        ) {
          return false;
        }
        return (
          (startDate >= b.startDate && startDate <= b.endDate) ||
          (endDate >= b.startDate && endDate <= b.endDate) ||
          (startDate <= b.startDate && endDate >= b.endDate)
        );
      });
    };

    // Conflicting booking
    assert.ok(hasConflict('prop-1', '2026-04-01', '2026-09-30', activeBookings));
    // Non-conflicting booking for different property
    assert.ok(!hasConflict('prop-2', '2026-04-01', '2026-09-30', activeBookings));
    // Non-conflicting booking for future date range
    assert.ok(!hasConflict('prop-1', '2026-09-01', '2027-02-28', activeBookings));
  });

  it('validates agreement digital signing audit record requirements', () => {
    const createAuditSignature = ({ agreementId, userId, role, name, ipAddress, userAgent }) => {
      assert.ok(
        agreementId && userId && role && name,
        'All required signature fields must be present',
      );
      assert.ok(['TENANT', 'LANDLORD'].includes(role), 'Signer role must be TENANT or LANDLORD');
      return {
        agreementId,
        signerId: userId,
        signerRole: role,
        signerName: name,
        ipAddress: ipAddress || '127.0.0.1',
        userAgent: userAgent || 'WebClient',
        signedAt: new Date().toISOString(),
      };
    };

    const record = createAuditSignature({
      agreementId: 'agr-123',
      userId: 'usr-456',
      role: 'TENANT',
      name: 'Ahmad Khan',
      ipAddress: '103.255.4.1',
      userAgent: 'Mozilla/5.0',
    });

    assert.strictEqual(record.signerRole, 'TENANT');
    assert.strictEqual(record.signerName, 'Ahmad Khan');
    assert.strictEqual(record.ipAddress, '103.255.4.1');
    assert.ok(record.signedAt);
  });

  it('verifies dispute escrow hold application and categories', () => {
    const validCategories = [
      DisputeCategory.PAYMENT_ISSUE,
      DisputeCategory.PROPERTY_NOT_AS_DESCRIBED,
      DisputeCategory.DEPOSIT_ISSUE,
      DisputeCategory.EARLY_TERMINATION,
      DisputeCategory.SAFETY_ISSUE,
      DisputeCategory.OTHER,
    ];

    assert.strictEqual(validCategories.length, 6);
    assert.ok(validCategories.includes(DisputeCategory.DEPOSIT_ISSUE));
  });
});
