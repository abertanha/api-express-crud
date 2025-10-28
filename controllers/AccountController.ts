import { NextFunction, Request, Response } from 'npm:express';
import { AccountRules } from '../rules/banking/AccountRules.ts';
import { Env } from '../config/Env.ts';
import { AccountService } from '../services/AccountService.ts';
import { Print } from '../utilities/Print.ts'

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
        { userId, isRequiredField: true },
        { type, isRequiredField: true }
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

  findAccountById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const account = await this.accountService.findAccountById(id);

      return res.send_ok('Conta encontrada',account);
    } catch (error) {
      next(error);
    }
  };

  findAllAccounts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const includeInactive = req.query.includeInactive === 'true';

      const result = await this.accountService.findAllAccounts(page, limit, includeInactive);

      return res.send_ok('Lista de contas recuperada',result);
    } catch (error) {
      next(error);
    }
  };

  findAccountsByUserId = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const includeInactive = req.query.includeInactive === 'true';

      const accounts = await this.accountService.findAccountsByUserId(userId, includeInactive);

      return res.send_ok('Contas do usuário recuperadas', accounts);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { type, balance } = req.body;

      if (type) this.accountRules.validate({ type });
      if (balance !== undefined) this.accountRules.validate({ balance });

      const updatedAccount = await this.accountService.updateAccount(id, {
        type,
        balance,
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

      this.accountRules.validate({ amount, isRequiredField: true });

      if (Env.local) {
        this.print.info('[Account Controller] Depósito:', { accountId: id, amount });
      }

      const updatedAccount = await this.accountService.deposit(id, amount, description);

      return res.send_ok('Depósito realizado com sucesso', updatedAccount);
    } catch (error) {
      next(error);
    }
  };

  withdraw = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { amount, description } = req.body;

      this.accountRules.validate({ amount, isRequiredField: true });

      if (Env.local) {
        this.print.info('[Account Controller] Saque:', { accountId: id, amount });
      }

      const updatedAccount = await this.accountService.withdraw(id, amount, description);

      return res.send_ok('Saque realizado com sucesso', updatedAccount);
    } catch (error) {
      next(error);
    }
  };

  transfer = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { fromAccountId, toAccountId, amount, description } = req.body;

      this.accountRules.validate(
        { fromAccountId, isRequiredField: true },
        { toAccountId, isRequiredField: true },
        { amount, isRequiredField: true }
      );

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

      await this.accountService.deactivateAccount(id, force);

      return res.send_noContent('Conta desativada com sucesso', null);
    } catch (error) {
      next(error);
    }
  };

  reactivate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const reactivatedAccount = await this.accountService.reactivateAccount(id);

      return res.send_created('Conta reativada com sucesso.', reactivatedAccount);
    } catch (error) {
      next(error);
    }
  };
}