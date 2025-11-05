import { AccountService } from '../AccountService.ts';
import { MockAccountRepository } from './MockAccountRepository.ts';
import { AccountRepository } from '../../../models/Account/AccountRepository.ts';
import { TransactionService } from '../../transaction/TransactonService.ts';
import { Print } from '../../../utilities/Print.ts';
import { UserService } from '../../user/UserService.ts';
import { MockUserRepository } from '../../user/mocks/MockUserRepository.ts';
import { UserRepository } from '../../../models/User/UserRepository.ts';
import { Time } from '../../../utilities/Time.ts'

export class MockTransactionService extends TransactionService {
  override create(_data: any): Promise<any> {
    return Promise.resolve({
      _id: '507f1f77bcf86cd799439999',
      accountId: _data.accountId,
      type: _data.type,
      amount: _data.amount,
      description: _data.description,
      balanceBefore: _data.balanceBefore,
      balanceAfter: _data.balanceAfter,
      createdAt: Time.now().toDate(),
    });
  }
}

export class MockPrint extends Print {
  override success(_message: string) {}

  override error(_message: string, _error?: any) {}
}

class MockInternalUserService extends UserService {
  constructor() {
    super(
      new MockUserRepository() as unknown as UserRepository,
      new MockPrint()
    );
  }
}

export class MockAccountService extends AccountService {
  constructor() {
    super(
      new MockAccountRepository() as unknown as AccountRepository,
      new MockTransactionService(),
      new MockPrint(),
      new MockInternalUserService()
    );
  }

  override async transfer(data: any): Promise<any> {
    const { fromAccountId, toAccountId, amount, description = 'Transferência' } = data;

    if (amount <= 0) {
      throw {
        code: 400,
        status: 'BAD_REQUEST',
        message: 'Valor da transferência deve ser positivo',
        errors: { amount }
      };
    }

    if (fromAccountId === toAccountId) {
      throw {
        code: 400,
        status: 'BAD_REQUEST',
        message: 'Não é possível transferir para a mesma conta',
        errors: {}
      };
    }

    const accountRepository = this['accountRepository'] as any;
    const [fromAccount, toAccount] = await Promise.all([
      accountRepository.findById(fromAccountId),
      accountRepository.findById(toAccountId),
    ]);

    if (!fromAccount) {
      throw {
        code: 404,
        status: 'NOT_FOUND',
        message: 'Conta de origem não encontrada',
        errors: { fromAccountId }
      };
    }

    if (!toAccount) {
      throw {
        code: 404,
        status: 'NOT_FOUND',
        message: 'Conta de destino não encontrada',
        errors: { toAccountId }
      };
    }

    await this['isAccountActive'](fromAccount._id.toString());
    await this['isAccountActive'](toAccount._id.toString());

    const fromBalance = this['parseBalance'](fromAccount.balance);
    if (fromBalance < amount) {
      throw {
        code: 400,
        status: 'BAD_REQUEST',
        message: 'Saldo insuficiente na conta de origem',
        errors: {
          fromAccountId,
          currentBalance: fromBalance,
          requestedAmount: amount,
        }
      };
    }

    const newFromBalance = fromBalance - amount;
    const toBalance = this['parseBalance'](toAccount.balance);
    const newToBalance = toBalance + amount;

    const [updatedFromAccount, updatedToAccount] = await Promise.all([
      accountRepository.model.findByIdAndUpdate(
        fromAccountId,
        { balance: this['toDecimal128'](newFromBalance) },
        { new: true }
      ),
      accountRepository.model.findByIdAndUpdate(
        toAccountId,
        { balance: this['toDecimal128'](newToBalance) },
        { new: true }
      ),
    ]);

    const transactionService = this['transactionService'] as any;
    const [transferOutTransaction, transferInTransaction] = await Promise.all([
      transactionService.create({
        accountId: fromAccountId,
        type: 'transfer_out',
        amount,
        description: `${description} para conta ${toAccount.accNumber}`,
        relatedAccountId: toAccountId,
        balanceBefore: fromBalance,
        balanceAfter: newFromBalance,
      }),
      transactionService.create({
        accountId: toAccountId,
        type: 'transfer_in',
        amount,
        description: `${description} da conta ${fromAccount.accNumber}`,
        relatedAccountId: fromAccountId,
        balanceBefore: toBalance,
        balanceAfter: newToBalance,
      })
    ]);

    return {
      fromAccount: this['sanitize'](updatedFromAccount!),
      toAccount: this['sanitize'](updatedToAccount!),
      transactions: {
        transferOut: transferOutTransaction,
        transferIn: transferInTransaction,
      },
    };
  }
}
