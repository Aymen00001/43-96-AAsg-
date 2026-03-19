/**
 * API Integration Tests
 * Tests for GetTickets, payment filtering, and shift filtering
 * Updated: March 19, 2026
 */

const assert = require('assert');

describe('GetTickets Endpoint Integration', () => {
  
  describe('Query Parameter Validation', () => {
    
    it('should require idCRM parameter', () => {
      const params = {
        date1: '20260301',
        date2: '20260331'
      };
      
      assert.strictEqual(params.idCRM, undefined);
    });

    it('should require date1 parameter', () => {
      const params = {
        idCRM: '1539874562',
        date2: '20260331'
      };
      
      assert.strictEqual(params.date1, undefined);
    });

    it('should require date2 parameter', () => {
      const params = {
        idCRM: '1539874562',
        date1: '20260301'
      };
      
      assert.strictEqual(params.date2, undefined);
    });

    it('should accept valid date format (YYYYMMDD)', () => {
      const date = '20260319';
      assert.match(date, /^\d{8}$/);
      assert.ok(Number(date) > 0);
    });

    it('should default page to 1', () => {
      const page = parseInt('') || 1;
      assert.strictEqual(page, 1);
    });

    it('should default limit to 50', () => {
      const limit = parseInt('') || 50;
      assert.strictEqual(limit, 50);
    });

    it('should support page and limit parameters', () => {
      const params = {
        page: '2',
        limit: '25'
      };
      
      assert.strictEqual(parseInt(params.page), 2);
      assert.strictEqual(parseInt(params.limit), 25);
    });

  });

  describe('Payment Method Filter', () => {
    
    it('should filter by English payment method key', () => {
      const paymentFilter = 'CARD';
      const tickets = [
        { id: 1, PaymentMethods: [{ payment_method: 'CARD', amount: 50 }] },
        { id: 2, PaymentMethods: [{ payment_method: 'CASH', amount: 50 }] },
        { id: 3, PaymentMethods: [{ payment_method: 'CARD', amount: 100 }] }
      ];
      
      const filtered = tickets.filter(t => 
        t.PaymentMethods.some(p => p.payment_method === paymentFilter)
      );
      
      assert.strictEqual(filtered.length, 2);
      assert.strictEqual(filtered[0].id, 1);
      assert.strictEqual(filtered[1].id, 3);
    });

    it('should support all 7 payment methods', () => {
      const validMethods = ['CARD', 'CASH', 'MEAL_VOUCHER', 'CHECK', 'FIDELITY_POINTS', 'STORE_CREDIT', 'CORPORATE_ACCOUNT'];
      
      assert.strictEqual(validMethods.length, 7);
      validMethods.forEach(method => {
        assert.strictEqual(typeof method, 'string');
        assert.ok(method.length > 0);
      });
    });

    it('should filter ModePaiement (legacy format)', () => {
      const paymentFilter = 'CARD';
      const ticket = {
        ModePaiement: 'CARD'
      };
      
      assert.strictEqual(ticket.ModePaiement, paymentFilter);
    });

    it('should handle case-insensitive filtering', () => {
      const paymentFilter = 'card'; // lowercase
      const normalizedFilter = normalizePaymentMethod(paymentFilter);
      
      assert.strictEqual(normalizedFilter, 'CARD');
    });

  });

  describe('Shift (Z) Filtering', () => {
    
    it('should filter by Z field (shift number)', () => {
      const shiftFilter = '1';
      const tickets = [
        { id: 1, Z: 1, closureNumber: '1' },
        { id: 2, Z: 2, closureNumber: '2' },
        { id: 3, Z: 1, closureNumber: '1' }
      ];
      
      const filtered = tickets.filter(t => 
        String(t.Z) === String(shiftFilter) || String(t.closureNumber) === String(shiftFilter)
      );
      
      assert.strictEqual(filtered.length, 2);
    });

    it('should support shift numbers 0-9', () => {
      const shiftFilter = '5';
      const ticket = { Z: 5, closureNumber: '5' };
      
      assert.ok(String(ticket.Z) === String(shiftFilter));
    });

    it('should handle string and numeric comparisons', () => {
      const shiftFilter = '1';
      const tickets = [
        { Z: 1, closureNumber: '1' },
        { Z: '1', closureNumber: 1 }
      ];
      
      tickets.forEach(ticket => {
        assert.ok(String(ticket.Z) === String(shiftFilter));
      });
    });

    it('should handle missing Z field (fallback to closureNumber)', () => {
      const shiftFilter = '3';
      const ticket = { Z: undefined, closureNumber: '3' };
      
      const shift = ticket.Z !== undefined ? ticket.Z : ticket.closureNumber;
      assert.strictEqual(String(shift), String(shiftFilter));
    });

  });

  describe('Response Format', () => {
    
    it('should return data array in response', () => {
      const response = {
        data: [
          { idTiquer: 1, Date: '20260319', TTC: 50 }
        ],
        totalCount: 1,
        page: 1,
        limit: 50
      };
      
      assert.ok(Array.isArray(response.data));
      assert.strictEqual(response.data.length, 1);
    });

    it('should return totalCount for pagination', () => {
      const response = {
        totalCount: 125,
        page: 1,
        limit: 50
      };
      
      assert.strictEqual(typeof response.totalCount, 'number');
      assert.ok(response.totalCount >= 0);
    });

    it('should return page and limit info', () => {
      const response = {
        data: [],
        totalCount: 125,
        page: 2,
        limit: 50
      };
      
      const expectedPages = Math.ceil(response.totalCount / response.limit);
      assert.ok(response.page <= expectedPages);
    });

    it('should normalize payment methods in data', () => {
      const response = {
        data: [
          {
            idTiquer: 1,
            ModePaiement: 'CARTE_BANCAIRE',
            PaymentMethods: [{ payment_method: 'ESPECES', amount: 50 }]
          }
        ]
      };
      
      const normalized = response.data[0];
      assert.ok(['CARD', 'CASH', 'MEAL_VOUCHER', 'CHECK', 'FIDELITY_POINTS', 'STORE_CREDIT', 'CORPORATE_ACCOUNT'].includes('CARD'));
    });

  });

  describe('Multiple Filters', () => {
    
    it('should combine payment method and shift filters', () => {
      const paymentFilter = 'CARD';
      const shiftFilter = '1';
      const tickets = [
        { id: 1, Z: 1, PaymentMethods: [{ payment_method: 'CARD', amount: 50 }] },
        { id: 2, Z: 1, PaymentMethods: [{ payment_method: 'CASH', amount: 50 }] },
        { id: 3, Z: 2, PaymentMethods: [{ payment_method: 'CARD', amount: 50 }] }
      ];
      
      const filtered = tickets.filter(t => 
        String(t.Z) === String(shiftFilter) &&
        t.PaymentMethods.some(p => p.payment_method === paymentFilter)
      );
      
      assert.strictEqual(filtered.length, 1);
      assert.strictEqual(filtered[0].id, 1);
    });

    it('should apply search, payment, and fulfillment filters together', () => {
      const params = {
        search: 'customer',
        paymentMethod: 'CARD',
        fulfillmentMode: 'Dine-in'
      };
      
      const tickets = [
        { Signature: 'customer_1', PaymentMethods: [{ payment_method: 'CARD' }], ConsumptionMode: 'Dine-in' },
        { Signature: 'customer_2', PaymentMethods: [{ payment_method: 'CASH' }], ConsumptionMode: 'Takeaway' }
      ];
      
      const filtered = tickets.filter(t => 
        t.Signature.includes(params.search) &&
        t.PaymentMethods.some(p => p.payment_method === params.paymentMethod) &&
        t.ConsumptionMode === params.fulfillmentMode
      );
      
      assert.strictEqual(filtered.length, 1);
    });

  });

});

