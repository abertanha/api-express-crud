import { Types } from 'mongoose';
import { IUser } from '../../../models/User/IUser.ts';
import { FilterQuery, QueryOptions, UpdateQuery } from 'mongoose';

export class MockUserRepository {
  public mockData: Array<Partial<IUser> & { _id: Types.ObjectId }> = [
    {
      _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
      name: 'João Silva',
      email: 'joao.silva@example.com',
      password: '$2a$10$hashed_password_mock_1',
      cpf: '06552942010',
      birthDate: new Date('1990-01-15'),
      isActive: true,
    },
    {
      _id: new Types.ObjectId('507f1f77bcf86cd799439012'),
      name: 'Maria Santos',
      email: 'maria.santos@example.com',
      password: '$2a$10$hashed_password_mock_2',
      cpf: '72023899087',
      birthDate: new Date('1985-05-20'),
      isActive: true,
    },
    {
      _id: new Types.ObjectId('507f1f77bcf86cd799439013'),
      name: 'Pedro Oliveira',
      email: 'pedro.oliveira@example.com',
      password: '$2a$10$hashed_password_mock_3',
      cpf: '42815967049',
      birthDate: new Date('1995-12-10'),
      isActive: false,
    },
  ];

  createOne(data: Partial<IUser>): Promise<IUser & { _id: Types.ObjectId }> {
    const newUser = {
      _id: new Types.ObjectId(),
      ...data,
    } as IUser & { _id: Types.ObjectId };
    
    this.mockData.push(newUser);
    return Promise.resolve(newUser);
  }

  create(data: Partial<IUser>[]): Promise<(IUser & { _id: Types.ObjectId })[]> {
    const newUsers = data.map(userData => ({
      _id: new Types.ObjectId(),
      ...userData,
    } as IUser & { _id: Types.ObjectId }));
    
    this.mockData.push(...newUsers);
    return Promise.resolve(newUsers);
  }

  createMany(data: Partial<IUser>[]): Promise<(IUser & { _id: Types.ObjectId })[]> {
    return this.create(data);
  }

  findById(id: string | Types.ObjectId, _options?: QueryOptions) {
    const idString = id.toString();
    
    return {
      select: (_fields?: any) => ({
        lean: () => ({
          exec: () => {
            const user = this.mockData.find((u) => u._id?.toString() === idString);
            return Promise.resolve(user || null);
          },
        }),
      }),
      lean: () => ({
        exec: () => {
          const user = this.mockData.find((u) => u._id?.toString() === idString);
          return Promise.resolve(user || null);
        },
      }),
      exec: () => {
        const user = this.mockData.find((u) => u._id?.toString() === idString);
        return Promise.resolve(user || null);
      },
    };
  }

  findOne(filter: FilterQuery<IUser>, _options?: QueryOptions) {
    return {
      select: (_fields?: any) => ({
        lean: () => ({
          exec: () => {
            const user = this.mockData.find((u) => {
              if (filter.email && u.email !== filter.email) return false;
              if (filter.cpf && u.cpf !== filter.cpf) return false;
              if (filter._id && u._id?.toString() !== filter._id.toString()) return false;
              if (filter.isActive !== undefined && u.isActive !== filter.isActive) return false;
              return true;
            });
            return Promise.resolve(user || null);
          },
        }),
      }),
      lean: () => ({
        exec: () => {
          const user = this.mockData.find((u) => {
            if (filter.email && u.email !== filter.email) return false;
            if (filter.cpf && u.cpf !== filter.cpf) return false;
            if (filter._id && u._id?.toString() !== filter._id.toString()) return false;
            if (filter.isActive !== undefined && u.isActive !== filter.isActive) return false;
            return true;
          });
          return Promise.resolve(user || null);
        },
      }),
      exec: () => {
        const user = this.mockData.find((u) => {
          if (filter.email && u.email !== filter.email) return false;
          if (filter.cpf && u.cpf !== filter.cpf) return false;
          if (filter._id && u._id?.toString() !== filter._id.toString()) return false;
          if (filter.isActive !== undefined && u.isActive !== filter.isActive) return false;
          return true;
        });
        return Promise.resolve(user || null);
      },
    };
  }

  findMany(filter: FilterQuery<IUser>, _options?: QueryOptions) {
    return {
      select: (_fields?: any) => ({
        lean: () => ({
          exec: () => {
            const users = this.mockData.filter((u) => {
              if (filter.email && u.email !== filter.email) return false;
              if (filter.cpf && u.cpf !== filter.cpf) return false;
              if (filter._id && u._id?.toString() !== filter._id.toString()) return false;
              if (filter.isActive !== undefined && u.isActive !== filter.isActive) return false;
              return true;
            });
            return Promise.resolve(users);
          },
        }),
      }),
      lean: () => ({
        exec: () => {
          const users = this.mockData.filter((u) => {
            if (filter.email && u.email !== filter.email) return false;
            if (filter.cpf && u.cpf !== filter.cpf) return false;
            if (filter._id && u._id?.toString() !== filter._id.toString()) return false;
            if (filter.isActive !== undefined && u.isActive !== filter.isActive) return false;
            return true;
          });
          return Promise.resolve(users);
        },
      }),
      exec: () => {
        const users = this.mockData.filter((u) => {
          if (filter.email && u.email !== filter.email) return false;
          if (filter.cpf && u.cpf !== filter.cpf) return false;
          if (filter._id && u._id?.toString() !== filter._id.toString()) return false;
          if (filter.isActive !== undefined && u.isActive !== filter.isActive) return false;
          return true;
        });
        return Promise.resolve(users);
      },
    };
  }

