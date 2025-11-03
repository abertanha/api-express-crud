import { AccountRepository } from '../../models/Account/AccountRepository.ts';
import { throwlhos } from '../../globals/Throwlhos.ts';
import { IAccount } from '../../models/Account/IAccount.ts';
import { UserService } from '../user/UserService.ts';
import { Types } from 'mongoose';
import is from '@zarco/isness';
import { TransactionService } from '../transaction/TransactonService.ts'
import { Print } from '../../utilities/Print.ts'
import { startBankingSession } from '../../database/db/bankingDB.ts'

export namespace AccountService {
  export type TAccountSanitized = {
    _id:string
    accNumber: number
    balance: number
    type: "poupança" | "corrente"
    userId: {
      _id: string
      name: string
      email: string
      cpf: string
    } | string
    isActive: boolean
    createdAt?: Date
    updatedAt?: Date
  }

  export type TAccountWithTransaction = {
    account: TAccountSanitized
    transaction: any
  }
  export type TTransferResult = {
    fromAccount: TAccountSanitized
    toAccount: TAccountSanitized
    transactions: {
      transferOut: any
      transferIn: any
    }
  }
  export namespace Create {
    export type Input = {
      balance?: number
      type: 'poupança' | 'corrente'
      userId: string
    }

    export type Output = TAccountSanitized
  }

  export namespace FindById {
    export type Input = { 
      id: string
    }

    export type Output = TAccountSanitized
  }

  export namespace FindAll {
    export type Input = {
      page?: number
      limit?: number
      includeInactive?: boolean
    }

    export type Output = { 
      docs: TAccountSanitized[]
      totalDocs: number
      limit: number
      page: number
      totalPages: number
      hasNextPage: boolean
      hasPrevPage: boolean
    }
  }

  export namespace FindByUserId {
    export type Input = {
      userId: string
      includeInactive?: boolean
    }

    export type Output = TAccountSanitized[]
  }
  export namespace Update {
    export type Input = { 
      id: string
      data: Partial<Pick<IAccount, 'balance' | 'type'>>
    }

    export type Output = TAccountSanitized
  }
  export namespace Deposit {
    export type Input = { 
      accountId: string
      amount: number
      description?: string
    }

    export type Output = TAccountWithTransaction
  }

  export namespace Withdraw {
    export type Input = {
      accountId: string
      amount: number
      description?: string
    }

    export type Output = TAccountWithTransaction
  }

  export namespace Transfer {
    export type Input = {
      fromAccountId: string
      toAccountId: string
      amount: number
      description?: string
    }

    export type Output = TTransferResult
  }
  export namespace GetBalance {
    export type Input = {
      accountId: string
    }

    export type Output = number
  }

  export namespace UserHasBalance {
    export type Input = {
      userId: string
    }

    export type Output = boolean
  }

  export namespace GetUserTotalBalance {
    export type Input = {
      userId: string
    }

    export type Output = number
  }

  export namespace Deactivate {
    export type Input = {
      accountId: string
      force?: boolean
    }

    export type Output = void
  }

  export namespace Reactivate {
    export type Input = {
      accountId: string
    }

    export type Output = TAccountSanitized
  }
}

// export interface CreateAccountDTO {
//   balance?: number;
//   type: 'poupança' | 'corrente';
//   userId: string;
// };

// export interface AccountResponseDTO {
//   _id?: string;
//   accNumber: number;
//   balance: number;
//   type: 'poupança' | 'corrente';
//   userId: {
//     _id: string;
//     name: string;
//     email:string;
//     cpf: string;
//   } | string;
//   isActive: boolean;
//   createdAt?: Date;
//   updatedAt?: Date;
// };

// export interface TransactionDTO {
//   accountId: string;
//   amount: number;
//   type: 'credit' | 'debit' | 'transfer';
//   description?: string;
// };

// export interface TransferDTO {
//   fromAccountId: string;
//   toAccountId: string;
//   amount: number;
//   description?: string;
// };

