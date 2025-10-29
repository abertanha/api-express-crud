import { NextFunction, Request, Response } from 'npm:express'
import { Print } from '../utilities/Print.ts'
import { throwlhos } from '../global/Throwlhos.ts'
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

        if (!transaction) throw throwlhos.err_notFound('Transação não encontrada', { transactionId: targetTransactionId})
        
        const account = await this.verifyAccountOwnership(
          userId,
          transaction.accountId.toString(),
          accountRepository
        );

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

        if (fromAccount.userId.toString() !== userId) {
          if (Env.local) {
            print.error('[OwnershipMiddleware] Transfer denied:', {
              userId,
              fromAccountOwnerId: fromAccount.userId.toString(),
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

    if (account.userId.toString() !== userId) {
      if (Env.local) {
        print.error('[OwnershipMiddleware] Access denied:', {
          userId,
          accountOwnerId: account.userId.toString(),
          accountId,
        });
      }
      throw throwlhos.err_forbidden('Você não tem permissão para acessar esta conta');
    }

    return account;
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