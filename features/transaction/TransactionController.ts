import { NextFunction, Request, Response } from 'npm:express';
import { Env } from '../../config/Env.ts';
import { TransactionService } from './TransactonService.ts';
import { TransactionRules } from './TransactionRules.ts'
import { Print } from '../../utilities/Print.ts'
import { TransactionType } from '../../models/Transaction/ITransaction.ts'

export class TransactionController {
  private readonly transactionService: TransactionService;
  private readonly transactionRules: TransactionRules;
  private readonly print: Print;

  constructor(
    transactionService: TransactionService = new TransactionService(),
    transactionRules: TransactionRules = new TransactionRules(),
    print: Print = new Print()
  ) {
    this.print = print;
    this.transactionService = transactionService;
    this.transactionRules = transactionRules;
  }

  findById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      
      const transaction = req.transaction;

      if (!transaction) {
        const { id } = req.params;
        this.transactionRules.validate({ id, isRequiredField: true, rule: 'objectId' });
        const fetchedTransaction = await this.transactionService.findById(id);
        return res.send_ok('Transação encontrada', fetchedTransaction);
      }

      this.logIfLocal(`Encontrou transação\nid: ${transaction._id }\ntransação: ${transaction}`);

      return res.send_ok('Transação encontrada', transaction);
    } catch (error) {
      next(error);
    }
  };

  findByAccountId = async (req: Request, res: Response, next: NextFunction) => {
    try{
      const accountId = req.account?._id || req.params.accountId;
      
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      this.transactionRules.validateTransactionFilters({
        accountId,
        page,
        limit,
      });

      
      const result = await this.transactionService.findByAccountId({
        accountId,
        page,
        limit
      });
      
      this.logIfLocal(`Listando transações por conta\npage: ${page}\n limit: ${limit}\nresult: ${result}`);

      return res.send_ok('Transações recuperadas',result);
    } catch (error) {
      next(error);
    }
  };

  findByAccountAndType = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { accountId } = req.params;
      const { type } = req.query;

      this.transactionRules.validateTransactionFilters({
        accountId,
        type,
      });

      this.logIfLocal('Filtrando por tipo:', { accountId, type });

      const transactions = await this.transactionService.findByAccountAndType({
        accountId: accountId,
        type: type as TransactionType
      });

      return res.send_ok('Transações filtradas por tipo', transactions);
    } catch (error) {
      next(error);
    }
  };

  findBetweenAccounts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { accountId1, accountId2 } = req.params;

      this.transactionRules.validateTransfersBetweenAccounts({
        accountId1,
        accountId2,
      });

      this.logIfLocal(`Buscando transferências entre as contas:\nconta_1: ${ accountId1}\n conta_2:${accountId2 }`);

      const transactions = await this.transactionService.findBetweenAccounts({
        accountId1,
        accountId2
      });

      return res.send_ok('Transferências entre contas recuperadas', transactions);
    } catch (error) {
      next(error);
    }
  }

  findAccountStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accountId = req.account?._id || req.params.accountId;

      this.transactionRules.validate({ accountId, isRequiredField: true, rule: 'objectId' });

      this.logIfLocal('Buscando estatísticas da conta com id: ', { accountId });

      const stats = await this.transactionService.getAccountStats({accountId});

      return res.send_ok('Estatísticas recuperadas',stats);
    } catch (error) {
      next(error);
    }
  }
  private logIfLocal(message: string, data?: any): void {
    if (Env.local) {
      this.print.info(message, data);
    }
  }
}