export class AccountService {
  private readonly accountRepository: AccountRepository;
  private readonly transactionService: TransactionService;
  private readonly userService: UserService;
  private readonly print: Print;

  constructor(
    accountRepository: AccountRepository = new AccountRepository(),
    transactionService: TransactionService = new TransactionService(),
    print: Print = new Print(),
    userService: UserService = new UserService()
  ){
    this.print = print;
    this.accountRepository = accountRepository;
    this.transactionService = transactionService;
    this.userService = userService; 
  }
  // crud
  async create(input: AccountService.Create.Input): Promise<AccountService.Create.Output>{
    const userExists = await this.userService.findById({id: input.userId.toString() });
    if (!userExists) throw throwlhos.err_notFound('Usuário não encontrado'); 

    const isUserActivate = userExists.isActive;
    if (!isUserActivate) throw throwlhos.err_badRequest(`Usuário ${userExists.name} está bloqueado.`);

    const initialBalance = input.balance || 0;

    const accountCreated = await this.accountRepository.createOne({
      balance: this.toDecimal128(initialBalance),
      type: input.type,
      userId: new Types.ObjectId(input.userId),
      isActive: true
    });

    
    if (initialBalance > 0) {
      await this.transactionService.create({
        accountId: accountCreated._id.toString(),
        type: 'deposit',
        amount: initialBalance,
        description: 'Depósito inicial',
        balanceBefore: 0,
        balanceAfter: initialBalance,
      });
    }

    return this.sanitize(accountCreated);
  }

