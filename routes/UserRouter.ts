import { Router } from 'npm:express';
import { UserController } from '../controllers/UserController.ts';

const UserRouter = Router();
const getUserController = () => new UserController();

UserRouter.post('/', (req, res, next) => getUserController().create(req, res, next));
UserRouter.get('/', (req, res, next) => getUserController().findAllUsers(req, res, next));
UserRouter.get('/:id', (req, res, next) => getUserController().findUserById(req, res, next));
UserRouter.put('/:id', (req, res, next) => getUserController().update(req, res, next));

UserRouter.patch('/:id/deactivate', (req, res, next) => getUserController().deactivate(req, res, next));
UserRouter.patch('/:id/reactivate', (req, res, next) => getUserController().reactivate(req, res, next));

export { UserRouter };