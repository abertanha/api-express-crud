import { Schema } from 'mongoose'
import { IAccount } from './IAccount.ts'
import { BaseSchema } from '../../base/BaseSchema.ts'
import { getNextAccountNumber } from '../shared/counterSchema.ts'
import { Print } from '../../utilities/Print.ts'

const print = new Print();

class AccountClass implements IAccount {
  accNumber: IAccount['accNumber'];
  balance: IAccount['balance'];
  type: IAccount['type'];
  userId: IAccount['userId'];
  isActive?: IAccount['isActive'];

  constructor(data: IAccount) {
    this.accNumber = data.accNumber;
    this.balance = data.balance;
    this.type = data.type;
    this.userId = data.userId;
    this.isActive = data.isActive ?? true;
  }
}

class AccountSchemaClass extends BaseSchema {
  constructor(){
    super({
      accNumber: { type: Number, unique: true, index: true },
      balance: {
        type: Schema.Types.Decimal128,
        default:0,
        get: (value: any) => {
          if(value != null) return parseFloat(value.toString());
          return value;
        },
      },
      type: {
        type: String,
        enum:{ 
          values: ['poupança' ,'corrente'],
          message: '{VALUE} não é um tipo válido de conta. Use poupança ou corrente.'
        },
        default: 'checking',
        required: [true, 'O tipo da conta é obrigatório.'],
      },
      userId : {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: [true, 'A conta precisa ter um proprietário'],
        index: true
      },
      isActive: {
        type: Boolean,
        default: true,
        index: true,
      }
    }, {
      toJSON: { getters: true },
      toObject: { getters: true },
    })
  }
}

const AccountSchema = new AccountSchemaClass().schema;
AccountSchema.loadClass(AccountClass);

AccountSchema.index({ userId: 1, isActive: 1 });
AccountSchema.index({ type: 1, isActive: 1 });


AccountSchema.pre('save', async function (next) {
  if (this.isNew && !this.accNumber) {
    try {
      this.accNumber = await getNextAccountNumber();
      print.sucess(`No. da conta gerado: ${this.accNumber}`);
      next();
    } catch (error: unknown) {
      print.error('Erro ao gerar no. de conta');
      next(error as Error);
    }
  } else {
    next();
  }
});


export { AccountSchema };