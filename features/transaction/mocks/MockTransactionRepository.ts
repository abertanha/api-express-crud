import type { ITransaction } from "../../../models/Transaction/ITransaction.ts";
import type { FilterQuery, QueryOptions, UpdateQuery } from "mongoose";
import { Types } from "mongoose";
import { Time } from '../../../utilities/Time.ts'

interface MockTransaction extends ITransaction {
  toObject?: () => ITransaction;
}

export class MockTransactionRepository {
  private mockData: MockTransaction[] = [
    {
      _id: new Types.ObjectId("607f1f4f5f1b2c0012345678"),
      accountId: new Types.ObjectId("607f191e5f1b2c9234567021"),
      type: "deposit",
      amount: new Types.Decimal128("100.00"),
      description: "Deposito inicial",
      balanceBefore: new Types.Decimal128("0.00"),
      balanceAfter: new Types.Decimal128("100.00"),
      createdAt: new Date("2023-01-01T10:00:00Z"),
      updatedAt: new Date("2023-01-01T10:00:00Z"),
      toObject: function() { return { ...this }; }
    },
    {
      _id: new Types.ObjectId("607f1f4f5f1b2c0012345679"),
      accountId: new Types.ObjectId("607f191e5f1b2c9234567021"),
      type: "withdraw", 
      amount: new Types.Decimal128("50.00"),
      description: "Saque ATM",
      balanceBefore: new Types.Decimal128("100.00"),
      balanceAfter: new Types.Decimal128("50.00"),
      createdAt: new Date("2023-01-02T14:30:00Z"),
      updatedAt: new Date("2023-01-02T14:30:00Z"),
      toObject: function() { return { ...this }; }
    },
    {
      _id: new Types.ObjectId("607f1f4f5f1b2c001234567a"),
      accountId: new Types.ObjectId("607f191e5f1b2c9234567021"),
      type: "transfer_out",
      amount: new Types.Decimal128("25.00"),
      description: "Transferencia para conta 022",
      balanceBefore: new Types.Decimal128("50.00"),
      balanceAfter: new Types.Decimal128("25.00"),
      relatedAccountId: new Types.ObjectId("607f191e5f1b2c9234567022"),
      relatedTransactionId: new Types.ObjectId("607f1f4f5f1b2c001234567b"),
      createdAt: new Date("2023-01-03T09:15:00Z"),
      updatedAt: new Date("2023-01-03T09:15:00Z"),
      toObject: function() { return { ...this }; }
    },
    {
      _id: new Types.ObjectId("607f1f4f5f1b2c001234567b"),
      accountId: new Types.ObjectId("607f191e5f1b2c9234567022"),
      type: "transfer_in",
      amount: new Types.Decimal128("25.00"),
      description: "Transferencia da conta 021",
      balanceBefore: new Types.Decimal128("500.00"),
      balanceAfter: new Types.Decimal128("525.00"),
      relatedAccountId: new Types.ObjectId("607f191e5f1b2c9234567021"),
      relatedTransactionId: new Types.ObjectId("607f1f4f5f1b2c001234567a"),
      createdAt: new Date("2023-01-03T09:15:00Z"),
      updatedAt: new Date("2023-01-03T09:15:00Z"),
      toObject: function() { return { ...this }; }
    },
    {
      _id: new Types.ObjectId("607f1f4f5f1b2c001234567c"),
      accountId: new Types.ObjectId("607f191e5f1b2c9234567022"),
      type: "initial_balance",
      amount: new Types.Decimal128("500.00"),
      description: "Saldo inicial da conta",
      balanceBefore: new Types.Decimal128("0.00"),
      balanceAfter: new Types.Decimal128("500.00"),
      createdAt: new Date("2023-01-01T08:00:00Z"),
      updatedAt: new Date("2023-01-01T08:00:00Z"),
      toObject: function() { return { ...this }; }
    }
  ];