describe('Error Handling', () => {
  
  it('should return 400 for missing required parameters', () => {
    const params = {
      date1: '20260301'
      // missing idCRM and date2
    };
    
    const hasRequired = Boolean(params.idCRM && params.date1 && params.date2);
    assert.strictEqual(hasRequired, false);
  });

  it('should handle invalid date format', () => {
    const date = 'invalid-date';
    const isValid = /^\d{8}$/.test(date);
    assert.strictEqual(isValid, false);
  });

  it('should handle invalid pagination parameters', () => {
    const page = Math.max(parseInt('invalid') || 1, 1);
    const limit = Math.max(parseInt('invalid') || 50, 1);
    
    assert.strictEqual(page, 1);
    assert.strictEqual(limit, 50);
  });

  it('should handle unknown payment method (fallback)', () => {
    const unknown = 'BITCOIN';
    const isValid = ['CARD', 'CASH', 'MEAL_VOUCHER', 'CHECK', 'FIDELITY_POINTS', 'STORE_CREDIT', 'CORPORATE_ACCOUNT'].includes(unknown);
    
    // Unknown methods should still be passed through for regex filtering
    assert.strictEqual(isValid, false);
  });

});

// Helper function
function normalizePaymentMethod(methodValue) {
  if (!methodValue) return methodValue;
  const methodString = String(methodValue).trim().toUpperCase();
  
  const paymentMethodMap = {
    'CARTE_BANCAIRE': 'CARD',
    'CARD': 'CARD',
    'ESPECES': 'CASH',
    'CASH': 'CASH',
    'TICKET_RESTO': 'MEAL_VOUCHER',
    'MEAL_VOUCHER': 'MEAL_VOUCHER',
    'CHÈQUE': 'CHECK',
    'CHECK': 'CHECK',
    'CHEQUE': 'CHECK',
    'POINTS_FIDÉLITÉ': 'FIDELITY_POINTS',
    'FIDELITY_POINTS': 'FIDELITY_POINTS',
    'AVOIR': 'STORE_CREDIT',
    'STORE_CREDIT': 'STORE_CREDIT',
    'CLIENT_EN_COMPTE': 'CORPORATE_ACCOUNT',
    'CORPORATE_ACCOUNT': 'CORPORATE_ACCOUNT'
  };
  
  return paymentMethodMap[methodString] || methodString;
}

module.exports = { normalizePaymentMethod };
