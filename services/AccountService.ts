import { AccountRepository } from '../models/Account/AccountRepository.ts';
import { throwlhos } from '../global/Throwlhos.ts';
import { IAccount } from '../models/Account/IAccount.ts';
import { UserService } from './UserService.ts';
import { Types } from 'mongoose';
import is from '@zarco/isness';


export interface CreateAccountDTO {
  balance?: number;
  type: 'poupança' | 'corrente';
  userId: string;
};

export interface AccountResponseDTO {
  _id?: string;
  accNumber: number;
  balance: number;
  type: 'poupança' | 'corrente';
  userId: {
    _id: string;
    name: string;
    email:string;
    cpf: string;
  } | string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

export interface TransactionDTO {
  accountId: string;
  amount: number;
  type: 'credit' | 'debit' | 'transfer';
  description?: string;
};

// tive duvida aqui, melhor implementar a busca
// para transacao por acc_id ou acc_number?
// dai implementaria tbm um index no acc_number ne?
export interface TransferDTO {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description?: string;
};

export class AccountService {
  private readonly userService: UserService;
  private readonly accountRepository: AccountRepository;

  constructor(
    accountRepository: AccountRepository = new AccountRepository(),
    userService: UserService = new UserService()
  ){
    this.accountRepository = accountRepository;
    this.userService = userService;
  }
  // crud
  async create(data: CreateAccountDTO): Promise<AccountResponseDTO>{
    const userExists = await this.userService.findUserById(data.userId.toString());
    if (!userExists) throw throwlhos.err_notFound('Usuário não encontrado'); 

    const isUserActivate = userExists.isActive;
    if (!isUserActivate) throw throwlhos.err_badRequest(`Usuário ${userExists.name} está bloqueado.`);

    if (!['poupança', 'corrente'].includes(data.type)) {
      throw throwlhos.err_badRequest('Tipo de conta inválido', { type: data.type });
    }

    const initialBalance = data.balance || 0;
    if (initialBalance < 0) {
      throw throwlhos.err_badRequest('Saldo inicial não pode ser negativo', { balance: initialBalance });
    }

    const accountCreated = await this.accountRepository.createOne({
      balance: this.toDecimal128(initialBalance),
      type: data.type,
      userId: new Types.ObjectId(data.userId),
      isActive: true
    });

    // TODO: criar registro de transação inicial (se balance > 0)
    // if (initialBalance > 0) {
    //   await transactionService.createTransaction({
    //     accountId: accountCreated._id,
    //     type: 'credit',
    //     amount: initialBalance,
    //     description: 'Depósito inicial'
    //   });
    // }

    return this.sanitizeAccount(accountCreated);
  }

  async findAccountById(id: string): Promise<AccountResponseDTO> {
    const account = await this.accountRepository.findById(id);

    if(!account) throw throwlhos.err_notFound('Conta não encontrada', { id });

    return this.sanitizeAccount(account);
  }
  async findAllAccounts (
    page: number = 1,
    limit: number = 10,
    includeInactive: boolean = false
  ):Promise<{accounts: AccountResponseDTO[], total: number, totalPages: number }>{
    const query: any = {};
    if(!includeInactive) query.isActive = true;

    const skip = (page - 1) * limit;
    const accounts = await this.accountRepository.findMany(query, {
      limit,
      skip,
    });

    const total = await this.accountRepository.countDocuments(query);

    return {
      accounts: accounts.map(a => this.sanitizeAccount(a)),
      total,
      totalPages: Math.ceil(total / limit)
    };
  }

  async findAccountsByUserId(
    userId: string,
    includeInactive: boolean = false
  ): Promise<AccountResponseDTO[]> {
    const query: any = { userId: new Types.ObjectId(userId) };
    if (!includeInactive) query.isActive = true;

    const accounts = await this.accountRepository.findMany(query);
    return accounts.map((a) => this.sanitizeAccount(a));    
  }
  async updateAccount(
    id: string,
    data: Partial<Pick<IAccount,'balance' | 'type'>>
  ): Promise<AccountResponseDTO> {
    await this.findAccountById(id);
    
    if (data.type && !['poupança', 'corrente'].includes(data.type)){
      throw throwlhos.err_badRequest('Tipo de conta inválido.', { type: data.type });
    }

    const updatedAccount = await this.accountRepository.updateById(id, data);

    return this.sanitizeAccount(updatedAccount!);
  }