  model = {
    create: (data: any, _session?: any) => {
      if (Array.isArray(data)) {
        const created = data.map(d => ({
          _id: new Types.ObjectId(),
          ...d,
          createdAt: Time.now().toDate(),
          updatedAt: Time.now().toDate(),
          toObject: function() { return { ...this }; }
        }));
        this.mockData.push(...created);
        return Promise.resolve(created);
      }
      
      // Criar único documento
      const created = {
        _id: new Types.ObjectId(),
        ...data,
        createdAt: Time.now().toDate(),
        updatedAt: Time.now().toDate(),
        toObject: function() { return { ...this }; }
      };
      this.mockData.push(created);
      return Promise.resolve(created);
    }
  };

  create(data: Partial<ITransaction>, session?: any): Promise<ITransaction> {
    return this.model.create(data, session);
  }

  findOne(filter: FilterQuery<ITransaction>, _options?: QueryOptions): Promise<ITransaction | null> {
    const transaction = this.mockData.find((t) => {
      if (filter._id) {
        const filterId = typeof filter._id === 'string' ? filter._id : filter._id.toString();
        if (t._id?.toString() !== filterId) return false;
      }
      if (filter.accountId) {
        const filterAccountId = typeof filter.accountId === 'string' ? filter.accountId : filter.accountId.toString();
        if (t.accountId?.toString() !== filterAccountId) return false;
      }
      return true;
    });

    return Promise.resolve(transaction ? { ...transaction, toObject: () => ({ ...transaction }) } : null);
  }

  findById(id: string): any {
  const objectId = new Types.ObjectId(id);
  const transaction = this.mockData.find((t) => t._id?.equals(objectId)) || null;
  
  return {
    lean: () => ({
      exec: () => {
        if (transaction) {
          return Promise.resolve({ ...transaction, toObject: () => ({ ...transaction }) });
        }
        return Promise.resolve(null);
      }
    })
  };
}

  updateOne(filter: FilterQuery<ITransaction>, update: UpdateQuery<ITransaction>): Promise<any> {
    const transactionIndex = this.mockData.findIndex((t) => {
      if (filter._id) {
        const filterId = typeof filter._id === 'string' ? filter._id : filter._id.toString();
        return t._id?.toString() === filterId;
      }
      return false;
    });

    if (transactionIndex !== -1) {
      this.mockData[transactionIndex] = { ...this.mockData[transactionIndex], ...update };
      return Promise.resolve({ modifiedCount: 1 });
    }
    return Promise.resolve({ modifiedCount: 0 });
  }

  async findOneAndUpdate(filter: FilterQuery<ITransaction>, update: UpdateQuery<ITransaction>): Promise<ITransaction | null> {
    await this.updateOne(filter, update);
    return this.findOne(filter);
  }

  deleteOne(filter: FilterQuery<ITransaction>): Promise<any> {
    const transactionIndex = this.mockData.findIndex((t) => {
      if (filter._id) {
        const filterId = typeof filter._id === 'string' ? filter._id : filter._id.toString();
        return t._id?.toString() === filterId;
      }
      return false;
    });

    if (transactionIndex !== -1) {
      this.mockData.splice(transactionIndex, 1);
      return Promise.resolve({ deletedCount: 1 });
    }
    return Promise.resolve({ deletedCount: 0 });
  }

