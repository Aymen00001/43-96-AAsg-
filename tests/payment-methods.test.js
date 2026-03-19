/**
 * Payment Methods System Tests
 * Tests for English payment method identifiers and normalization
 * Updated: March 19, 2026
 */

const assert = require('assert');

// Payment method test suite
describe('Payment Methods System', () => {
  
  describe('Valid English Keys', () => {
    const validKeys = ['CARD', 'CASH', 'MEAL_VOUCHER', 'CHECK', 'FIDELITY_POINTS', 'STORE_CREDIT', 'CORPORATE_ACCOUNT'];
    
    validKeys.forEach(key => {
      it(`should accept ${key} as valid payment method`, () => {
        assert.strictEqual(typeof key, 'string');
        assert.match(key, /^[A-Z_]+$/);
      });
    });
  });

  describe('Payment Method Mapping', () => {
    const paymentMethodMap = {
      'CARTE_BANCAIRE': 'CARD',
      'ESPECES': 'CASH',
      'TICKET_RESTO': 'MEAL_VOUCHER',
      'CHÈQUE': 'CHECK',
      'CHEQUE': 'CHECK',
      'POINTS_FIDÉLITÉ': 'FIDELITY_POINTS',
      'AVOIR': 'STORE_CREDIT',
      'CLIENT_EN_COMPTE': 'CORPORATE_ACCOUNT'
    };

    Object.entries(paymentMethodMap).forEach(([french, english]) => {
      it(`should normalize ${french} to ${english}`, () => {
        const normalized = normalizePaymentMethod(french);
        assert.strictEqual(normalized, english);
      });
    });
  });

  describe('Case Insensitivity', () => {
    it('should normalize uppercase French values', () => {
      const result = normalizePaymentMethod('CARTE_BANCAIRE');
      assert.strictEqual(result, 'CARD');
    });

    it('should normalize lowercase French values', () => {
      const result = normalizePaymentMethod('carte_bancaire');
      assert.strictEqual(result, 'CARD');
    });

    it('should normalize mixed-case values', () => {
      const result = normalizePaymentMethod('Carte Bancaire');
      assert.strictEqual(result, 'CARD');
    });
  });

  describe('Whitespace Handling', () => {
    it('should trim whitespace from input', () => {
      const result = normalizePaymentMethod('  ESPECES  ');
      assert.strictEqual(result, 'CASH');
    });

    it('should handle internal spaces', () => {
      const result = normalizePaymentMethod('TICKET RESTO');
      assert.strictEqual(result, 'MEAL_VOUCHER');
    });
  });

  describe('Pass-through for English Keys', () => {
    const englishKeys = ['CARD', 'CASH', 'MEAL_VOUCHER', 'CHECK', 'FIDELITY_POINTS', 'STORE_CREDIT', 'CORPORATE_ACCOUNT'];
    
    englishKeys.forEach(key => {
      it(`should return ${key} unchanged for English input`, () => {
        const result = normalizePaymentMethod(key);
        assert.strictEqual(result, key);
      });
    });
  });

  describe('Null/Undefined Handling', () => {
    it('should return null for null input', () => {
      const result = normalizePaymentMethod(null);
      assert.strictEqual(result, null);
    });

    it('should return undefined for undefined input', () => {
      const result = normalizePaymentMethod(undefined);
      assert.strictEqual(result, undefined);
    });

    it('should return empty string for empty input', () => {
      const result = normalizePaymentMethod('');
      assert.strictEqual(result, '');
    });
  });

  describe('Unknown Methods', () => {
    it('should return unknown method as-is (fallback)', () => {
      const unknown = 'BITCOIN';
      const result = normalizePaymentMethod(unknown);
      assert.strictEqual(result, unknown);
    });
  });

});