  // operações financeiras

  async deposit(
    accountId: string,
    amount: number,
    description: string = 'Depósito'
  ): Promise<AccountResponseDTO> {
    if (amount <= 0){
      throw throwlhos.err_badRequest(`Valor ${amount} do depósito deve ser positivo.`);
    }

    const account = await this.findAccountById(accountId);
    if (!account.isActive) {
      throw throwlhos.err_badRequest('Não é possível depositar em conta desativada', { accountId });
    }

    const currentBalance = this.parseBalance(account.balance);
    const newBalance = currentBalance + amount;

    const updatedAccount = await this.accountRepository.updateById(accountId, {
      balance: this.toDecimal128(newBalance),
    });

    // 6. TODO: Registrar transação
    // await transactionService.createTransaction({
    //   accountId,
    //   type: 'credit',
    //   amount,
    //   description,
    //   balanceBefore: currentBalance,
    //   balanceAfter: newBalance
    // });

    console.log(`[AccountService] Depósito realizado: R$ ${amount.toFixed(2)} na conta ${account.accNumber}`);

    return this.sanitizeAccount(updatedAccount!);

  }

   async withdraw(
    accountId: string,
    amount: number,
    description: string = 'Saque'
  ): Promise<AccountResponseDTO> {
    if (amount <= 0) {
      throw throwlhos.err_badRequest('Valor do saque deve ser positivo', { amount });
    }

    await this.isAccountActive(accountId);
    const account = await this.accountRepository.findById(accountId);

    const currentBalance = this.parseBalance(account!.balance);

    if (currentBalance < amount) {
      throw throwlhos.err_badRequest('Saldo insuficiente', {
        accountId,
        currentBalance,
        requestedAmount: amount,
      });
    }
    const newBalance = currentBalance - amount;

    const updatedAccount = await this.accountRepository.updateById(accountId, {
      balance: this.toDecimal128(newBalance),
    });

    // TODO: Registrar transação
    // await transactionService.createTransaction({
    //   accountId,
    //   type: 'debit',
    //   amount,
    //   description,
    //   balanceBefore: currentBalance,
    //   balanceAfter: newBalance
    // });

    console.log(`[AccountService] Saque realizado: R$ ${amount.toFixed(2)} da conta ${account!.accNumber}`);

    return this.sanitizeAccount(updatedAccount!);
  }

  async transfer(data: TransferDTO): Promise<{
    fromAccount: AccountResponseDTO;
    toAccount: AccountResponseDTO;
  }> {
    const { fromAccountId, toAccountId, amount, description = 'Transferência' } = data;

    if (amount <= 0) {
      throw throwlhos.err_badRequest('Valor da transferência deve ser positivo', { amount });
    }

    if (fromAccountId === toAccountId) {
      throw throwlhos.err_badRequest('Não é possível transferir para a mesma conta');
    }

    const [fromAccount, toAccount] = await Promise.all([
      this.accountRepository.findById(fromAccountId),
      this.accountRepository.findById(toAccountId),
    ]);

    if (!fromAccount) {
      throw throwlhos.err_notFound('Conta de origem não encontrada', { fromAccountId });
    }

    if (!toAccount) {
      throw throwlhos.err_notFound('Conta de destino não encontrada', { toAccountId });
    }

    await this.isAccountActive(fromAccount._id.toString());

    await this.isAccountActive(toAccount._id.toString());

    const fromBalance = this.parseBalance(fromAccount.balance);
    if (fromBalance < amount) {
      throw throwlhos.err_badRequest('Saldo insuficiente na conta de origem', {
        fromAccountId,
        currentBalance: fromBalance,
        requestedAmount: amount,
      });
    }

    const newFromBalance = fromBalance - amount;
    const toBalance = this.parseBalance(toAccount.balance);
    const newToBalance = toBalance + amount;

    // TODO: Usar transação do MongoDB para atomicidade
    // const session = await mongoose.startSession();
    // session.startTransaction();
    // try {

    // Atualiza ambas as contas (idealmente em uma transação)
    const [updatedFromAccount, updatedToAccount] = await Promise.all([
      this.accountRepository.updateById(fromAccountId, { balance: this.toDecimal128(newFromBalance) }),
      this.accountRepository.updateById(toAccountId, { balance: this.toDecimal128(newToBalance) }),
    ]);

    // TODO: Registrar transações (ambas)
    // await Promise.all([
    //   transactionService.createTransaction({
    //     accountId: fromAccountId,
    //     type: 'transfer_out',
    //     amount,
    //     description: `${description} para conta ${toAccount.accNumber}`,
    //     relatedAccountId: toAccountId,
    //     balanceBefore: fromBalance,
    //     balanceAfter: newFromBalance
    //   }),
    //   transactionService.createTransaction({
    //     accountId: toAccountId,
    //     type: 'transfer_in',
    //     amount,
    //     description: `${description} da conta ${fromAccount.accNumber}`,
    //     relatedAccountId: fromAccountId,
    //     balanceBefore: toBalance,
    //     balanceAfter: newToBalance
    //   })
    // ]);

    //   await session.commitTransaction();
    // } catch (error) {
    //   await session.abortTransaction();
    //   throw error;
    // } finally {
    //   session.endSession();
    // }

    console.log(
      `[AccountService] Transferência realizada: R$ ${amount.toFixed(2)} de ${fromAccount.accNumber} para ${toAccount.accNumber}`
    );

    return {
      fromAccount: this.sanitizeAccount(updatedFromAccount!),
      toAccount: this.sanitizeAccount(updatedToAccount!),
    };
  }

