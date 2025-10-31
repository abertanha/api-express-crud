import { NextFunction, Request, Response } from 'npm:express'
import { Print } from '../utilities/Print.ts'
import { throwlhos } from '../globals/Throwlhos.ts'
import { AccountRepository } from '../models/Account/AccountRepository.ts'
import { Env } from '../config/Env.ts'
import { TransactionRepository } from '../models/Transaction/TransactionRepository.ts'

const print = new Print();

export class OwnershipMiddleware {
  
  static user(){
    return async (req: Request, _res: Response, next: NextFunction) => {
      try {
        const userId = req.userId; 
        const { id, userId: targetUserId } = req.params;

        const targetId = id || targetUserId;

        if (!userId) throw throwlhos.err_unauthorized('Usuário não autenticado');
        if (!targetId) throw throwlhos.err_badRequest('ID do usuário não fornecido');

        if (userId !== targetId) {
          if (Env.local) {
            print.error('[OwnershipMiddleware] User access denied:', {
              authenticatedUserId: userId,
              requestedUserId: targetId,
            });
          }
          throw throwlhos.err_forbidden('Você só pode acessar seus próprios dados');
        }
        next();
      } catch (error) {
        next(error);
      } 
    }
  }
  static account() {
    return async (req: Request, _res: Response, next: NextFunction) =>{
      try {
        const userId = req.userId
        const { accountId, id } = req.params
        
        const targerAccountId = accountId || id

        if(!userId) throw throwlhos.err_unauthorized('Usuário não autenticado')
        if(!targerAccountId) throw throwlhos.err_badRequest('Id da conta não foi fornecido')
        
        const accountRepository = new AccountRepository()
        
        req.account = await this.verifyAccountOwnership(userId, targerAccountId, accountRepository)

        next();
      } catch (error) {
        next(error);
      }
    }
  }

  static transaction() {
    return async (req: Request, _res: Response, next: NextFunction) => {
      try {
        const userId = req.userId
        const { transactionId, id } = req.params
        
        const targetTransactionId = transactionId || id

        if (!userId) throw throwlhos.err_unauthorized('Usuário não autenticado')
        if (!targetTransactionId) throw throwlhos.err_badRequest('Id da transação não fornecido')
        
        const transactionRepository = new TransactionRepository()
        const accountRepository = new AccountRepository()

        const transaction = await transactionRepository.findById(targetTransactionId)

        if (Env.local) {
          print.info('[OwnershipMiddleware.transaction] Transação encontrada:', {
            transactionId: transaction?._id?.toString(),
            accountId: transaction?.accountId?.toString(),
            type: transaction?.type
          });
        }

        if (!transaction) throw throwlhos.err_notFound('Transação não encontrada', { transactionId: targetTransactionId})
        
        let accountIdStr: string;
        if (typeof transaction.accountId === 'object' && transaction.accountId._id) {
          accountIdStr = transaction.accountId._id.toString();
        } else {
          accountIdStr = transaction.accountId.toString();
        }
        
        const account = await this.verifyAccountOwnership(
          userId,
          accountIdStr,
          accountRepository
        );

        if (Env.local) {
          print.info('[OwnershipMiddleware.transaction] Conta validada:', {
            accountId: account._id.toString(),
            userId: userId
          });
        }

        req.transaction = transaction
        req.account = account

        next()
      } catch (err) {
        next(err)
      }
    } 
  }
  static transferAccounts() {
    return async (req: Request, _res: Response, next: NextFunction) => {
      try {
        const userId = req.userId
        const { fromAccountId, toAccountId } = req.body

        if(!userId) throw throwlhos.err_unauthorized('Usuário não autenticado')
        if(!fromAccountId || !toAccountId) {
          throw throwlhos.err_badRequest('ids das contas de origem e destino são obrigatórios')
        }

        const accountRepository = new AccountRepository()

        const [fromAccount, toAccount] = await Promise.all([
          accountRepository.findById(fromAccountId),
          accountRepository.findById(toAccountId),
        ]);

        if (!fromAccount) {
          throw throwlhos.err_notFound('Conta de origem não encontrada', { fromAccountId })
        }

        if (!toAccount) {
          throw throwlhos.err_notFound('Conta de destino não encontrada', { toAccountId })
        }

        const fromAccountUserId = this.getUserId(fromAccount);
        
        if (fromAccountUserId !== userId) {
          if (Env.local) {
            print.error('[OwnershipMiddleware] Transfer denied:', {
              userId,
              fromAccountOwnerId: fromAccountUserId,
              fromAccountId,
            });
          }
          throw throwlhos.err_forbidden('Você não tem permissão para transferir desta conta');
        }

        req.fromAccount = fromAccount
        req.toAccount = toAccount

        next()
      } catch (err) {
        next(err)
      }
    }
  }

  private static async verifyAccountOwnership (
    userId: string,
    accountId: string,
    accountRepository: AccountRepository
  ) {
    const account = await accountRepository.findById(accountId)

    if (!account) {
      throw throwlhos.err_notFound('Conta não encontrada', { accountId });
    }
    
    const accountUserId = this.getUserId(account);

    if (accountUserId !== userId) {
      if (Env.local) {
        print.error('[OwnershipMiddleware] Access denied:', {
          userId,
          accountOwnerId: accountUserId,
          accountId,
        });
      }
      throw throwlhos.err_forbidden('Você não tem permissão para acessar esta conta');
    }

    return account;
  }

  private static getUserId(account: any): string {
    if (account.userId && account.userId._id) {
      return account.userId._id.toString();
    }
    return account.userId.toString();
  }
}

declare global {
  namespace Express {
    interface Request {
      account?: any
      fromAccount?: any
      toAccount?: any
      transaction?: any
    }
  }
}