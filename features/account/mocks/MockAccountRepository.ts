import { Types } from 'mongoose';
import { IAccount } from '../../../models/Account/IAccount.ts';
import { FilterQuery, QueryOptions, UpdateQuery } from 'mongoose';

export class MockAccountRepository {
  public mockData: Array<Partial<IAccount> & { _id: Types.ObjectId; accNumber: number }> = [
    {
      _id: new Types.ObjectId('607f1f77bcf86cd799439021'),
      accNumber: 1001,
      balance: Types.Decimal128.fromString('1000.00'),
      type: 'corrente',
      userId: new Types.ObjectId('507f1f77bcf86cd799439011'),
      isActive: true,
    },
    {
      _id: new Types.ObjectId('607f1f77bcf86cd799439022'),
      accNumber: 1002,
      balance: Types.Decimal128.fromString('5000.50'),
      type: 'poupança',
      userId: new Types.ObjectId('507f1f77bcf86cd799439012'),
      isActive: true,
    },
    {
      _id: new Types.ObjectId('607f1f77bcf86cd799439023'),
      accNumber: 1003,
      balance: Types.Decimal128.fromString('0.00'),
      type: 'corrente',
      userId: new Types.ObjectId('507f1f77bcf86cd799439013'),
      isActive: false,
    },
  ];

  public model = {
    findByIdAndUpdate: (
      id: string | Types.ObjectId,
      update: UpdateQuery<IAccount>,
      _options?: QueryOptions & { session?: any }
    ) => {
      const index = this.mockData.findIndex((a) => a._id?.toString() === id.toString());
      
      if (index === -1) {
        return Promise.resolve(null);
      }

      const updateData = update.$set || update;
      this.mockData[index] = {
        ...this.mockData[index],
        ...updateData,
      };

      return Promise.resolve(this.mockData[index]);
    }
  };

  createOne(data: Partial<IAccount>): Promise<IAccount & { _id: Types.ObjectId; accNumber: number }> {
    const newAccount = {
      _id: new Types.ObjectId(),
      accNumber: Math.max(...this.mockData.map(a => a.accNumber || 1000)) + 1,
      ...data,
    } as IAccount & { _id: Types.ObjectId; accNumber: number };
    
    this.mockData.push(newAccount);
    return Promise.resolve({
      ...newAccount,
      toObject: () => newAccount,
    } as any);
  }

  create(data: Partial<IAccount>[]): Promise<(IAccount & { _id: Types.ObjectId; accNumber: number })[]> {
    const newAccounts = data.map((accountData, index) => ({
      _id: new Types.ObjectId(),
      accNumber: Math.max(...this.mockData.map(a => a.accNumber || 1000)) + index + 1,
      ...accountData,
    } as IAccount & { _id: Types.ObjectId; accNumber: number }));
    
    this.mockData.push(...newAccounts);
    return Promise.resolve(newAccounts.map(acc => ({
      ...acc,
      toObject: () => acc,
    } as any)));
  }

  createMany(data: Partial<IAccount>[]): Promise<(IAccount & { _id: Types.ObjectId; accNumber: number })[]> {
    return this.create(data);
  }

  findById(id: string | Types.ObjectId, _options?: QueryOptions) {
    const idString = id.toString();
    const account = this.mockData.find((a) => a._id?.toString() === idString);
    return Promise.resolve(account ? {
      ...account,
      toObject: () => account,
    } as any : null);
  }

  findOne(filter: FilterQuery<IAccount>, _options?: QueryOptions) {
    return {
      lean: () => ({
        exec: () => {
          const account = this.mockData.find((a) => {
            if (filter.accNumber && a.accNumber !== filter.accNumber) return false;
            if (filter.userId && a.userId?.toString() !== filter.userId.toString()) return false;
            if (filter._id && a._id?.toString() !== filter._id.toString()) return false;
            if (filter.isActive !== undefined && a.isActive !== filter.isActive) return false;
            return true;
          });
          return Promise.resolve(account || null);
        },
      }),
      exec: () => {
        const account = this.mockData.find((a) => {
          if (filter.accNumber && a.accNumber !== filter.accNumber) return false;
          if (filter.userId && a.userId?.toString() !== filter.userId.toString()) return false;
          if (filter._id && a._id?.toString() !== filter._id.toString()) return false;
          if (filter.isActive !== undefined && a.isActive !== filter.isActive) return false;
          return true;
        });
        return Promise.resolve(account || null);
      },
    };
  }

  findMany(filter: FilterQuery<IAccount>, _options?: QueryOptions): Promise<any[]> {
    const accounts = this.mockData.filter((a) => {
      if (filter.accNumber && a.accNumber !== filter.accNumber) return false;
      if (filter.userId && a.userId?.toString() !== filter.userId.toString()) return false;
      if (filter._id && a._id?.toString() !== filter._id.toString()) return false;
      if (filter.isActive !== undefined && a.isActive !== filter.isActive) return false;
      return true;
    });
    
    return Promise.resolve(accounts.map(acc => ({
      ...acc,
      toObject: () => acc,
    })));
  }

  updateOne(
    filter: FilterQuery<IAccount>,
    update: UpdateQuery<IAccount>,
    _options?: QueryOptions
  ): Promise<(IAccount & { _id: Types.ObjectId; accNumber: number }) | null> {
    const index = this.mockData.findIndex((a) => {
      if (filter._id && a._id?.toString() !== filter._id.toString()) return false;
      if (filter.accNumber && a.accNumber !== filter.accNumber) return false;
      if (filter.userId && a.userId?.toString() !== filter.userId.toString()) return false;
      return true;
    });

    if (index === -1) {
      return Promise.resolve(null);
    }

    const updateData = update.$set || update;
    this.mockData[index] = {
      ...this.mockData[index],
      ...updateData,
    };

    return Promise.resolve({
      ...this.mockData[index],
      toObject: () => this.mockData[index],
    } as any);
  }