  async findById(input: AccountService.FindById.Input): Promise<AccountService.FindById.Output> {
    const account = await this.accountRepository.findById(input.id);

    if(!account) throw throwlhos.err_notFound('Conta não encontrada', { id: input.id });

    return this.sanitize(account);
  }
  async findAll (input: AccountService.FindAll.Input): Promise<AccountService.FindAll.Output> {
    const page = input.page || 1
    const limit = input.limit || 10
    const includeInactive = input.includeInactive || false
    
    const $match: any = {};
    if (!includeInactive) {
      $match.isActive = true
    }

    const aggregate = [
      { $match },
      {
        $project: {
          accNumber: 1,
          balance: 1,
          type: 1,
          userId: 1,
          isActive: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]

    const result = await this.accountRepository.paginate(aggregate, {
      paginate: { page, limit },
    });

    return {
      docs: result.docs.map(doc => this.sanitize(doc)),
      totalDocs: result.totalDocs ?? 0,
      limit: result.limit ?? limit,
      page: result.page ?? page,
      totalPages: result.totalPages ?? 0,
      hasNextPage: result.hasNextPage ?? false,
      hasPrevPage: result.hasPrevPage ?? false,
    };
  }

  async findByUserId(input:AccountService.FindByUserId.Input): Promise<AccountService.FindByUserId.Output> {
    const query: any = { userId: new Types.ObjectId(input.userId) };
    if (!input.includeInactive) query.isActive = true;

    const accounts = await this.accountRepository.findMany(query);
    return accounts.map((a) => this.sanitize(a));    
  }

  async update(input: AccountService.Update.Input): Promise<AccountService.Update.Output> {
    await this.findById({ id: input.id });

    const updatedAccount = await this.accountRepository.updateById(input.id, input.data);

    return this.sanitize(updatedAccount!);
  }

  // operações financeiras

  async deposit(input: AccountService.Deposit.Input): Promise<AccountService.Deposit.Output> {
    const description = input.description || 'Depósito'
    const account = await this.findById({id: input.accountId});
    if (!account.isActive) {
      throw throwlhos.err_badRequest('Não é possível depositar em conta desativada', { accountId: input.accountId });
    }

    const currentBalance = this.parseBalance(account.balance);
    const newBalance = currentBalance + input.amount;

    const updatedAccount = await this.accountRepository.updateById(input.accountId, {
      balance: this.toDecimal128(newBalance),
    });

    
    const transaction = await this.transactionService.create({
      accountId: input.accountId,
      type: 'deposit',
      amount: input.amount,
      description,
      balanceBefore: currentBalance,
      balanceAfter: newBalance
    });

    this.print.sucess(` Depósito realizado: R$ ${input.amount.toFixed(2)} na conta ${account.accNumber}`);

    return {
      account: this.sanitize(updatedAccount!),
      transaction
    };
  }

   async withdraw(input: AccountService.Withdraw.Input): Promise<AccountService.Withdraw.Output> {
    const description = input.description || 'Saque'
    await this.isAccountActive(input.accountId);
    const account = await this.accountRepository.findById(input.accountId);

    const currentBalance = this.parseBalance(account!.balance);

    if (currentBalance < input.amount) {
      throw throwlhos.err_badRequest('Saldo insuficiente', {
        accountId: input.accountId,
        currentBalance,
        requestedAmount: input.amount,
      });
    }
    const newBalance = currentBalance - input.amount;

    const updatedAccount = await this.accountRepository.updateById(input.accountId, {
      balance: this.toDecimal128(newBalance),
    });

    const transaction = await this.transactionService.create({
      accountId: input.accountId,
      type: 'withdraw',
      amount: input.amount,
      description,
      balanceBefore: currentBalance,
      balanceAfter: newBalance
    });

    return {
      account: this.sanitize(updatedAccount!),
      transaction
    };
  }

  async transfer(input: AccountService.Transfer.Input): Promise<AccountService.Transfer.Output> {
    const description = input.description || "Transferência"
    
    const [fromAccount, toAccount] = await Promise.all([
      this.accountRepository.findById(input.fromAccountId),
      this.accountRepository.findById(input.toAccountId),
    ]);

    if (!fromAccount) {
      throw throwlhos.err_notFound('Conta de origem não encontrada', { fromAccountId: input.fromAccountId });
    }

    if (!toAccount) {
      throw throwlhos.err_notFound('Conta de destino não encontrada', { toAccountId: input.toAccountId });
    }

    await this.isAccountActive(fromAccount._id.toString());
    await this.isAccountActive(toAccount._id.toString());

    const fromBalance = this.parseBalance(fromAccount.balance);
    if (fromBalance < input.amount) {
      throw throwlhos.err_badRequest('Saldo insuficiente na conta de origem', {
        fromAccountId: input.fromAccountId,
        currentBalance: fromBalance,
        requestedAmount: input.amount,
      });
    }

    const newFromBalance = fromBalance - input.amount;
    const toBalance = this.parseBalance(toAccount.balance);
    const newToBalance = toBalance + input.amount;

    let session: any = null;
    let updatedFromAccount;
    let updatedToAccount;
    let transferOutTransaction;
    let transferInTransaction;
    
    try {
      session = await startBankingSession();
      session.startTransaction();
      
      updatedFromAccount = await this.accountRepository.model.findByIdAndUpdate(
        input.fromAccountId,
        { balance: this.toDecimal128(newFromBalance) },
        { new: true, session }
      );

      if (!updatedFromAccount) {
        throw new Error('Falha ao atualizar conta de origem');
      }

      updatedToAccount = await this.accountRepository.model.findByIdAndUpdate(
        input.toAccountId,
        { balance: this.toDecimal128(newToBalance) },
        { new: true, session }
      );

      if (!updatedToAccount) {
        throw new Error('Falha ao atualizar conta de destino');
      }
      
      transferOutTransaction = await this.transactionService.create({
        accountId: input.fromAccountId,
        type: 'transfer_out',
        amount: input.amount,
        description: `${description} para conta ${toAccount.accNumber}`,
        relatedAccountId: input.toAccountId,
        balanceBefore: fromBalance,
        balanceAfter: newFromBalance,
        session,
      });

      transferInTransaction = await this.transactionService.create({
        accountId: input.toAccountId,
        type: 'transfer_in',
        amount: input.amount,
        description: `${description} da conta ${fromAccount.accNumber}`,
        relatedAccountId: input.fromAccountId,
        balanceBefore: toBalance,
        balanceAfter: newToBalance,
        session,
      });
      
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }

    return {
      fromAccount: this.sanitize(updatedFromAccount!),
      toAccount: this.sanitize(updatedToAccount!),
      transactions: {
        transferOut: transferOutTransaction,
        transferIn: transferInTransaction,
      },
    };
  }

  async getBalance(input: AccountService.GetBalance.Input): Promise<AccountService.GetBalance.Output> {
    const account = await this.accountRepository.findById(input.accountId);

    if (!account) {
      throw throwlhos.err_notFound('Conta não encontrada', { accountId: input.accountId });
    }

    return this.parseBalance(account.balance);
  }

  async userHasBalance(input: AccountService.UserHasBalance.Input): Promise<AccountService.UserHasBalance.Output> {
    const accounts = await this.accountRepository.findMany({
      userId: new Types.ObjectId(input.userId),
      isActive: true,
    });

    const totalBalance = accounts.reduce((sum, account) => {
      return sum + this.parseBalance(account.balance);
    }, 0);

    return totalBalance > 0;
  }
  async getUserTotalBalance(input: AccountService.GetUserTotalBalance.Input): Promise<AccountService.GetUserTotalBalance.Output> {
    const user = await this.userService.findById({id: input.userId});
  
    if (!user) {
      throw throwlhos.err_notFound('Usuário não encontrado', { userId: input.userId });
    }
    
    const accounts = await this.accountRepository.findMany({
      userId: new Types.ObjectId(input.userId),
      isActive: true,
    });

    return accounts.reduce((sum, account) => {
      return sum + this.parseBalance(account.balance);
    }, 0);
  }

  async deactivate(input: AccountService.Deactivate.Input): Promise<AccountService.Deactivate.Output> {
    const force = input.force || false
    const account = await this.findById({id: input.accountId});

    await this.isAccountActive(account._id!.toString());

    if (!force) {
      const balance = this.parseBalance(account.balance);
      if (balance > 0) {
        throw throwlhos.err_badRequest(
          'Não é possível desativar conta com saldo. Esvazie a conta primeiro ou use force=true',
          { accountId: input.accountId, balance }
        );
      }
    }

    await this.accountRepository.updateById(input.accountId, { isActive: false });

    this.print.sucess(` Conta ${account.accNumber} desativada`);
  }

  async reactivate(input: AccountService.Reactivate.Input): Promise<AccountService.Reactivate.Output> {
    const account = await this.findById({id: input.accountId});

    if (account.isActive) {
      throw throwlhos.err_badRequest('Conta já está ativa', { accountId: input.accountId });
    }

    const user = await this.userService.findById({id: account.userId.toString()});
    if (!user.isActive) {
      throw throwlhos.err_badRequest('Não é possível reativar conta de usuário desativado', {
        accountId: input.accountId,
        userId: user._id,
      });
    }

    const reactivatedAccount = await this.accountRepository.updateById(account._id, { isActive: true });

    this.print.sucess(`Conta ${account.accNumber} reativada`);

    return this.sanitize(reactivatedAccount!);
  }
  private sanitize(account: any): AccountService.TAccountSanitized {
    const accountObj = account.toObject ? account.toObject() : account;

    return {
      _id: accountObj._id.toString(),
      accNumber: accountObj.accNumber,
      balance: this.parseBalance(accountObj.balance),
      type: accountObj.type,
      userId: accountObj.userId,
      isActive: accountObj.isActive,
      createdAt: accountObj.createdAt,
      updatedAt: accountObj.updatedAt,
    };
  }

  private async isAccountActive(accountId: string): Promise<boolean> {
    const account = await this.findById({id: accountId});

    if (!account.isActive) {
      throw throwlhos.err_badRequest('Não é possível sacar de conta desativada', { accountId });
    }
    return account.isActive;
  }
  private parseBalance(balance: any): number {
    if (is.number(balance)) return balance;
    if (balance && balance.toString) {
      return parseFloat(balance.toString());
    }
    return 0;
  }
  private toDecimal128(value: number): Types.Decimal128 { 
    return Types.Decimal128.fromString(value.toString());
  }
}