  updateOne(
    filter: FilterQuery<IUser>,
    update: UpdateQuery<IUser>,
    _options?: QueryOptions
  ): Promise<(IUser & { _id: Types.ObjectId }) | null> {
    const index = this.mockData.findIndex((u) => {
      if (filter._id && u._id?.toString() !== filter._id.toString()) return false;
      if (filter.email && u.email !== filter.email) return false;
      if (filter.cpf && u.cpf !== filter.cpf) return false;
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

    return Promise.resolve(this.mockData[index] as IUser & { _id: Types.ObjectId });
  }

  updateById(
    id: string | Types.ObjectId,
    update: UpdateQuery<IUser>,
    _options?: QueryOptions
  ): Promise<(IUser & { _id: Types.ObjectId }) | null> {
    return this.updateOne({ _id: id } as FilterQuery<IUser>, update, _options);
  }

  deleteOne(filter: FilterQuery<IUser>): Promise<(IUser & { _id: Types.ObjectId }) | null> {
    const index = this.mockData.findIndex((u) => {
      if (filter._id && u._id?.toString() !== filter._id.toString()) return false;
      if (filter.email && u.email !== filter.email) return false;
      if (filter.cpf && u.cpf !== filter.cpf) return false;
      return true;
    });

    if (index === -1) {
      return Promise.resolve(null);
    }

    const deletedUser = this.mockData.splice(index, 1)[0];
    return Promise.resolve(deletedUser as IUser & { _id: Types.ObjectId });
  }

  deleteById(id: string | Types.ObjectId): Promise<(IUser & { _id: Types.ObjectId }) | null> {
    return this.deleteOne({ _id: id } as FilterQuery<IUser>);
  }

  exists(filter: FilterQuery<IUser>): Promise<{ _id: Types.ObjectId } | null> {
    const user = this.mockData.find((u) => {
      if (filter.email && u.email !== filter.email) return false;
      if (filter.cpf && u.cpf !== filter.cpf) return false;
      if (filter._id && u._id?.toString() !== filter._id.toString()) return false;
      if (filter.isActive !== undefined && u.isActive !== filter.isActive) return false;
      return true;
    });

    return Promise.resolve(user ? { _id: user._id! } : null);
  }

  countDocuments(filter: FilterQuery<IUser>): Promise<number> {
    const count = this.mockData.filter((u) => {
      if (filter.email && u.email !== filter.email) return false;
      if (filter.cpf && u.cpf !== filter.cpf) return false;
      if (filter._id && u._id?.toString() !== filter._id.toString()) return false;
      if (filter.isActive !== undefined && u.isActive !== filter.isActive) return false;
      return true;
    }).length;

    return Promise.resolve(count);
  }

  findOneAndUpdate(
    query: FilterQuery<IUser>,
    update: UpdateQuery<IUser>,
    _options?: QueryOptions
  ): Promise<(IUser & { _id: Types.ObjectId }) | null> {
    return this.updateOne(query, update, _options);
  }

  findByIdAndUpdate(
    id: Types.ObjectId | string,
    update: UpdateQuery<IUser>,
    _options?: QueryOptions
  ): Promise<(IUser & { _id: Types.ObjectId }) | null> {
    return this.updateById(id, update, _options);
  }

  updateByIdWithSession(
    id: string | Types.ObjectId,
    update: UpdateQuery<IUser>,
    _session: any,
    _options?: QueryOptions
  ): Promise<(IUser & { _id: Types.ObjectId }) | null> {
    return this.updateById(id, update, _options);
  }

  updateMany(
    updateQuery: FilterQuery<IUser>,
    update: UpdateQuery<IUser>,
    _options?: QueryOptions
  ): Promise<{ modifiedCount: number }> {
    let modifiedCount = 0;
    const updateData = update.$set || update;

    this.mockData.forEach((user, index) => {
      let matches = true;
      if (updateQuery.email && user.email !== updateQuery.email) matches = false;
      if (updateQuery.cpf && user.cpf !== updateQuery.cpf) matches = false;
      if (updateQuery._id && user._id?.toString() !== updateQuery._id.toString()) matches = false;
      if (updateQuery.isActive !== undefined && user.isActive !== updateQuery.isActive) matches = false;

      if (matches) {
        this.mockData[index] = {
          ...user,
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
        _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
        name: 'João Silva',
        email: 'joao.silva@example.com',
        password: '$2a$10$hashed_password_mock_1',
        cpf: '06552942010',
        birthDate: new Date('1990-01-15'),
        isActive: true,
      },
      {
        _id: new Types.ObjectId('507f1f77bcf86cd799439012'),
        name: 'Maria Santos',
        email: 'maria.santos@example.com',
        password: '$2a$10$hashed_password_mock_2',
        cpf: '72023899087',
        birthDate: new Date('1985-05-20'),
        isActive: true,
      },
      {
        _id: new Types.ObjectId('507f1f77bcf86cd799439013'),
        name: 'Pedro Oliveira',
        email: 'pedro.oliveira@example.com',
        password: '$2a$10$hashed_password_mock_3',
        cpf: '42815967049',
        birthDate: new Date('1995-12-10'),
        isActive: false,
      },
    ];
  }
}