  async getBalance(accountId: string): Promise<number> {
    const account = await this.accountRepository.findById(accountId);

    if (!account) {
      throw throwlhos.err_notFound('Conta não encontrada', { accountId });
    }

    return this.parseBalance(account.balance);
  }

  async userHasBalance(userId: string): Promise<boolean> {
    const accounts = await this.accountRepository.findMany({
      userId: new Types.ObjectId(userId),
      isActive: true,
    });

    const totalBalance = accounts.reduce((sum, account) => {
      return sum + this.parseBalance(account.balance);
    }, 0);

    return totalBalance > 0;
  }

  async getUserTotalBalance(userId: string): Promise<number> {
    const accounts = await this.accountRepository.findMany({
      userId: new Types.ObjectId(userId),
      isActive: true,
    });

    return accounts.reduce((sum, account) => {
      return sum + this.parseBalance(account.balance);
    }, 0);
  }

  async deactivateAccount(accountId: string, force: boolean = false): Promise<void> {
    const account = await this.findAccountById(accountId);

    await this.isAccountActive(account._id!.toString());

    if (!force) {
      const balance = this.parseBalance(account.balance);
      if (balance > 0) {
        throw throwlhos.err_badRequest(
          'Não é possível desativar conta com saldo. Esvazie a conta primeiro ou use force=true',
          { accountId, balance }
        );
      }
    }

    await this.accountRepository.updateById(accountId, { isActive: false });

    console.log(`[AccountService] Conta ${account.accNumber} desativada`);
  }

  async reactivateAccount(accountId: string): Promise<AccountResponseDTO> {
    const account = await this.findAccountById(accountId);

    if (account.isActive) {
      throw throwlhos.err_badRequest('Conta já está ativa', { accountId });
    }

    const user = await this.userService.findUserById(account.userId.toString());
    if (!user.isActive) {
      throw throwlhos.err_badRequest('Não é possível reativar conta de usuário desativado', {
        accountId,
        userId: user._id,
      });
    }

    const reactivatedAccount = await this.accountRepository.updateById(accountId, { isActive: true });

    console.log(`[AccountService] Conta ${account.accNumber} reativada`);

    return this.sanitizeAccount(reactivatedAccount!);
  }

  async deactivateAllAccountsByUserId(userId: string): Promise<void> {
    const result = await this.accountRepository.updateMany(
      { userId: new Types.ObjectId(userId), isActive: true },
      { isActive: false }
    );

    console.log(`[AccountService] ${result.modifiedCount} contas do usuário ${userId} desativadas`);
  }

  private sanitizeAccount(account: any): AccountResponseDTO {
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
    const account = await this.findAccountById(accountId);

    if (!account.isActive) {
      throw throwlhos.err_badRequest('Não é possível sacar de conta desativada', { accountId });
    }
    return account.isActive;
  }
  private parseBalance(balance: any): number { // Changed from Decimal128
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