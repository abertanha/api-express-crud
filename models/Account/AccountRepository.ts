import { Model } from 'mongoose';
import { BaseRepository } from '../../base/BaseRepository.ts';
import { IAccount } from './IAccount.ts';
import { getBankingDB } from '../../database/db/bankingDB.ts';
import { AccountRefs, AccountSchema } from './Account.ts';

class AccountRepository extends BaseRepository<IAccount> {
  constructor(
    model: Model<IAccount> = getBankingDB().model<IAccount>(
      'Account',
      AccountSchema,
    ),
  ) {
    super(model, AccountRefs);
  }
}

export { AccountRepository }; 