import { IBaseInterface } from '../../base/IBaseInterface.ts';
import { Types } from 'mongoose';

export interface IAccount extends IBaseInterface {
  accNumber?: number;
  balance: Types.Decimal128;
  type: string;
  userId: Types.ObjectId;
  isActive?: boolean;
}