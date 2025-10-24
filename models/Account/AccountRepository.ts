import { Model } from 'mongoose'
import { BaseRepository } from '../../base/BaseRepository.ts'
import { IAccount } from './IAccount.ts'
import { getBankingDB } from '../../database/db/bankingDB.ts'
import { AccountSchema } from './Account.ts'
import { UserRefs } from '../User/User.ts'

class AccountRepository extends BaseRepository<IAccount> {
  constructor(
    model: Model<IAccount> = getBankingDB().model<IAccount>(
      'accounts',
      AccountSchema,
    ),
  ) {
    super(model, UserRefs);
  }
}

export { AccountRepository }; 