  findMany(filter: FilterQuery<ITransaction>, options?: QueryOptions) {
    const filterTransactions = (transactions: MockTransaction[]) => {
      return transactions.filter((t) => {
        if (filter.accountId) {
          const filterAccountId = typeof filter.accountId === 'string' ? filter.accountId : filter.accountId.toString();
          if (t.accountId?.toString() !== filterAccountId) return false;
        }
        
        if (filter.type) {
          if (typeof filter.type === 'object' && filter.type.$in) {
            if (!filter.type.$in.includes(t.type)) return false;
          } else if (t.type !== filter.type) {
            return false;
          }
        }
        
        if (filter.relatedAccountId) {
          const filterRelatedId = typeof filter.relatedAccountId === 'string' ? filter.relatedAccountId : filter.relatedAccountId.toString();
          if (t.relatedAccountId?.toString() !== filterRelatedId) return false;
        }
        
        if (filter.$or) {
          return filter.$or.some((condition: FilterQuery<ITransaction>) => {
            let matches = true;
            if (condition.accountId) {
              const condAccountId = typeof condition.accountId === 'string' ? condition.accountId : condition.accountId.toString();
              if (t.accountId?.toString() !== condAccountId) matches = false;
            }
            if (condition.relatedAccountId) {
              const condRelatedId = typeof condition.relatedAccountId === 'string' ? condition.relatedAccountId : condition.relatedAccountId.toString();
              if (t.relatedAccountId?.toString() !== condRelatedId) matches = false;
            }
            return matches;
          });
        }
        
        return true;
      });
    };

    if (options) {
      const transactions = filterTransactions(this.mockData);
      
      if (options.sort) {
        const sortKey = Object.keys(options.sort)[0] as keyof ITransaction;
        const sortOrder = options.sort[sortKey] as number;
        
        transactions.sort((a, b) => {
          const aValue = a[sortKey] as any;
          const bValue = b[sortKey] as any;
          if (aValue < bValue) return -1 * sortOrder;
          if (aValue > bValue) return 1 * sortOrder;
          return 0;
        });
      }

      // Apply skip and limit
      let result = transactions;
      if (options.skip) {
        result = result.slice(options.skip);
      }
      if (options.limit) {
        result = result.slice(0, options.limit);
      }

      return Promise.resolve(result.map(t => ({ ...t, toObject: () => ({ ...t }) })) as ITransaction[]);
    }

    return {
      sort: (sortOptions: any) => ({
        skip: (skipCount: number) => ({
          limit: (limitCount: number) => ({
            lean: () => ({
              exec: () => {
                const transactions = filterTransactions(this.mockData);

                // Apply sorting
                if (sortOptions) {
                  const sortKey = Object.keys(sortOptions)[0] as keyof ITransaction;
                  const sortOrder = sortOptions[sortKey] as number;
                  
                  transactions.sort((a, b) => {
                    const aValue = a[sortKey] as any;
                    const bValue = b[sortKey] as any;
                    if (aValue < bValue) return -1 * sortOrder;
                    if (aValue > bValue) return 1 * sortOrder;
                    return 0;
                  });
                }
                const resultTransactions = transactions.slice(skipCount, skipCount + limitCount);
                
                return Promise.resolve(resultTransactions.map(t => ({ ...t, toObject: () => ({ ...t }) })) as ITransaction[]);
              }
            })
          })
        })
      }),
      exec: () => {
        const transactions = filterTransactions(this.mockData);
        return Promise.resolve(transactions.map(t => ({ ...t, toObject: () => ({ ...t }) })) as ITransaction[]);
      }
    };
  }

  findByAccountId(
    accountId: string,
    options?: { limit?: number; skip?: number; sort?: any }
  ): any {
    return this.findMany({ accountId }, {
      limit: options?.limit,
      skip: options?.skip,
      sort: options?.sort || { createdAt: -1 },
    });
  }

  findTransfersBetweenAccounts(
    accountId1: string,
    accountId2: string
  ): Promise<ITransaction[]> {
    const result = this.findMany({
      $or: [
        { accountId: accountId1, relatedAccountId: accountId2 },
        { accountId: accountId2, relatedAccountId: accountId1 },
      ],
      type: { $in: ['transfer_out', 'transfer_in'] },
    }, {
      sort: { createdAt: -1 },
    });
    return result as Promise<ITransaction[]>;
  }

