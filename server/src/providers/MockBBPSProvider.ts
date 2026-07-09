import { v4 as uuidv4 } from 'uuid';

export class MockBBPSProvider {
  async fetchBill(billerId: string, consumerNumber: string) {
    // Mock network delay
    await new Promise(res => setTimeout(res, 1000));
    
    // 5% chance of failure
    if (Math.random() > 0.95) {
      throw new Error('PROVIDER_ERROR: Unable to fetch bill at this time');
    }

    return {
      billId: `BILL_${Math.floor(Math.random() * 100000)}`,
      billerId,
      consumerNumber,
      amount: Math.floor(Math.random() * 1500) + 200,
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      customerName: 'Sakhi User',
      status: 'UNPAID'
    };
  }

  async payBill(billId: string, amount: number, paymentMode: string) {
    // Mock processing delay
    await new Promise(res => setTimeout(res, 1500));

    const rand = Math.random();
    
    // Simulate Timeout (2% chance)
    if (rand < 0.02) {
      throw new Error('PROVIDER_TIMEOUT');
    }
    
    // Simulate Failure (5% chance)
    if (rand < 0.07) {
      return {
        transactionId: uuidv4(),
        referenceId: `REF_${Math.floor(Math.random() * 1000000)}`,
        status: 'FAILED',
        message: 'Bank declined transaction'
      };
    }

    // Success
    return {
      transactionId: uuidv4(),
      referenceId: `REF_${Math.floor(Math.random() * 1000000)}`,
      status: 'SUCCESS',
      message: 'Payment processed successfully'
    };
  }
}
