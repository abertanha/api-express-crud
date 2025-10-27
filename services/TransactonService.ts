import { TransactionRepository } from '../models/Transaction/TransactionRepository.ts';
import { throwlhos } from '../global/Throwlhos.ts';
import { TransactionType } from '../models/Transaction/ITransaction.ts';
import { Types } from 'mongoose';
import is from '@zarco/isness'

export interface CreateTransactionDTO {
  accountId: string;
  type: TransactionType;
  amount: number;
  description?: string;
  balanceBefore: number;
  balanceAfter: number;
  relatedAccountId?: string;
  relatedTransactionId?: string;
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

  constructor(transactionRepository: TransactionRepository = new TransactionRepository()) {
    this.transactionRepository = transactionRepository;
  }

  async createTransaction(data: CreateTransactionDTO): Promise<TransactionResponseDTO> {
    const transaction = await this.transactionRepository.createOne({
      accountId: new Types.ObjectId(data.accountId),
      type: data.type,
      amount: this.toDecimal128(data.amount),
      description: data.description,
      balanceBefore: this.toDecimal128(data.balanceBefore),
      balanceAfter: this.toDecimal128(data.balanceAfter),
      relatedAccountId: data.relatedAccountId 
        ? new Types.ObjectId(data.relatedAccountId) 
        : undefined,
      relatedTransactionId: data.relatedTransactionId
        ? new Types.ObjectId(data.relatedTransactionId)
        : undefined,
    });

    console.log(
      `[TransactionService] Transação registrada: ${data.type} - R$ ${data.amount.toFixed(2)}`
    );

    return this.sanitizeTransaction(transaction);
  }

  async findTransactionById(id: string): Promise<TransactionResponseDTO> {
    const transaction = await this.transactionRepository.findById(id);

    if (!transaction) {
      throw throwlhos.err_notFound('Transação não encontrada', { id });
    }

    return this.sanitizeTransaction(transaction);
  }

  async findTransactionsByAccountId(
    accountId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    transactions: TransactionResponseDTO[];
    total: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const transactions = await this.transactionRepository.findByAccountId(accountId, {
      limit,
      skip,
    });

    const total = await this.transactionRepository.countDocuments({ accountId });

    return {
      transactions: transactions.map((t) => this.sanitizeTransaction(t)),
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findTransactionsByType(
    accountId: string,
    type: TransactionType
  ): Promise<TransactionResponseDTO[]> {
    const transactions = await this.transactionRepository.findByAccountAndType(accountId, type);

    return transactions.map((t) => this.sanitizeTransaction(t));
  }

  async findTransfersBetweenAccounts(
    accountId1: string,
    accountId2: string
  ): Promise<TransactionResponseDTO[]> {
    const transactions = await this.transactionRepository.findTransfersBetweenAccounts(
      accountId1,
      accountId2
    );

    return transactions.map((t) => this.sanitizeTransaction(t));
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

  private sanitizeTransaction(transaction: any): TransactionResponseDTO {
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