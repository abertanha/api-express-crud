import { TransactionRepository } from '../../models/Transaction/TransactionRepository.ts';
import { TransactionType } from '../../models/Transaction/ITransaction.ts';
import { Types } from 'mongoose';
import is from '@zarco/isness'
import { ClientSession } from 'mongoose'
import { Print } from '../../utilities/Print.ts'

export namespace TransactionService {
  export type TTransactionSanitized = {
    _id?: string
    accountId: string
    type: TransactionType
    amount: number
    description?: string
    balanceBefore: number
    balanceAfter: number
    relatedAccountId?: string
    relatedTransactionId?: string
    createdAt?: Date
    updatedAt?: Date
  }

  export type TPaginatedTransactions = {
    docs: TTransactionSanitized[]
    totalDocs: number
    limit: number
    page: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }

  export type TAccountStats = {
    totalDeposits: number
    totalWithdrawals: number
    totalTransfersOut: number
    totalTransfersIn: number
    transactionCount: number
  }

  export namespace Create {
    export type Input = {
      accountId: string
      type: TransactionType
      amount: number
      description?: string
      balanceBefore?: number
      balanceAfter?: number
      relatedAccountId?: string
      relatedTransactionId?: string
      session?: ClientSession
    }

    export type Output = TTransactionSanitized
  }

  export namespace FindById {
    export type Input = {
      id: string
    }

    export type Output = TTransactionSanitized | null
  }

  export namespace FindByAccountId {
    export type Input = {
      accountId: string
      page?: number
      limit?: number
    }

    export type Output = TPaginatedTransactions
  }

  export namespace FindByAccountAndType {
    export type Input = {
      accountId: string
      type: TransactionType
    }

    export type Output = TTransactionSanitized[]
  }

  export namespace FindBetweenAccounts {
    export type Input = {
      accountId1: string
      accountId2: string
    }

    export type Output = TTransactionSanitized[]
  }

  export namespace GetTotalByType {
    export type Input = {
      accountId: string
      type: TransactionType
    }

    export type Output = number
  }

  export namespace GetAccountStats {
    export type Input = {
      accountId: string
    }

    export type Output = TAccountStats
  }
}

// export interface CreateTransactionDTO {
//   accountId: string;
//   type: TransactionType;
//   amount: number;
//   description?: string;
//   balanceBefore?: number;
//   balanceAfter?: number;
//   relatedAccountId?: string;
//   relatedTransactionId?: string;
//   session?: ClientSession
// }

// export interface TransactionResponseDTO {
//   _id?: string;
//   accountId: string;
//   type: TransactionType;
//   amount: number;
//   description?: string;
//   balanceBefore: number;
//   balanceAfter: number;
//   relatedAccountId?: string;
//   relatedTransactionId?: string;
//   createdAt?: Date;
//   updatedAt?: Date;
// }

export class TransactionService {
  private readonly transactionRepository: TransactionRepository;
  private readonly print: Print;

  constructor(
    transactionRepository: TransactionRepository = new TransactionRepository(),
    print: Print = new Print()
  ) {
    this.print = print;
    this.transactionRepository = transactionRepository;
  }

  async create(input: TransactionService.Create.Input): Promise<TransactionService.Create.Output> {
    const transactionData = {
      accountId: new Types.ObjectId(input.accountId),
      type: input.type,
      amount: this.toDecimal128(input.amount),
      description: input.description,
      balanceBefore: input.balanceBefore !== undefined
        ? this.toDecimal128(input.balanceBefore)
        : undefined,
      balanceAfter: input.balanceAfter !== undefined 
        ? this.toDecimal128(input.balanceAfter)
        : undefined,
      relatedAccountId: input.relatedAccountId 
        ? new Types.ObjectId(input.relatedAccountId) 
        : undefined,
      relatedTransactionId: input.relatedTransactionId
        ? new Types.ObjectId(input.relatedTransactionId)
        : undefined,
    };

    const transaction = input.session
      ? (await this.transactionRepository.model.create([transactionData],{ session: input.session }))[0]
      : await this.transactionRepository.model.create(transactionData);

    this.print.sucess(
      `Transação registrada: ${input.type} - R$ ${input.amount.toFixed(2)}`
    );

    return this.sanitize(transaction);
  }