  findByAccountAndType(
    accountId: string,
    type: ITransaction['type']
  ): Promise<ITransaction[]> {
    const result = this.findMany(
      { accountId, type },
      { sort: { createdAt: -1 } }
    );
    return result as Promise<ITransaction[]>;
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

  countDocuments(filter: FilterQuery<ITransaction>): Promise<number> {
    let count = 0;
    this.mockData.forEach((t) => {
      if (filter.accountId) {
        const filterAccountId = typeof filter.accountId === 'string' ? filter.accountId : filter.accountId.toString();
        if (t.accountId?.toString() === filterAccountId) count++;
      } else {
        count++;
      }
    });
    return Promise.resolve(count);
  }

  resetMockData(): void {
    this.mockData = [
      {
        _id: new Types.ObjectId("607f1f4f5f1b2c0012345678"),
        accountId: new Types.ObjectId("607f191e5f1b2c9234567021"),
        type: "deposit",
        amount: new Types.Decimal128("100.00"),
        description: "Deposito inicial",
        balanceBefore: new Types.Decimal128("0.00"),
        balanceAfter: new Types.Decimal128("100.00"),
        createdAt: new Date("2023-01-01T10:00:00Z"),
        updatedAt: new Date("2023-01-01T10:00:00Z"),
        toObject: function() { return { ...this }; }
      },
      {
        _id: new Types.ObjectId("607f1f4f5f1b2c0012345679"),
        accountId: new Types.ObjectId("607f191e5f1b2c9234567021"),
        type: "withdraw", 
        amount: new Types.Decimal128("50.00"),
        description: "Saque ATM",
        balanceBefore: new Types.Decimal128("100.00"),
        balanceAfter: new Types.Decimal128("50.00"),
        createdAt: new Date("2023-01-02T14:30:00Z"),
        updatedAt: new Date("2023-01-02T14:30:00Z"),
        toObject: function() { return { ...this }; }
      },
      {
        _id: new Types.ObjectId("607f1f4f5f1b2c001234567a"),
        accountId: new Types.ObjectId("607f191e5f1b2c9234567021"),
        type: "transfer_out",
        amount: new Types.Decimal128("25.00"),
        description: "Transferencia para conta 022",
        balanceBefore: new Types.Decimal128("50.00"),
        balanceAfter: new Types.Decimal128("25.00"),
        relatedAccountId: new Types.ObjectId("607f191e5f1b2c9234567022"),
        relatedTransactionId: new Types.ObjectId("607f1f4f5f1b2c001234567b"),
        createdAt: new Date("2023-01-03T09:15:00Z"),
        updatedAt: new Date("2023-01-03T09:15:00Z"),
        toObject: function() { return { ...this }; }
      },
      {
        _id: new Types.ObjectId("607f1f4f5f1b2c001234567b"),
        accountId: new Types.ObjectId("607f191e5f1b2c9234567022"),
        type: "transfer_in",
        amount: new Types.Decimal128("25.00"),
        description: "Transferencia da conta 021",
        balanceBefore: new Types.Decimal128("500.00"),
        balanceAfter: new Types.Decimal128("525.00"),
        relatedAccountId: new Types.ObjectId("607f191e5f1b2c9234567021"),
        relatedTransactionId: new Types.ObjectId("607f1f4f5f1b2c001234567a"),
        createdAt: new Date("2023-01-03T09:15:00Z"),
        updatedAt: new Date("2023-01-03T09:15:00Z"),
        toObject: function() { return { ...this }; }
      },
      {
        _id: new Types.ObjectId("607f1f4f5f1b2c001234567c"),
        accountId: new Types.ObjectId("607f191e5f1b2c9234567022"),
        type: "initial_balance",
        amount: new Types.Decimal128("500.00"),
        description: "Saldo inicial da conta",
        balanceBefore: new Types.Decimal128("0.00"),
        balanceAfter: new Types.Decimal128("500.00"),
        createdAt: new Date("2023-01-01T08:00:00Z"),
        updatedAt: new Date("2023-01-01T08:00:00Z"),
        toObject: function() { return { ...this }; }
      }
    ];
  }
}