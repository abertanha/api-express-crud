import { NextFunction, Request, Response } from 'npm:express';
import { AccountRules } from './AccountRules.ts';
import { Env } from '../../config/Env.ts';
import { AccountService } from './AccountService.ts';
import { Print } from '../../utilities/Print.ts'
import { throwlhos } from '../../globals/Throwlhos.ts'

export class AccountController {
  private readonly accountService: AccountService;
  private readonly accountRules: AccountRules;
  private readonly print: Print;

  constructor(
    accountService: AccountService = new AccountService(),
    accountRules: AccountRules = new AccountRules(),
    print: Print = new Print()
  ) {
    this.print = print;
    this.accountService = accountService;
    this.accountRules = accountRules;
  }

  // CRUD
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, type, balance } = req.body;

      this.accountRules.validate(
        { userId, isRequiredField: true, rule: 'userId' },
        { type, isRequiredField: true, rule: 'type' },
        { balance, rule: 'balance' }
      );

      if (Env.local) {
        this.print.info('[Account Controller] Criando conta:', { userId, type, balance });
      }

      const accountCreated = await this.accountService.create({
        userId,
        type,
        balance,
      });

      return res.send_created('Conta criada com sucesso', accountCreated);
    } catch (error) {
      next(error);
    }
  };

  findById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const account = await this.accountService.findById(id);

      return res.send_ok('Conta encontrada',account);
    } catch (error) {
      next(error);
    }
  };

  findAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.accountService.findAll({
        page: req.pagination!.page,
        limit: req.pagiation!.limit,
        includeInactive: req.query.includeInactive === 'true'
      });

      return res.send_ok('Lista de contas recuperada',result);
    } catch (error) {
      next(error);
    }
  };

  findByUserId = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accounts = await this.accountService.findByUserId({
        userId: req.params.userId,
        includeInactive: req.query.includeInactive === 'true'
      });

      return res.send_ok('Contas do usuário recuperadas', accounts);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type, balance } = req.body;

      if (type) this.accountRules.validate({ type, rule: 'type' });
      if (balance !== undefined) this.accountRules.validate({ balance });

      const updatedAccount = await this.accountService.update({
        id: req.params.id,
        data: {
          type: type,
          balance: balance
        }
      });

      return res.send_partialContent('Conta atualizada com sucesso', updatedAccount);
    } catch (error) {
      next(error);
    }
  };

  // operações financeiras

  deposit = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { amount, description } = req.body;

      this.accountRules.validate(
        { amount, isRequiredField: true, rule: 'amount' }
      );

      this.accountRules.validate({ amount, isRequiredField: true });

      if (Env.local) {
        this.print.info('[Account Controller] Depósito:', { accountId: id, amount });
      }

      const updatedAccount = await this.accountService.deposit({
        accountId: id,
        amount: amount,
        description: description
      });

      return res.send_ok('Depósito realizado com sucesso', updatedAccount);
    } catch (error) {
      next(error);
    }
  };

  withdraw = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { amount, description } = req.body;

      this.accountRules.validate(
        { amount, isRequiredField: true, rule: 'amount' }
      );

      if (Env.local) {
        this.print.info('[Account Controller] Saque:', { accountId: id, amount });
      }

      const updatedAccount = await this.accountService.withdraw({
        accountId: id,
        amount: amount,
        description: description
      });

      return res.send_ok('Saque realizado com sucesso', updatedAccount);
    } catch (error) {
      next(error);
    }
  };

  transfer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { fromAccountId, toAccountId, amount, description } = req.body;

      this.accountRules.validate(
        { fromAccountId, isRequiredField: true, rule: 'accountId' },
        { toAccountId, isRequiredField: true, rule: 'accountId' },
        { amount, isRequiredField: true, rule: 'amount' }
      );

      if (fromAccountId === toAccountId) {
        throw throwlhos.err_badRequest('Não é possível transferir para a mesma conta');
      }

      if (Env.local) {
        this.print.info('[Account Controller] Transferência:', {
          fromAccountId,
          toAccountId,
          amount,
        });
      }

      const result = await this.accountService.transfer({
        fromAccountId,
        toAccountId,
        amount,
        description,
      });

      return res.send_ok('Transferência realizada com sucesso',result);

    } catch (error) {
      next(error);
    }
  };

  getBalance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const balance = await this.accountService.getBalance(id);

      return res.send_ok('Saldo consultado',{ balance });
    } catch (error) {
      next(error);
    }
  };

  getUserTotalBalance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;

      const totalBalance = await this.accountService.getUserTotalBalance(userId);

      return res.send_ok('Saldo consultado',  { totalBalance });
    } catch (error) {
      next(error);
    }
  };

  // gerenciamento das contas

  deactivate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const force = req.query.force === 'true';

      await this.accountService.deactivate({
        accountId: id,
        force: force
      });

      return res.send_noContent('Conta desativada com sucesso', null);
    } catch (error) {
      next(error);
    }
  };

  reactivate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const reactivatedAccount = await this.accountService.reactivate({accountId: id});

      return res.send_created('Conta reativada com sucesso.', reactivatedAccount);
    } catch (error) {
      next(error);
    }
  };
}