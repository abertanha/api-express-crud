import { BaseRepository } from '../../base/BaseRepository.ts';
import { UserSchema } from './User.ts';
import { IUser } from './IUser.ts';
import { Model } from 'mongoose';
import { BankingDB } from '../../database/db/bankingDB.ts';

class UserRepository extends BaseRepository<IUser> {
	constructor(
		model: Model<IUser> = BankingDB.model<IUser>(
			'User',
			UserSchema,
		),
	) {
		super(model);
	}
}

export { UserRepository };
