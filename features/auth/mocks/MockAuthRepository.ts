import { Types } from 'mongoose';
import { IRefreshToken } from '../../../models/RefreshToken/IRefreshToken.ts';
import { FilterQuery, QueryOptions, UpdateQuery } from 'mongoose';

export class MockAuthRepository {
  public mockData: Array<Partial<IRefreshToken> & { _id: Types.ObjectId }> = [
    {
      _id: new Types.ObjectId('608f1f77bcf86cd799439011'),
      userId: new Types.ObjectId('507f1f77bcf86cd799439011'),
      expiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      lastActivityAt: new Date(),
      hasExpired: false,
    },
    {
      _id: new Types.ObjectId('608f1f77bcf86cd799439012'),
      userId: new Types.ObjectId('507f1f77bcf86cd799439012'),
      expiration: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      lastActivityAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      hasExpired: false,
    },
    {
      _id: new Types.ObjectId('608f1f77bcf86cd799439013'),
      userId: new Types.ObjectId('507f1f77bcf86cd799439013'),
      expiration: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      lastActivityAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      hasExpired: true,
    },
  ];

  createOne(data: Partial<IRefreshToken>): Promise<IRefreshToken & { _id: Types.ObjectId }> {
    const newToken = {
      _id: new Types.ObjectId(),
      hasExpired: false,
      ...data,
    } as IRefreshToken & { _id: Types.ObjectId };
    
    this.mockData.push(newToken);
    return Promise.resolve(newToken);
  }

  create(data: Partial<IRefreshToken>[]): Promise<(IRefreshToken & { _id: Types.ObjectId })[]> {
    const newTokens = data.map(tokenData => ({
      _id: new Types.ObjectId(),
      hasExpired: false,
      ...tokenData,
    } as IRefreshToken & { _id: Types.ObjectId }));
    
    this.mockData.push(...newTokens);
    return Promise.resolve(newTokens);
  }

  createMany(data: Partial<IRefreshToken>[]): Promise<(IRefreshToken & { _id: Types.ObjectId })[]> {
    return this.create(data);
  }

  findById(id: string | Types.ObjectId, _options?: QueryOptions) {
    const idString = id.toString();
    
    return {
      select: (_fields?: any) => ({
        lean: () => ({
          exec: () => {
            const token = this.mockData.find((t) => t._id?.toString() === idString);
            return Promise.resolve(token || null);
          },
        }),
      }),
      lean: () => ({
        exec: () => {
          const token = this.mockData.find((t) => t._id?.toString() === idString);
          return Promise.resolve(token || null);
        },
      }),
      exec: () => {
        const token = this.mockData.find((t) => t._id?.toString() === idString);
        return Promise.resolve(token || null);
      },
    };
  }

  findOne(filter: FilterQuery<IRefreshToken>, _options?: QueryOptions) {
    return {
      select: (_fields?: any) => ({
        lean: () => ({
          exec: () => {
            const token = this.mockData.find((t) => {
              if (filter.userId && t.userId?.toString() !== filter.userId.toString()) return false;
              if (filter._id && t._id?.toString() !== filter._id.toString()) return false;
              if (filter.hasExpired !== undefined && t.hasExpired !== filter.hasExpired) return false;
              return true;
            });
            return Promise.resolve(token || null);
          },
        }),
      }),
      lean: () => ({
        exec: () => {
          const token = this.mockData.find((t) => {
            if (filter.userId && t.userId?.toString() !== filter.userId.toString()) return false;
            if (filter._id && t._id?.toString() !== filter._id.toString()) return false;
            if (filter.hasExpired !== undefined && t.hasExpired !== filter.hasExpired) return false;
            return true;
          });
          return Promise.resolve(token || null);
        },
      }),
      exec: () => {
        const token = this.mockData.find((t) => {
          if (filter.userId && t.userId?.toString() !== filter.userId.toString()) return false;
          if (filter._id && t._id?.toString() !== filter._id.toString()) return false;
          if (filter.hasExpired !== undefined && t.hasExpired !== filter.hasExpired) return false;
          return true;
        });
        return Promise.resolve(token || null);
      },
    };
  }

  findMany(filter: FilterQuery<IRefreshToken>, _options?: QueryOptions) {
    return {
      select: (_fields?: any) => ({
        lean: () => ({
          exec: () => {
            const tokens = this.mockData.filter((t) => {
              if (filter.userId && t.userId?.toString() !== filter.userId.toString()) return false;
              if (filter._id && t._id?.toString() !== filter._id.toString()) return false;
              if (filter.hasExpired !== undefined && t.hasExpired !== filter.hasExpired) return false;
              return true;
            });
            return Promise.resolve(tokens);
          },
        }),
      }),
      lean: () => ({
        exec: () => {
          const tokens = this.mockData.filter((t) => {
            if (filter.userId && t.userId?.toString() !== filter.userId.toString()) return false;
            if (filter._id && t._id?.toString() !== filter._id.toString()) return false;
            if (filter.hasExpired !== undefined && t.hasExpired !== filter.hasExpired) return false;
            return true;
          });
          return Promise.resolve(tokens);
        },
      }),
      exec: () => {
        const tokens = this.mockData.filter((t) => {
          if (filter.userId && t.userId?.toString() !== filter.userId.toString()) return false;
          if (filter._id && t._id?.toString() !== filter._id.toString()) return false;
          if (filter.hasExpired !== undefined && t.hasExpired !== filter.hasExpired) return false;
          return true;
        });
        return Promise.resolve(tokens);
      },
    };
  }

