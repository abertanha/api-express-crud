import { Env } from '../config/Env.ts'
import { Responserror } from '../middlewares/ResponserrorMiddle.ts'
import { AccountRouter } from '../features/account/AccountRouter.ts'
import { TransactionRouter } from '../features/transaction/TransactionRouter.ts'
import { UserRouter } from '../features/user/UserRouter.ts'
import { AbstractEnvironment } from './AbstractEnvironments.ts'
import express from 'npm:express';

export class DevelopmentEnvironment extends AbstractEnvironment{
	constructor() {
		const port = 7000;
		super(port);
	}
	public run = () => {
		const devServer = express();

		this.initializeDefaultMiddlewares(devServer);

		devServer.get('/', (_req, res) => {
			res.send({
				status: 'OK',
				enviroment: Env.name,
				message: 'Servidor de desenvolvimento rolando...'
			});
		});

		devServer.use('/api/users', UserRouter);
    devServer.use('/api/accounts', AccountRouter);
    devServer.use('/api/transactions', TransactionRouter);

		const responseError = new Responserror({ promptErrors: true });
		devServer.use(responseError.errorHandler);

		this.listen(devServer);
	};
}