  updateById(
    id: string | Types.ObjectId,
    update: UpdateQuery<IAccount>,
    _options?: QueryOptions
  ): Promise<(IAccount & { _id: Types.ObjectId; accNumber: number }) | null> {
    return this.updateOne({ _id: id } as FilterQuery<IAccount>, update, _options);
  }

  deleteOne(filter: FilterQuery<IAccount>): Promise<(IAccount & { _id: Types.ObjectId; accNumber: number }) | null> {
    const index = this.mockData.findIndex((a) => {
      if (filter._id && a._id?.toString() !== filter._id.toString()) return false;
      if (filter.accNumber && a.accNumber !== filter.accNumber) return false;
      if (filter.userId && a.userId?.toString() !== filter.userId.toString()) return false;
      return true;
    });

    if (index === -1) {
      return Promise.resolve(null);
    }

    const deletedAccount = this.mockData.splice(index, 1)[0];
    return Promise.resolve(deletedAccount as IAccount & { _id: Types.ObjectId; accNumber: number });
  }

  deleteById(id: string | Types.ObjectId): Promise<(IAccount & { _id: Types.ObjectId; accNumber: number }) | null> {
    return this.deleteOne({ _id: id } as FilterQuery<IAccount>);
  }

  exists(filter: FilterQuery<IAccount>): Promise<{ _id: Types.ObjectId } | null> {
    const account = this.mockData.find((a) => {
      if (filter.accNumber && a.accNumber !== filter.accNumber) return false;
      if (filter.userId && a.userId?.toString() !== filter.userId.toString()) return false;
      if (filter._id && a._id?.toString() !== filter._id.toString()) return false;
      if (filter.isActive !== undefined && a.isActive !== filter.isActive) return false;
      return true;
    });

    return Promise.resolve(account ? { _id: account._id! } : null);
  }

  countDocuments(filter: FilterQuery<IAccount>): Promise<number> {
    const count = this.mockData.filter((a) => {
      if (filter.accNumber && a.accNumber !== filter.accNumber) return false;
      if (filter.userId && a.userId?.toString() !== filter.userId.toString()) return false;
      if (filter._id && a._id?.toString() !== filter._id.toString()) return false;
      if (filter.isActive !== undefined && a.isActive !== filter.isActive) return false;
      return true;
    }).length;

    return Promise.resolve(count);
  }

  findOneAndUpdate(
    query: FilterQuery<IAccount>,
    update: UpdateQuery<IAccount>,
    _options?: QueryOptions
  ): Promise<(IAccount & { _id: Types.ObjectId; accNumber: number }) | null> {
    return this.updateOne(query, update, _options);
  }

  findByIdAndUpdate(
    id: Types.ObjectId | string,
    update: UpdateQuery<IAccount>,
    _options?: QueryOptions
  ): Promise<(IAccount & { _id: Types.ObjectId; accNumber: number }) | null> {
    return this.updateById(id, update, _options);
  }

  updateByIdWithSession(
    id: string | Types.ObjectId,
    update: UpdateQuery<IAccount>,
    _session: any,
    _options?: QueryOptions
  ): Promise<(IAccount & { _id: Types.ObjectId; accNumber: number }) | null> {
    return this.updateById(id, update, _options);
  }

  updateMany(
    updateQuery: FilterQuery<IAccount>,
    update: UpdateQuery<IAccount>,
    _options?: QueryOptions
  ): Promise<{ modifiedCount: number }> {
    let modifiedCount = 0;
    const updateData = update.$set || update;

    this.mockData.forEach((account, index) => {
      let matches = true;
      if (updateQuery.accNumber && account.accNumber !== updateQuery.accNumber) matches = false;
      if (updateQuery.userId && account.userId?.toString() !== updateQuery.userId.toString()) matches = false;
      if (updateQuery._id && account._id?.toString() !== updateQuery._id.toString()) matches = false;
      if (updateQuery.isActive !== undefined && account.isActive !== updateQuery.isActive) matches = false;

      if (matches) {
        this.mockData[index] = {
          ...account,
          ...updateData,
        };
        modifiedCount++;
      }
    });

    return Promise.resolve({ modifiedCount });
  }

  aggregate(_pipeline: any[], _options?: any): Promise<any[]> {
    return Promise.resolve([]);
  }

  paginate(_aggregate: any[], _options?: any): Promise<any> {
    return Promise.resolve({
      docs: this.mockData,
      totalDocs: this.mockData.length,
      limit: 10,
      page: 1,
      totalPages: 1,
      nextPage: null,
      prevPage: null,
      pagingCounter: 1,
      hasPrevPage: false,
      hasNextPage: false,
    });
  }

  resetMockData() {
    this.mockData = [
      {
        _id: new Types.ObjectId('607f1f77bcf86cd799439021'),
        accNumber: 1001,
        balance: Types.Decimal128.fromString('1000.00'),
        type: 'corrente',
        userId: new Types.ObjectId('507f1f77bcf86cd799439011'),
        isActive: true,
      },
      {
        _id: new Types.ObjectId('607f1f77bcf86cd799439022'),
        accNumber: 1002,
        balance: Types.Decimal128.fromString('5000.50'),
        type: 'poupança',
        userId: new Types.ObjectId('507f1f77bcf86cd799439012'),
        isActive: true,
      },
      {
        _id: new Types.ObjectId('607f1f77bcf86cd799439023'),
        accNumber: 1003,
        balance: Types.Decimal128.fromString('0.00'),
        type: 'corrente',
        userId: new Types.ObjectId('507f1f77bcf86cd799439013'),
        isActive: false,
      },
    ];
  }
}
