import { throwlhos } from '../../globals/Throwlhos.ts'
import { BaseRules, ICheckObj } from '../../base/BaseRules.ts';
import is from '@zarco/isness';

export class TransactionRules extends BaseRules {
  constructor() {
    super();

    this.rc.addRule('transactionType', {
      validator: (value: any) => {
        return ['deposit', 'withdraw', 'transfer_out', 'transfer_in', 'initial_balance'].includes(value);
      },
      message: "Tipo de transação deve ser 'deposit', 'withdraw', 'transfer_out', 'transfer_in' ou 'initial_balance'",
    });

    this.rc.addRule('amount', {
      validator: (value: any) => {
        const num = parseFloat(value);
        return !isNaN(num) && num > 0;
      },
      message: 'O valor da transação deve ser um número maior que zero',
    });

    this.rc.addRule('balance', {
      validator: (value: any) => {
        const num = parseFloat(value);
        return !isNaN(num) && num >= 0;
      },
      message: 'O saldo deve ser um número não negativo',
    });

    this.rc.addRule('description', {
      validator: (value: any) => {
        if (!is.string(value)) return false;
        return value.length <= 200;
      },
      message: 'A descrição deve ter no máximo 200 caracteres',
    });

    this.rc.addRule('objectId', {
      validator: (value: any) => {
        if (!is.string(value)) return false;
        return is.objectId(value);
      },
      message: 'ID inválido. Deve ser um ObjectId válido do MongoDB',
    });
  }
  validateTransactionCreate(data: ICheckObj) {
    return this.validate(
      { accountId: data.accountId, isRequiredField: true, rule: 'objectId' },
      { type: data.type, isRequiredField: true, rule: 'transactionType' },
      { amount: data.amount, isRequiredField: true, rule: 'amount' },
      { balanceBefore: data.balanceBefore, isRequiredField: true, rule: 'balance' },
      { balanceAfter: data.balanceAfter, isRequiredField: true, rule: 'balance' },
      // Campos opcionais
      ...(data.description ? [{ description: data.description, rule: 'description' }] : []),
      ...(data.relatedAccountId ? [{ relatedAccountId: data.relatedAccountId, rule: 'objectId' }] : []),
      ...(data.relatedTransactionId ? [{ relatedTransactionId: data.relatedTransactionId, rule: 'objectId' }] : [])
    );
  }

  validateTransactionFilters(data: ICheckObj) {
    return this.validate(
      { accountId: data.accountId, isRequiredField: true, rule: 'objectId' },
      ...(data.type ? [{ type: data.type, rule: 'transactionType' }] : []),
      ...(data.page && data.limit ? [{ pagination: { page: data.page, limit: data.limit }, rule: 'pagination' }] : [])
    );
  }

  validateTransfersBetweenAccounts(data: ICheckObj) {
    return this.validate(
      { accountId1: data.accountId1, isRequiredField: true, rule: 'objectId' },
      { accountId2: data.accountId2, isRequiredField: true, rule: 'objectId' }
    );
  }

  validateBalanceConsistency(balanceBefore: number, amount: number, balanceAfter: number, type: string): void {
    let expectedBalance: number;

    switch (type) {
      case 'deposit':
      case 'transfer_in':
      case 'initial_balance':
        expectedBalance = balanceBefore + amount;
        break;
      case 'withdraw':
      case 'transfer_out':
        expectedBalance = balanceBefore - amount;
        break;
      default:
        throw throwlhos.err_badRequest('Tipo de transação inválido para validação de consistência');
    }

    // Tolerância de 0.01 para lidar com arredondamentos
    const difference = Math.abs(expectedBalance - balanceAfter);
    if (difference > 0.01) {
      throw throwlhos.err_badRequest(
        `Inconsistência nos saldos: esperado ${expectedBalance.toFixed(2)}, recebido ${balanceAfter.toFixed(2)}`
      );
    }
  }
}