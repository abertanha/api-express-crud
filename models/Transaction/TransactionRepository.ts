import { BaseRepository } from '../../base/BaseRepository.ts';
import { ITransaction } from './ITransaction.ts';
import { TransactionRefs, TransactionSchema } from './Transaction.ts';
import { BankingDB } from '../../database/db/bankingDB.ts';
import { Model } from 'mongoose'

export class TransactionRepository extends BaseRepository<ITransaction> {
  constructor(
    model: Model<ITransaction> = BankingDB.model<ITransaction>(
      'Transaction',
      TransactionSchema,
    ),
  ){
    super(model, TransactionRefs)
  }
  async findByAccountId(
    accountId: string,
    options?: { limit?: number; skip?: number; sort?: any }
  ): Promise<ITransaction[]> {
    return await this.findMany(
      { accountId },
      {
        limit: options?.limit,
        skip: options?.skip,
        sort: options?.sort || { createdAt: -1 },
      }
    );
  }

  async findTransfersBetweenAccounts(
    accountId1: string,
    accountId2: string
  ): Promise<ITransaction[]> {
    return  await this.findMany({
      $or: [
        { accountId: accountId1, relatedAccountId: accountId2 },
        { accountId: accountId2, relatedAccountId: accountId1 },
      ],
      type: { $in: ['transfer_out', 'transfer_in'] },
    }, {
      sort: { createdAt: -1 },
    });
  }

  async findByAccountAndType(
    accountId: string,
    type: ITransaction['type']
  ): Promise<ITransaction[]> {
    return await this.findMany(
      { accountId, type },
      { sort: { createdAt: -1 } }
    );
  }

  async getTotalByType(
    accountId: string,
    type: ITransaction['type']
  ): Promise<number> {
    const transactions = await this.findByAccountAndType(accountId, type);
    return transactions.reduce((sum, transaction) => {
      const amount = transaction.amount.toString();
      return sum + parseFloat(amount);
    }, 0);
  }
}