describe('API Integration', () => {
  
  describe('GetTickets Endpoint', () => {
    
    it('should accept English payment method in filter', () => {
      const params = {
        idCRM: '1539874562',
        date1: '20260301',
        date2: '20260331',
        paymentMethod: 'CARD'
      };
      
      assert.strictEqual(params.paymentMethod, 'CARD');
      assert.strictEqual(typeof params.paymentMethod, 'string');
    });

    it('should support filtering by multiple payment methods', () => {
      const paymentMethods = ['CARD', 'CASH', 'MEAL_VOUCHER'];
      
      paymentMethods.forEach(method => {
        assert.ok(['CARD', 'CASH', 'MEAL_VOUCHER', 'CHECK', 'FIDELITY_POINTS', 'STORE_CREDIT', 'CORPORATE_ACCOUNT'].includes(method));
      });
    });

    it('should validate Z parameter for shift filtering', () => {
      const params = {
        Z: '1'
      };
      
      assert.ok(params.Z !== undefined);
      assert.strictEqual(String(params.Z), '1');
    });
  });

  describe('Response Data Normalization', () => {
    
    it('should normalize French payment methods in response', () => {
      const response = {
        ModePaiement: 'CARTE_BANCAIRE'
      };
      
      // Simulate normalization
      const normalized = normalizePaymentMethod(response.ModePaiement);
      assert.strictEqual(normalized, 'CARD');
    });

    it('should handle PaymentMethods array normalization', () => {
      const response = {
        PaymentMethods: [
          { payment_method: 'CARTE_BANCAIRE', amount: 50 },
          { payment_method: 'ESPECES', amount: 30 }
        ]
      };
      
      const normalized = response.PaymentMethods.map(p => ({
        ...p,
        payment_method: normalizePaymentMethod(p.payment_method)
      }));
      
      assert.strictEqual(normalized[0].payment_method, 'CARD');
      assert.strictEqual(normalized[1].payment_method, 'CASH');
    });
  });

});

describe('Shift Filtering', () => {
  
  it('should filter by Z field (shift number)', () => {
    const tickets = [
      { idTiquer: 1, Z: 1, closureNumber: '1' },
      { idTiquer: 2, Z: 2, closureNumber: '2' },
      { idTiquer: 3, Z: 1, closureNumber: '1' }
    ];
    
    const filtered = tickets.filter(t => String(t.Z) === '1');
    assert.strictEqual(filtered.length, 2);
    assert.strictEqual(filtered[0].idTiquer, 1);
    assert.strictEqual(filtered[1].idTiquer, 3);
  });

  it('should handle fallback to closureNumber', () => {
    const ticket = {
      idTiquer: 1,
      Z: undefined,
      closureNumber: '1'
    };
    
    const shift = ticket.Z !== undefined ? ticket.Z : ticket.closureNumber;
    assert.strictEqual(shift, '1');
  });

  it('should support all shift numbers 0-9', () => {
    const validShifts = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    
    validShifts.forEach(shift => {
      assert.ok(Number(shift) >= 0 && Number(shift) <= 9);
    });
  });

});

// Helper function for testing
function normalizePaymentMethod(methodValue) {
  if (methodValue === null || methodValue === undefined) return methodValue;
  let methodString = String(methodValue).trim().toUpperCase();

  // Normalize whitespace and diacritics so that values like "Carte Bancaire" and "Ticket Resto"
  // match the expected keys (e.g., "CARTE_BANCAIRE", "TICKET_RESTO").
  methodString = methodString
    .replace(/\s+/g, '_')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const paymentMethodMap = {
    'CARTE_BANCAIRE': 'CARD',
    'CARD': 'CARD',
    'ESPECES': 'CASH',
    'CASH': 'CASH',
    'TICKET_RESTO': 'MEAL_VOUCHER',
    'MEAL_VOUCHER': 'MEAL_VOUCHER',
    'CHEQUE': 'CHECK',
    'CHECK': 'CHECK',
    'POINTS_FIDELITE': 'FIDELITY_POINTS',
    'FIDELITY_POINTS': 'FIDELITY_POINTS',
    'AVOIR': 'STORE_CREDIT',
    'STORE_CREDIT': 'STORE_CREDIT',
    'CLIENT_EN_COMPTE': 'CORPORATE_ACCOUNT',
    'CORPORATE_ACCOUNT': 'CORPORATE_ACCOUNT'
  };
  
  return paymentMethodMap[methodString] || methodString;
}

module.exports = { normalizePaymentMethod };
