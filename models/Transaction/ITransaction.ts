import { Types } from 'mongoose';
import { IBaseInterface } from '../../base/IBaseInterface.ts';

export type TransactionType = 
  | 'deposit'           
  | 'withdraw'          
  | 'transfer_out'      
  | 'transfer_in'       
  | 'initial_balance';  

export interface ITransaction extends IBaseInterface {
  accountId: Types.ObjectId;          
  type: TransactionType;               
  amount: Types.Decimal128;            
  description?: string;                
  balanceBefore: Types.Decimal128;     
  balanceAfter: Types.Decimal128;      
  relatedAccountId?: Types.ObjectId;   
  relatedTransactionId?: Types.ObjectId;
}