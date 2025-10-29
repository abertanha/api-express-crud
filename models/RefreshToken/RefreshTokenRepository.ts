import { Model } from 'mongoose'
import { BaseRepository } from '../../base/BaseRepository.ts'
import { getBankingDB } from '../../database/db/bankingDB.ts'
import { IRefreshToken } from './IRefreshToken.ts'
import { RefreshTokenRefs, RefreshTokenSchema } from './RefreshToken.ts'

class RefreshTokenRepository extends BaseRepository<IRefreshToken> {
  constructor(
    model: Model<IRefreshToken> = getBankingDB().model<IRefreshToken>(
      'RefreshToken',
      RefreshTokenSchema,
    ),
  ) {
    super(model, RefreshTokenRefs)
  }

  async deleteExpiredTokens() {
    return await this.model.deleteMany({
      expiration: { $lt: new Date() }
    });
  }
  async deleteUserTokens(userId: string) {
    return await this.model.deleteMany({ userId });
  }
}

export { RefreshTokenRepository };