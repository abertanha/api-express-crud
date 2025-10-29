import { Types } from 'mongoose'
import { IBaseInterface } from '../../base/IBaseInterface.ts'

export interface IRefreshToken extends IBaseInterface {
  userId: Types.ObjectId;
  expiration: Date;
  lastActivityAt?: Date
  hasExpired?: boolean
};
