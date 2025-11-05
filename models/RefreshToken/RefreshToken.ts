import { IRefreshToken } from './IRefreshToken.ts'
import { BaseSchema } from '../../base/BaseSchema.ts'
import { Schema } from 'mongoose'
import { Time } from '../../utilities/Time.ts'

export const RefreshTokenRefs = [];

export class RefreshToken implements IRefreshToken {
  userId: IRefreshToken['userId']
  expiration: IRefreshToken['expiration']
  lastActivityAt?: IRefreshToken['lastActivityAt']

  constructor(data: IRefreshToken) {
    this.userId = data.userId
    this.expiration = data.expiration
    this.lastActivityAt = data.lastActivityAt
  }

  get hasExpired(): boolean {
    return Time.now().toDate() > this.expiration;
  }
}

class RefreshTokenSchemaClass extends BaseSchema{
  constructor() {
    super({
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
      },
      expiration: {
        type: Date,
        required: true,
        index: true,
      },
      lastActivityAt: {
        type: Date,
        default: Date.now,
      },
    })
  }
}

const RefreshTokenSchema = new RefreshTokenSchemaClass().schema
RefreshTokenSchema.loadClass(RefreshToken);

RefreshTokenSchema.virtual('hasExpired').get(function(this: IRefreshToken) {
  return Time.now().toDate() > this.expiration
})

export { RefreshTokenSchema }