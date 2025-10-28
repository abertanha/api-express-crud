import { TransactionRepository } from '../../models/Transaction/TransactionRepository.ts';
import { TransactionType } from '../../models/Transaction/ITransaction.ts';
import { Types } from 'mongoose';
import is from '@zarco/isness'
import { ClientSession } from 'mongoose'
import { Print } from '../../utilities/Print.ts'

export interface CreateTransactionDTO {
  accountId: string;
  type: TransactionType;
  amount: number;
  description?: string;
  balanceBefore?: number;
  balanceAfter?: number;
  relatedAccountId?: string;
  relatedTransactionId?: string;
  session?: ClientSession
}

export interface TransactionResponseDTO {
  _id?: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  description?: string;
  balanceBefore: number;
  balanceAfter: number;
  relatedAccountId?: string;
  relatedTransactionId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

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

  async create(data: CreateTransactionDTO): Promise<TransactionResponseDTO> {
    const transactionData = {
      accountId: new Types.ObjectId(data.accountId),
      type: data.type,
      amount: this.toDecimal128(data.amount),
      description: data.description,
      balanceBefore: data.balanceBefore !== undefined ? this.toDecimal128(data.balanceBefore) : undefined,
      balanceAfter: data.balanceAfter !== undefined ? this.toDecimal128(data.balanceAfter) : undefined,
      relatedAccountId: data.relatedAccountId 
        ? new Types.ObjectId(data.relatedAccountId) 
        : undefined,
      relatedTransactionId: data.relatedTransactionId
        ? new Types.ObjectId(data.relatedTransactionId)
        : undefined,
    };

    const transaction = data.session
      ? (await this.transactionRepository.model.create([transactionData],{ session: data.session }))[0]
      : await this.transactionRepository.model.create(transactionData);

    this.print.sucess(
      `Transação registrada: ${data.type} - R$ ${data.amount.toFixed(2)}`
    );

    return this.sanitize(transaction);
  }

  async findById(id: string) {
    return await this.transactionRepository
    .findById(id)
    .lean()
    .exec()
  }

  async findByAccountId(
    accountId: string,
    page: number = 1,
    limit: number = 20
  ) {
    const skip = (page - 1) * limit
  
    const query = { accountId }

    const transactions = await this.transactionRepository
      .findMany(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec()

    const total = await this.transactionRepository.countDocuments(query)

    return {
      docs: transactions,
      totalDocs: total,
      limit,
      page,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    }
  }

  async findByAccountAndType(
    accountId: string,
    type: TransactionType
  ): Promise<TransactionResponseDTO[]> {
    const transactions = await this.transactionRepository.findByAccountAndType(accountId, type);

    return transactions.map((t) => this.sanitize(t));
  }

  async findBetweenAccounts(
    accountId1: string,
    accountId2: string
  ): Promise<TransactionResponseDTO[]> {
    const transactions = await this.transactionRepository.findTransfersBetweenAccounts(
      accountId1,
      accountId2
    );

    return transactions.map((t) => this.sanitize(t));
  }


  async getTotalByType(accountId: string, type: TransactionType): Promise<number> {
    return await this.transactionRepository.getTotalByType(accountId, type);
  }

  async getAccountStats(accountId: string): Promise<{
    totalDeposits: number;
    totalWithdrawals: number;
    totalTransfersOut: number;
    totalTransfersIn: number;
    transactionCount: number;
  }> {
    const [totalDeposits, totalWithdrawals, totalTransfersOut, totalTransfersIn, transactionCount] =
      await Promise.all([
        this.getTotalByType(accountId, 'deposit'),
        this.getTotalByType(accountId, 'withdraw'),
        this.getTotalByType(accountId, 'transfer_out'),
        this.getTotalByType(accountId, 'transfer_in'),
        this.transactionRepository.countDocuments({ accountId }),
      ]);

    return {
      totalDeposits,
      totalWithdrawals,
      totalTransfersOut,
      totalTransfersIn,
      transactionCount,
    };
  }

  private sanitize(transaction: any): TransactionResponseDTO {
    const transactionObj = transaction.toObject ? transaction.toObject() : transaction;

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
    };
  }

  private parseDecimal(value: any): number {
    if (is.number(value)) return value;
    if (value && value.toString) {
      return parseFloat(value.toString());
    }
    return 0;
  }

  private toDecimal128(value: number): Types.Decimal128 {
    return Types.Decimal128.fromString(value.toString());
  }
}