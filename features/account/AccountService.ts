import { AccountRepository } from '../../models/Account/AccountRepository.ts';
import { throwlhos } from '../../globals/Throwlhos.ts';
import { IAccount } from '../../models/Account/IAccount.ts';
import { UserService } from '../user/UserService.ts';
import { Types } from 'mongoose';
import is from '@zarco/isness';
import { TransactionService } from '../transaction/TransactonService.ts'
import { Print } from '../../utilities/Print.ts'
import { startBankingSession } from '../../database/db/bankingDB.ts'


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

export interface TransferDTO {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description?: string;
};

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
  async create(data: CreateAccountDTO): Promise<AccountResponseDTO>{
    const userExists = await this.userService.findById(data.userId.toString());
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

  async findById(id: string): Promise<AccountResponseDTO> {
    const account = await this.accountRepository.findById(id);

    if(!account) throw throwlhos.err_notFound('Conta não encontrada', { id });

    return this.sanitize(account);
  }
  async findAll (
    page: number = 1,
    limit: number = 10,
    includeInactive: boolean = false
  ) {
    const $match: any = {};
    if (!includeInactive) {
      $match.isActive = true
    }

    const aggregate = [
      { $match },
      {
        $project: {
          name: 1,
          email: 1,
          cpf: 1,
          birthDate: 1,
          active: 1,
          createdAt: 1,
        },
      },
    ]

    return await this.accountRepository.paginate(aggregate, {
      paginate: { page, limit },
    })
  }

  async findByUserId(
    userId: string,
    includeInactive: boolean = false
  ): Promise<AccountResponseDTO[]> {
    const query: any = { userId: new Types.ObjectId(userId) };
    if (!includeInactive) query.isActive = true;

    const accounts = await this.accountRepository.findMany(query);
    return accounts.map((a) => this.sanitize(a));    
  }
  async update(
    id: string,
    data: Partial<Pick<IAccount,'balance' | 'type'>>
  ): Promise<AccountResponseDTO> {
    await this.findById(id);
    
    if (data.type && !['poupança', 'corrente'].includes(data.type)){
      throw throwlhos.err_badRequest('Tipo de conta inválido.', { type: data.type });
    }

    const updatedAccount = await this.accountRepository.updateById(id, data);

    return this.sanitize(updatedAccount!);
  }

  // operações financeiras

  async deposit(
    accountId: string,
    amount: number,
    description: string = 'Depósito'
  ): Promise<{ account: AccountResponseDTO; transaction: any }> {
    if (amount <= 0){
      throw throwlhos.err_badRequest(`Valor ${amount} do depósito deve ser positivo.`);
    }

    const account = await this.findById(accountId);
    if (!account.isActive) {
      throw throwlhos.err_badRequest('Não é possível depositar em conta desativada', { accountId });
    }

    const currentBalance = this.parseBalance(account.balance);
    const newBalance = currentBalance + amount;

    const updatedAccount = await this.accountRepository.updateById(accountId, {
      balance: this.toDecimal128(newBalance),
    });

    
    const transaction = await this.transactionService.create({
      accountId,
      type: 'deposit',
      amount,
      description,
      balanceBefore: currentBalance,
      balanceAfter: newBalance
    });

    this.print.sucess(` Depósito realizado: R$ ${amount.toFixed(2)} na conta ${account.accNumber}`);

    return {
      account: this.sanitize(updatedAccount!),
      transaction
    };
  }

   async withdraw(
    accountId: string,
    amount: number,
    description: string = 'Saque'
  ): Promise<{ account: AccountResponseDTO; transaction: any }> {
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

    const transaction = await this.transactionService.create({
      accountId,
      type: 'withdraw',
      amount,
      description,
      balanceBefore: currentBalance,
      balanceAfter: newBalance
    });

    this.print.sucess(` Saque realizado: R$ ${amount.toFixed(2)} da conta ${account!.accNumber}`);

    return {
      account: this.sanitize(updatedAccount!),
      transaction
    };
  }

  async transfer(data: TransferDTO): Promise<{
    fromAccount: AccountResponseDTO;
    toAccount: AccountResponseDTO;
    transactions: {
      transferOut: any;
      transferIn: any;
    };
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

    const session = await startBankingSession();

    
    let updatedFromAccount;
    let updatedToAccount;
    let transferOutTransaction;
    let transferInTransaction;


    
    try {
      session.startTransaction();
      
      [updatedFromAccount, updatedToAccount] = await Promise.all([
        this.accountRepository.model.findByIdAndUpdate(
          fromAccountId,
          { balance: this.toDecimal128(newFromBalance) },
          { new: true, session }
        ),
        this.accountRepository.model.findByIdAndUpdate(
          toAccountId,
          { balance: this.toDecimal128(newToBalance) },
          { new: true, session }
        ),
      ]);
      
      [transferOutTransaction, transferInTransaction] = await Promise.all([
        this.transactionService.create({
          accountId: fromAccountId,
          type: 'transfer_out',
          amount,
          description: `${description} para conta ${toAccount.accNumber}`,
          relatedAccountId: toAccountId,
          balanceBefore: fromBalance,
          balanceAfter: newFromBalance,
          session,
        }),
        this.transactionService.create({
          accountId: toAccountId,
          type: 'transfer_in',
          amount,
          description: `${description} da conta ${fromAccount.accNumber}`,
          relatedAccountId: fromAccountId,
          balanceBefore: toBalance,
          balanceAfter: newToBalance,
          session,
        })
      ]);

      await session.commitTransaction();
      this.print.sucess('Transação commitada com sucesso');
      
    } catch (error) {
      await session.abortTransaction();
      this.print.error('Erro na transferência, rollback executado:', error);
      throw error;
    } finally {
      await session.endSession();
    }

    this.print.sucess(
      ` Transferência realizada: R$ ${amount.toFixed(2)} de ${fromAccount.accNumber} para ${toAccount.accNumber}`
    );

    return {
      fromAccount: this.sanitize(updatedFromAccount!),
      toAccount: this.sanitize(updatedToAccount!),
      transactions: {
        transferOut: transferOutTransaction,
        transferIn: transferInTransaction,
      },
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
    const user = await this.userService.findById(userId);
  
    if (!user) {
      throw throwlhos.err_notFound('Usuário não encontrado', { userId });
    }
    
    const accounts = await this.accountRepository.findMany({
      userId: new Types.ObjectId(userId),
      isActive: true,
    });

    return accounts.reduce((sum, account) => {
      return sum + this.parseBalance(account.balance);
    }, 0);
  }

  async deactivateAccount(accountId: string, force: boolean = false): Promise<void> {
    const account = await this.findById(accountId);

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

    this.print.sucess(` Conta ${account.accNumber} desativada`);
  }

  async reactivateAccount(accountId: string): Promise<AccountResponseDTO> {
    const account = await this.findById(accountId);

    if (account.isActive) {
      throw throwlhos.err_badRequest('Conta já está ativa', { accountId });
    }

    const user = await this.userService.findById(account.userId.toString());
    if (!user.isActive) {
      throw throwlhos.err_badRequest('Não é possível reativar conta de usuário desativado', {
        accountId,
        userId: user._id,
      });
    }

    const reactivatedAccount = await this.accountRepository.updateById(accountId, { isActive: true });

    this.print.sucess(`Conta ${account.accNumber} reativada`);

    return this.sanitize(reactivatedAccount!);
  }

  async deactivateAllAccountsByUserId(userId: string): Promise<void> {
    const result = await this.accountRepository.updateMany(
      { userId: new Types.ObjectId(userId), isActive: true },
      { isActive: false }
    );

    this.print.sucess(`${result.modifiedCount} contas do usuário ${userId} desativadas`);
  }

  private sanitize(account: any): AccountResponseDTO {
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
    const account = await this.findById(accountId);

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