import { Router } from 'npm:express';
import { AccountController } from '../controllers/AccountController.ts';

const AccountRouter = Router();
const getAccountController = () => new AccountController();

AccountRouter.post('/', (req, res, next) => getAccountController().create(req, res, next));
AccountRouter.get('/', (req, res, next) => getAccountController().findAllAccounts(req, res, next));

AccountRouter.get('/user/:userId', (req, res, next) => getAccountController().findAccountsByUserId(req, res, next));
AccountRouter.get('/user/:userId/total-balance', (req, res, next) => getAccountController().getUserTotalBalance(req, res, next));

AccountRouter.post('/transfer', (req, res, next) => getAccountController().transfer(req, res, next));

AccountRouter.get('/:id', (req, res, next) => getAccountController().findAccountById(req, res, next));
AccountRouter.get('/:id/balance', (req, res, next) => getAccountController().getBalance(req, res, next));
AccountRouter.put('/:id', (req, res, next) => getAccountController().update(req, res, next));
AccountRouter.post('/:id/deposit', (req, res, next) => getAccountController().deposit(req, res, next));
AccountRouter.post('/:id/withdraw', (req, res, next) => getAccountController().withdraw(req, res, next));

AccountRouter.patch('/:id/deactivate', (req, res, next) => getAccountController().deactivate(req, res, next));
AccountRouter.patch('/:id/reactivate', (req, res, next) => getAccountController().reactivate(req, res, next));

export { AccountRouter };