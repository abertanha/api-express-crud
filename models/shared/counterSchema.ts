import { Schema } from 'mongoose'
import { BankingDB } from '../../database/db/bankingDB.ts'
import { throwlhos } from '../../global/Throwlhos.ts'
import { ICounter } from './ICounter.ts'

const counterSchema = new Schema<ICounter>({
  _id: {
    type: String,
    required: true
  },
  sequenceValue: {
    type: Number,
    default: 1000000
  },
},{
  _id: false,
  timestamps: true,
});

export async function getNextAccountNumber(): Promise<number> {
  const Counter = BankingDB.model<ICounter>('Counter', counterSchema);

  const counter = await Counter.findByIdAndUpdate(
    'accNumber',
    { $inc: { sequenceValue: 1 } },
    {
      new: true,
      upsert: true
    }
  );

  if (!counter) {
    throw throwlhos.err_notFound('Falha ao gerar o número da conta');
  }

  return counter.sequenceValue;
  
}