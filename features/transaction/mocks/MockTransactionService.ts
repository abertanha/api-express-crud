import { TransactionService } from '../TransactonService.ts';
import { MockTransactionRepository } from './MockTransactionRepository.ts';
import { TransactionRepository } from '../../../models/Transaction/TransactionRepository.ts';
import { Print } from '../../../utilities/Print.ts';

export class MockPrint extends Print {
  override sucess(_message: string) {}
  override error(_message: string, _error?: any) {}
  override info(_message: string, _data?: any) {}
}

export class MockTransactionService extends TransactionService {
  shouldThrowError = false;

  constructor() {
    super(
      new MockTransactionRepository() as unknown as TransactionRepository,
      new MockPrint()
    );
  }

  override async findById(id: string) {
    if (this.shouldThrowError) {
      throw new Error("Mock error in findById");
    }
    return super.findById(id);
  }

  override async findByAccountId(accountId: string, page: number, limit: number) {
    if (this.shouldThrowError) {
      throw new Error("Mock error in findByAccountId");
    }
    return super.findByAccountId(accountId, page, limit);
  }

  override async findByAccountAndType(accountId: string, type: any) {
    if (this.shouldThrowError) {
      throw new Error("Mock error in findByAccountAndType");
    }
    return super.findByAccountAndType(accountId, type);
  }

  override async findBetweenAccounts(accountId1: string, accountId2: string) {
    if (this.shouldThrowError) {
      throw new Error("Mock error in findBetweenAccounts");
    }
    return super.findBetweenAccounts(accountId1, accountId2);
  }

  override async getAccountStats(accountId: string) {
    if (this.shouldThrowError) {
      throw new Error("Mock error in getAccountStats");
    }
    return super.getAccountStats(accountId);
  }
}