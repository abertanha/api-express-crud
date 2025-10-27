import { Router } from 'npm:express';
import { TransactionController } from '../controllers/TransactionController.ts';

const TransactionRouter = Router();
const getTransactionController = () => new TransactionController();

TransactionRouter.get('/:id', (req, res, next) => getTransactionController().findTransactionById(req, res, next));
TransactionRouter.get('/account/:accountId', (req, res, next) => getTransactionController().findTransactionsByAccountId(req, res, next));
TransactionRouter.get('/account/:accountId/type', (req, res, next) => getTransactionController().findTransactionsByType(req, res, next));
TransactionRouter.get('/transfers/:accountId1/:accountId2', (req, res, next) => getTransactionController().findTransfersBetweenAccounts(req, res, next));
TransactionRouter.get('/account/:accountId/stats', (req, res, next) => getTransactionController().getAccountStats(req, res, next));

export { TransactionRouter };