import { NextFunction, Request, Response } from 'npm:express';
import { UserRules } from '../rules/banking/UserRules.ts';
import { Env } from '../config/Env.ts';
import { UserService } from '../services/UserService.ts'
import responser from 'responser';
import { Print } from '../utilities/Print.ts'

export class UserController {
  private readonly userService: UserService;
  private userRules: UserRules;
  private readonly print: Print;


  constructor(
    userService: UserService = new UserService(),
    userRules: UserRules = new UserRules(),
    print: Print = new Print()
  ) {
    this.print = print;
    this.userService = userService;
    this.userRules = userRules;
  }
  
  create = async(req: Request, res: Response, next: NextFunction) =>{
    try {
      const { name, email, cpf, birthDate, password } = req.body;
      
      this.userRules.validate(
        { name, isRequiredField: true },
        { cpf, isRequiredField: true },
        { email, isRequiredField: true },
        { birthDate, isRequiredField: true },
        { password, isRequiredField: true},
      );

      if (Env.local){
        this.print.info(
          'Recebido os dados: ', { name, email, cpf });
      }

      const userCreated = await this.userService.create({
        name,
        email,
        password,
        cpf,
        birthDate
      });

      return res.send_created('Usuário criado com sucesso', userCreated);

      } catch (error) {
        next(error)
    }
  }
  findUserById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const user = await this.userService.findUserById(id);

      return res.send_ok('Usuário encontrado', user);

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

      return res.send_ok('Lista de usuários recuperada',result);
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

      return res.send_partialContent('Usuário atualizado com sucesso', updatedUser);
    } catch (error) {
      next(error);
    }
  }
  deactivate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const force = req.query.force === 'true';

      await this.userService.deactivateUser(id, force);

      return res.send_noContent('Usuário desativado com sucesso',null);

    } catch (error) {
      next(error);
    }
  }
  reactivate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (Env.local) {
        this.print.info('Reativando usuário:', { id });
      }

      const reactivatedUser = await this.userService.reactivateUser(id);

      return res.send_created('Usuário reativado com sucesso',reactivatedUser);
    } catch (error) {
      next(error);
    }
  }
}