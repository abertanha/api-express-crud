import { Env } from '../config/Env.ts'
import { Responserror } from '../middlewares/ResponserrorMiddle.ts'
import { AccountRouter } from '../features/account/AccountRouter.ts'
import { TransactionRouter } from '../features/transaction/TransactionRouter.ts'
import { UserRouter } from '../features/user/UserRouter.ts'
import { AbstractEnvironment } from './AbstractEnvironments.ts'
import express from 'npm:express';
import { AuthRouter } from '../features/auth/AuthRouter.ts'
import { DocsRouter } from '../routes/DocsRouter.ts'

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
		devServer.use(DocsRouter);
		devServer.use(AuthRouter);
		devServer.use(UserRouter);
    devServer.use(AccountRouter);
    devServer.use(TransactionRouter);


		const responseError = new Responserror({ promptErrors: true });
		devServer.use(responseError.errorHandler);

		this.listen(devServer);
	};
}