  updateOne(
    filter: FilterQuery<IRefreshToken>,
    update: UpdateQuery<IRefreshToken>,
    _options?: QueryOptions
  ): Promise<(IRefreshToken & { _id: Types.ObjectId }) | null> {
    const index = this.mockData.findIndex((t) => {
      if (filter._id && t._id?.toString() !== filter._id.toString()) return false;
      if (filter.userId && t.userId?.toString() !== filter.userId.toString()) return false;
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

    return Promise.resolve(this.mockData[index] as IRefreshToken & { _id: Types.ObjectId });
  }

  updateById(
    id: string | Types.ObjectId,
    update: UpdateQuery<IRefreshToken>,
    _options?: QueryOptions
  ): Promise<(IRefreshToken & { _id: Types.ObjectId }) | null> {
    return this.updateOne({ _id: id } as FilterQuery<IRefreshToken>, update, _options);
  }

  deleteOne(filter: FilterQuery<IRefreshToken>): Promise<(IRefreshToken & { _id: Types.ObjectId }) | null> {
    const index = this.mockData.findIndex((t) => {
      if (filter._id && t._id?.toString() !== filter._id.toString()) return false;
      if (filter.userId && t.userId?.toString() !== filter.userId.toString()) return false;
      return true;
    });

    if (index === -1) {
      return Promise.resolve(null);
    }

    const deletedToken = this.mockData.splice(index, 1)[0];
    return Promise.resolve(deletedToken as IRefreshToken & { _id: Types.ObjectId });
  }

  deleteById(id: string | Types.ObjectId): Promise<(IRefreshToken & { _id: Types.ObjectId }) | null> {
    return this.deleteOne({ _id: id } as FilterQuery<IRefreshToken>);
  }

  exists(filter: FilterQuery<IRefreshToken>): Promise<{ _id: Types.ObjectId } | null> {
    const token = this.mockData.find((t) => {
      if (filter.userId && t.userId?.toString() !== filter.userId.toString()) return false;
      if (filter._id && t._id?.toString() !== filter._id.toString()) return false;
      if (filter.hasExpired !== undefined && t.hasExpired !== filter.hasExpired) return false;
      return true;
    });

    return Promise.resolve(token ? { _id: token._id! } : null);
  }

  countDocuments(filter: FilterQuery<IRefreshToken>): Promise<number> {
    const count = this.mockData.filter((t) => {
      if (filter.userId && t.userId?.toString() !== filter.userId.toString()) return false;
      if (filter._id && t._id?.toString() !== filter._id.toString()) return false;
      if (filter.hasExpired !== undefined && t.hasExpired !== filter.hasExpired) return false;
      return true;
    }).length;

    return Promise.resolve(count);
  }

  findOneAndUpdate(
    query: FilterQuery<IRefreshToken>,
    update: UpdateQuery<IRefreshToken>,
    _options?: QueryOptions
  ): Promise<(IRefreshToken & { _id: Types.ObjectId }) | null> {
    return this.updateOne(query, update, _options);
  }

  findByIdAndUpdate(
    id: Types.ObjectId | string,
    update: UpdateQuery<IRefreshToken>,
    _options?: QueryOptions
  ): Promise<(IRefreshToken & { _id: Types.ObjectId }) | null> {
    return this.updateById(id, update, _options);
  }

  updateByIdWithSession(
    id: string | Types.ObjectId,
    update: UpdateQuery<IRefreshToken>,
    _session: any,
    _options?: QueryOptions
  ): Promise<(IRefreshToken & { _id: Types.ObjectId }) | null> {
    return this.updateById(id, update, _options);
  }

  updateMany(
    updateQuery: FilterQuery<IRefreshToken>,
    update: UpdateQuery<IRefreshToken>,
    _options?: QueryOptions
  ): Promise<{ modifiedCount: number }> {
    let modifiedCount = 0;
    const updateData = update.$set || update;

    this.mockData.forEach((token, index) => {
      let matches = true;
      if (updateQuery.userId && token.userId?.toString() !== updateQuery.userId.toString()) matches = false;
      if (updateQuery._id && token._id?.toString() !== updateQuery._id.toString()) matches = false;
      if (updateQuery.hasExpired !== undefined && token.hasExpired !== updateQuery.hasExpired) matches = false;

      if (matches) {
        this.mockData[index] = {
          ...token,
          ...updateData,
        };
        modifiedCount++;
      }
    });

    return Promise.resolve({ modifiedCount });
  }


  deleteExpiredTokens(): Promise<{ deletedCount: number }> {
    const initialLength = this.mockData.length;
    this.mockData = this.mockData.filter((token) => {
      const now = new Date();
      return token.expiration && token.expiration > now;
    });
    const deletedCount = initialLength - this.mockData.length;
    return Promise.resolve({ deletedCount });
  }

  deleteUserTokens(userId: string): Promise<{ deletedCount: number }> {
    const initialLength = this.mockData.length;
    this.mockData = this.mockData.filter((token) => {
      return token.userId?.toString() !== userId.toString();
    });
    const deletedCount = initialLength - this.mockData.length;
    return Promise.resolve({ deletedCount });
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
        _id: new Types.ObjectId('608f1f77bcf86cd799439011'),
        userId: new Types.ObjectId('507f1f77bcf86cd799439011'),
        expiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        lastActivityAt: new Date(),
        hasExpired: false,
      },
      {
        _id: new Types.ObjectId('608f1f77bcf86cd799439012'),
        userId: new Types.ObjectId('507f1f77bcf86cd799439012'),
        expiration: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        lastActivityAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        hasExpired: false,
      },
      {
        _id: new Types.ObjectId('608f1f77bcf86cd799439013'),
        userId: new Types.ObjectId('507f1f77bcf86cd799439013'),
        expiration: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        lastActivityAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        hasExpired: true,
      },
    ];
  }
}
