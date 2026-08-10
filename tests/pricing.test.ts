import { describe, expect, it } from 'vitest';
import { calculatePricing } from '@/services/booking.service';

/**
 * Pricing is the security-critical calculation: it decides what a customer
 * owes, and it must never be influenced by client input.
 */
describe('calculatePricing', () => {
  it('charges adult fare for travellers 12 and over', () => {
    const result = calculatePricing({
      unitPrice: 10_000,
      childPrice: 7_000,
      travellers: [{ age: 30 }, { age: 28 }],
    });

    expect(result.adults).toBe(2);
    expect(result.children).toBe(0);
    expect(result.subtotal).toBe(20_000);
  });

  it('charges child fare between 2 and 11', () => {
    const result = calculatePricing({
      unitPrice: 10_000,
      childPrice: 7_000,
      travellers: [{ age: 30 }, { age: 8 }],
    });

    expect(result.adults).toBe(1);
    expect(result.children).toBe(1);
    expect(result.subtotal).toBe(17_000);
  });

  it('does not charge for infants under 2', () => {
    const result = calculatePricing({
      unitPrice: 10_000,
      childPrice: 7_000,
      travellers: [{ age: 30 }, { age: 1 }],
    });

    expect(result.adults).toBe(1);
    expect(result.children).toBe(0);
    expect(result.subtotal).toBe(10_000);
  });

  it('applies 5% tax to the subtotal', () => {
    const result = calculatePricing({
      unitPrice: 10_000,
      childPrice: 7_000,
      travellers: [{ age: 30 }],
    });

    expect(result.taxes).toBe(500);
    expect(result.total).toBe(10_500);
  });

  it('bills one adult fare when every traveller is an infant', () => {
    // Guards against a zero-total booking from an all-infant party.
    const result = calculatePricing({
      unitPrice: 10_000,
      childPrice: 7_000,
      travellers: [{ age: 1 }],
    });

    expect(result.adults).toBe(1);
    expect(result.total).toBeGreaterThan(0);
  });

  it('treats the age boundaries exactly', () => {
    const atTwo = calculatePricing({
      unitPrice: 100,
      childPrice: 50,
      travellers: [{ age: 2 }],
    });
    expect(atTwo.children).toBe(1);

    const atTwelve = calculatePricing({
      unitPrice: 100,
      childPrice: 50,
      travellers: [{ age: 12 }],
    });
    expect(atTwelve.adults).toBe(1);
  });

  it('always reports INR', () => {
    const result = calculatePricing({
      unitPrice: 1,
      childPrice: 1,
      travellers: [{ age: 30 }],
    });
    expect(result.currency).toBe('INR');
  });
});
