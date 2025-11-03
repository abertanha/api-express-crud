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

  override findById(input: TransactionService.FindById.Input): Promise<TransactionService.FindById.Output> {
    if (this.shouldThrowError) {
      throw new Error("Mock error in findById");
    }
    return super.findById(input);
  }

  override findByAccountId(input: TransactionService.FindByAccountId.Input): Promise<TransactionService.FindByAccountId.Output> {
    if (this.shouldThrowError) {
      throw new Error("Mock error in findByAccountId");
    }
    return super.findByAccountId(input);
  }

  override findByAccountAndType(input: TransactionService.FindByAccountAndType.Input): Promise<TransactionService.FindByAccountAndType.Output> {
    if (this.shouldThrowError) {
      throw new Error("Mock error in findByAccountAndType");
    }
    return super.findByAccountAndType(input);
  }

  override findBetweenAccounts(input: TransactionService.FindBetweenAccounts.Input): Promise<TransactionService.FindBetweenAccounts.Output> {
    if (this.shouldThrowError) {
      throw new Error("Mock error in findBetweenAccounts");
    }
    return super.findBetweenAccounts(input);
  }

  override getAccountStats(input: TransactionService.GetAccountStats.Input): Promise<TransactionService.GetAccountStats.Output> {
    if (this.shouldThrowError) {
      throw new Error("Mock error in getAccountStats");
    }
    return super.getAccountStats(input);
  }
}