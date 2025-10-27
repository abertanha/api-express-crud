import { NextFunction, Request, Response } from 'express';
import { UserRules } from '../rules/banking/UserRules.ts';
import { Env } from '../config/Env.ts';
import { UserService } from '../services/UserService.ts'

export class UserController {
  private readonly userService: UserService;
  private userRules: UserRules;

  constructor(
    userService: UserService = new UserService(),
    userRules: UserRules = new UserRules()
  ) {
    this.userService = userService;
    this.userRules = userRules;
  }
  
  create = async(req: Request, res: Response, next: NextFunction) =>{
    try {
      const name = req.params.name as string;
      const email = req.params.email as string;
      const cpf = req.params.cpf as string;
      const birthDate = req.params.birthDate as Date;
      const password = req.params.password as string;
      
      this.userRules.validate(
        { name, isRequiredField: true },
        { cpf, isRequiredField: true },
        { email, isRequiredField: true },
        { birthDate, isRequiredField: true },
        { password, isRequiredField: true},
      );

      if (Env.local){
        console.info(
          '[User Controller] Recebido os dados: ', { name, email, cpf });
      }

      const userCreated = await this.userService.create({
        name,
        email,
        password,
        cpf,
        birthDate
      });

      return res.created(res, userCreated, 'Usuário criado com sucesso');

      } catch (error) {
        next(error)
    }
  }
  findUserById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const user = await this.userService.findUserById(id);

      return res.success(res, user, 'Usuário encontrado');

    } catch (error) {
      next(error);
    }
  }

  findAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const includeInactive = req.query.includeInactive === 'true';

      const result = await this.userService.findAllUsers(page, limit, includeInactive);

      return res.success(res, result, 'Lista de usuários recuperada');
    } catch (error) {
      next(error);
    }
  }
  
  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { name, email, birthDate } = req.body;

      if (name) this.userRules.validate({ name });
      if (email) this.userRules.validate({ email });
      if (birthDate) this.userRules.validate({ birthDate });

      const updatedUser = await this.userService.updateUser(id, {
        name,
        email,
        birthDate
      });

      return res.success(res, updatedUser, 'Usuário atualizado com sucesso');
    } catch (error) {
      next(error);
    }
  }
  deactivate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const force = req.query.force === 'true';

      await this.userService.deactivateUser(id, force);

      return res.success(res, null, 'Usuário desativado com sucesso');

    } catch (error) {
      next(error);
    }
  }
  reactivate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (Env.local) {
        console.info('[User Controller] Reativando usuário:', { id });
      }

      const reactivatedUser = await this.userService.reactivateUser(id);

      return res.success(res, reactivatedUser, 'Usuário reativado com sucesso');
    } catch (error) {
      next(error);
    }
  }
}