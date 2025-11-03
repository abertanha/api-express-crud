import { NextFunction, Request, Response } from 'npm:express';
import { UserRules } from './UserRules.ts';
import { Env } from '../../config/Env.ts';
import { UserService } from './UserService.ts';
import { Print } from '../../utilities/Print.ts';
import { SoftDeleteService } from '../../services/SoftDeleteUserService/SoftDeleteUserService.ts'

export class UserController {
  private readonly userService: UserService;
  private userRules: UserRules;
  private readonly print: Print;
  private readonly softDeleteService: SoftDeleteService;


  constructor(
    userService: UserService = new UserService(),
    userRules: UserRules = new UserRules(),
    print: Print = new Print(),
    softDeleteService: SoftDeleteService = new SoftDeleteService()
  ) {
    this.print = print;
    this.userService = userService;
    this.userRules = userRules;
    this.softDeleteService = softDeleteService
  }
  
  create = async(req: Request, res: Response, next: NextFunction) =>{
    try {
      const { name, email, cpf, birthDate, password } = req.body;
      
      this.userRules.validate(
        { name, isRequiredField: true, rule: 'name' },
        { cpf, isRequiredField: true, rule: 'cpf'},
        { email, isRequiredField: true, rule: 'email' },
        { birthDate, isRequiredField: true, rule: 'birthDate' },
        { password, isRequiredField: true, rule: 'password'},
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
  findById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const user = await this.userService.findById({ id });

      return res.send_ok('Usuário encontrado', user);

    } catch (error) {
      next(error);
    }
  }

  findAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.userService.findAll({
        page: req.pagination!.page,
        limit: req.pagination!.limit,
        includeInactive: req.query.includeInactive === 'true'
      })

      return res.send_ok('Lista de usuários recuperada',result);
    } catch (error) {
      next(error);
    }
  }
  
  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { name, email, birthDate } = req.body;
      
      this.userRules.validate(
        { name, isRequiredField: false, rule: 'name' },
        { email, isRequiredField: false, rule: 'email' },
        { birthDate, isRequiredField: false, rule: 'birthDate' }
      );

      const updatedUser = await this.userService.update(id, {
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

      await this.softDeleteService.deactivate(id, force);

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

      const reactivatedUser = await this.userService.reactivate(id);

      return res.send_created('Usuário reativado com sucesso',reactivatedUser);
    } catch (error) {
      next(error);
    }
  }
}