  async findById(input: TransactionService.FindById.Input): Promise<TransactionService.FindById.Output> {
    const transaction = await this.transactionRepository
    .findById(input.id)
    .lean()
    .exec()
    
    return this.sanitize(transaction)
  }

  async findByAccountId(input: TransactionService.FindByAccountId.Input): Promise<TransactionService.FindByAccountId.Output> {
    const page = input.page || 1
    const limit = input.limit || 20
    const skip = (page - 1) * limit
  
    const query = { accountId: new Types.ObjectId(input.accountId) }

    const transactions = await this.transactionRepository
      .findMany(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec()

    const total = await this.transactionRepository.countDocuments(query)

    return {
      docs: transactions.map(t => this.sanitize(t)),
      totalDocs: total,
      limit,
      page,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    }
  }

  async findByAccountAndType(input: TransactionService.FindByAccountAndType.Input): Promise<TransactionService.FindByAccountAndType.Output> {
    const transactions = await this.transactionRepository.findByAccountAndType(
      input.accountId,
      input.type
    )

    return transactions.map((t) => this.sanitize(t));
  }

 async findBetweenAccounts(input: TransactionService.FindBetweenAccounts.Input): Promise<TransactionService.FindBetweenAccounts.Output> {
    const transactions = await this.transactionRepository.findTransfersBetweenAccounts(
      input.accountId1,
      input.accountId2
    )

    return transactions.map((t) => this.sanitize(t))
  }


  async getTotalByType(input: TransactionService.GetTotalByType.Input): Promise<TransactionService.GetTotalByType.Output> {
    return await this.transactionRepository.getTotalByType(input.accountId, input.type)
  }

  async getAccountStats(input: TransactionService.GetAccountStats.Input): Promise<TransactionService.GetAccountStats.Output> {
    const [totalDeposits, totalWithdrawals, totalTransfersOut, totalTransfersIn, transactionCount] =
      await Promise.all([
        this.getTotalByType({ accountId: input.accountId, type: 'deposit' }),
        this.getTotalByType({ accountId: input.accountId, type: 'withdraw' }),
        this.getTotalByType({ accountId: input.accountId, type: 'transfer_out' }),
        this.getTotalByType({ accountId: input.accountId, type: 'transfer_in' }),
        this.transactionRepository.countDocuments({ accountId: new Types.ObjectId(input.accountId) }),
      ])

    return {
      totalDeposits,
      totalWithdrawals,
      totalTransfersOut,
      totalTransfersIn,
      transactionCount,
    }
  }

  private sanitize(transaction: any): TransactionService.TTransactionSanitized {
    const transactionObj = transaction.toObject ? transaction.toObject() : transaction

    return {
      _id: transactionObj._id?.toString(),
      accountId: transactionObj.accountId.toString(),
      type: transactionObj.type,
      amount: this.parseDecimal(transactionObj.amount),
      description: transactionObj.description,
      balanceBefore: this.parseDecimal(transactionObj.balanceBefore),
      balanceAfter: this.parseDecimal(transactionObj.balanceAfter),
      relatedAccountId: transactionObj.relatedAccountId?.toString(),
      relatedTransactionId: transactionObj.relatedTransactionId?.toString(),
      createdAt: transactionObj.createdAt,
      updatedAt: transactionObj.updatedAt,
    }
  }

  private parseDecimal(value: any): number {
    if (is.number(value)) return value
    if (value && value.toString) {
      return parseFloat(value.toString())
    }
    return 0
  }

  private toDecimal128(value: number): Types.Decimal128 {
    return Types.Decimal128.fromString(value.toString());
  }
}