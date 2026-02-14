const PaystackAPI = require('paystack-api');
const crypto = require('crypto');

class PaystackService {
  constructor() {
    this.secretKey = process.env.PAYSTACK_SECRET_KEY;
    this.publicKey = process.env.PAYSTACK_PUBLIC_KEY;
    
    if (!this.secretKey) {
      console.warn('⚠️  PAYSTACK_SECRET_KEY not set. Payment features will not work.');
      return;
    }
    
    this.paystack = PaystackAPI(this.secretKey);
    console.log('✅ Paystack service initialized');
  }

  /**
   * Initialize a payment transaction
   */
  async initializePayment({ email, amount, reference, metadata = {}, callback_url }) {
    try {
      if (!this.paystack) {
        throw new Error('Paystack not configured. Please set PAYSTACK_SECRET_KEY in environment variables.');
      }

      const response = await this.paystack.transaction.initialize({
        email,
        amount: Math.round(amount * 100), // Convert to pesewas (smallest currency unit)
        reference,
        callback_url: callback_url || process.env.PAYSTACK_CALLBACK_URL,
        metadata,
        channels: ['card', 'mobile_money', 'bank_transfer'] // All Ghana payment methods
      });

      if (response.status && response.data) {
        console.log('✅ Payment initialized:', reference);
        return {
          success: true,
          data: response.data
        };
      }

      return {
        success: false,
        error: 'Payment initialization failed'
      };

    } catch (error) {
      console.error('❌ Payment initialization failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verify a payment transaction
   */
  async verifyPayment(reference) {
    try {
      if (!this.paystack) {
        throw new Error('Paystack not configured');
      }

      const response = await this.paystack.transaction.verify(reference);

      if (response.status && response.data) {
        console.log('✅ Payment verified:', reference, '- Status:', response.data.status);
        return {
          success: true,
          data: response.data
        };
      }

      return {
        success: false,
        error: 'Payment verification failed'
      };

    } catch (error) {
      console.error('❌ Payment verification failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate unique payment reference
   */
  generateReference(prefix = 'KUDI') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Verify webhook signature from Paystack
   */
  verifyWebhookSignature(payload, signature) {
    try {
      if (!this.secretKey) {
        return false;
      }

      const hash = crypto
        .createHmac('sha512', this.secretKey)
        .update(JSON.stringify(payload))
        .digest('hex');
      
      return hash === signature;
    } catch (error) {
      console.error('❌ Webhook signature verification failed:', error.message);
      return false;
    }
  }
}

module.exports = new PaystackService();
