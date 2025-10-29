import { Schema } from 'mongoose';
import { ITransaction } from './ITransaction.ts';
import { BaseSchema } from '../../base/BaseSchema.ts';

export const TransactionRefs = [
  {
    ref: 'accountId',
    select: ['accNumber', 'balance', 'type', 'userId']
  },
  {
    ref: 'relatedAccountId',
    select: ['accNumber', 'type']
  }
];

class TransactionClass implements ITransaction {
  accountId: ITransaction['accountId'];
  type: ITransaction['type'];
  amount: ITransaction['amount'];
  description?: ITransaction['description'];
  balanceBefore: ITransaction['balanceBefore'];
  balanceAfter: ITransaction['balanceAfter'];
  relatedAccountId?: ITransaction['relatedAccountId'];
  relatedTransactionId?: ITransaction['relatedTransactionId'];

  constructor(data: ITransaction) {
    this.accountId = data.accountId;
    this.type = data.type;
    this.amount = data.amount;
    this.description = data.description;
    this.balanceBefore = data.balanceBefore;
    this.balanceAfter = data.balanceAfter;
    this.relatedAccountId = data.relatedAccountId;
    this.relatedTransactionId = data.relatedTransactionId;
  }
}

class TransactionSchemaClass extends BaseSchema {
  constructor() {
    super({
      accountId: {
        type: Schema.Types.ObjectId,
        ref: 'Account',
        required: [true, 'A transação precisa estar vinculada a uma conta'],
        index: true,
      },
      type: {
        type: String,
        enum: {
          values: ['deposit', 'withdraw', 'transfer_out', 'transfer_in', 'initial_balance'],
          message: '{VALUE} não é um tipo válido de transação.',
        },
        required: [true, 'O tipo de transação é obrigatório'],
        index: true,
      },
      amount: {
        type: Schema.Types.Decimal128,
        required: [true, 'O valor da transação é obrigatório'],
        get: (value: any) => {
          if (value != null) return parseFloat(value.toString());
          return value;
        },
      },
      description: {
        type: String,
        maxlength: [200, 'A descrição não pode ter mais de 200 caracteres'],
      },
      balanceBefore: {
        type: Schema.Types.Decimal128,
        required: [true, 'O saldo anterior é obrigatório'],
        get: (value: any) => {
          if (value != null) return parseFloat(value.toString());
          return value;
        },
      },
      balanceAfter: {
        type: Schema.Types.Decimal128,
        required: [true, 'O saldo posterior é obrigatório'],
        get: (value: any) => {
          if (value != null) return parseFloat(value.toString());
          return value;
        },
      },
      relatedAccountId: {
        type: Schema.Types.ObjectId,
        ref: 'Account',
        index: true,
      },
      relatedTransactionId: {
        type: Schema.Types.ObjectId,
        ref: 'Transaction',
        index: true,
      },
    }, {
      toJSON: { getters: true },
      toObject: { getters: true },
    });
  }
}

const TransactionSchema = new TransactionSchemaClass().schema;
TransactionSchema.loadClass(TransactionClass);

TransactionSchema.index({ accountId: 1, createdAt: -1 });
TransactionSchema.index({ accountId: 1, type: 1 });
TransactionSchema.index({ relatedAccountId: 1, createdAt: -1 });

export { TransactionSchema };