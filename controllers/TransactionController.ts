import { NextFunction, Request, Response } from 'express';
import { Env } from '../config/Env.ts';
import { TransactionService } from '../services/TransactonService.ts';
import { TransactionRules } from '../rules/banking/TransactionRules.ts'

export class TransactionController {
  private readonly transactionService: TransactionService;
  private readonly transactionRules: TransactionRules;

  constructor(
    transactionService: TransactionService = new TransactionService(),
    transactionRules: TransactionRules = new TransactionRules()
  ) {
    this.transactionService = transactionService;
    this.transactionRules = transactionRules;
  }

  findTransactionById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      
      this.transactionRules.validate({ id, isRequiredField: true, rule: 'objectId' });
      const transaction = await this.transactionService.findTransactionById(id);

      return res.success(res, transaction, 'Transação encontrada');
    } catch (error) {
      next(error);
    }
  };

  findTransactionsByAccountId = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { accountId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      this.transactionRules.validateTransactionFilters({
        accountId,
        page,
        limit,
      });

      if (Env.local) {
        console.info('[Transaction Controller] Buscando transações:', { accountId, page, limit });
      }

      const result = await this.transactionService.findTransactionsByAccountId(
        accountId,
        page,
        limit
      );

      return res.success(res, result, 'Transações recuperadas');
    } catch (error) {
      next(error);
    }
  };

  findTransactionsByType = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { accountId } = req.params;
      const { type } = req.query;

      this.transactionRules.validateTransactionFilters({
        accountId,
        type,
      });

      if (Env.local) {
        console.info('[Transaction Controller] Filtrando por tipo:', { accountId, type });
      }

      const transactions = await this.transactionService.findTransactionsByType(
        accountId,
        type as any
      );

      return res.success(res, transactions, 'Transações filtradas por tipo');
    } catch (error) {
      next(error);
    }
  };

  findTransfersBetweenAccounts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { accountId1, accountId2 } = req.params;

      this.transactionRules.validateTransfersBetweenAccounts({
        accountId1,
        accountId2,
      });

      if (Env.local) {
        console.info('[Transaction Controller] Buscando transferências:', { accountId1, accountId2 });
      };

      const transactions = await this.transactionService.findTransfersBetweenAccounts(
        accountId1,
        accountId2
      );

      return res.success(res, transactions, 'Transferências entre contas recuperadas');
    } catch (error) {
      next(error);
    }
  };

  getAccountStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { accountId } = req.params;

      this.transactionRules.validate({ accountId, isRequiredField: true, rule: 'objectId' });

      if (Env.local) {
        console.info('[Transaction Controller] Buscando estatísticas:', { accountId });
      }

      const stats = await this.transactionService.getAccountStats(accountId);

      return res.success(res, stats, 'Estatísticas recuperadas');
    } catch (error) {
      next(error);
    }
  };
}