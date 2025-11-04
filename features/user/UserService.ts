import { UserRepository } from '../../models/User/UserRepository.ts';
import { throwlhos } from '../../globals/Throwlhos.ts';
import { IUser } from '../../models/User/IUser.ts';
import { randomBytes } from "node:crypto";
import { Buffer } from "node:buffer";
import { scryptSync } from 'node:crypto';
import { Print } from '../../utilities/Print.ts';
import { Types } from 'mongoose'

export namespace UserService {
  export type TUserSanitized = Omit<IUser, 'password'> & {
    _id: Types.ObjectId | string
  }
  export namespace Create {
    export type Input = {
      name: string
      email: string
      password: string
      cpf: string
      birthDate: Date | string
    }

    export type Output = TUserSanitized
  }
  export namespace FindById {
    export type Input = {
      id: string
      select?: string
    }

    export type Output = TUserSanitized
  }
  export namespace FindAll {
    export type Input ={ 
      page: number
      limit: number
      includeInactive?: boolean
    }

    export type Output = {
      docs: TUserSanitized[]
      totalDocs: number
      limit: number
      page: number
      totalPages: number
      hasNextPage: boolean
      hasPrevPage: boolean
    }
  }

  export namespace Update {
    export type Input = { 
      id: string
      data: Partial<Pick<IUser, 'name' | 'email' | 'birthDate'>>
    }

    export type Output = TUserSanitized
  }

  export namespace Reactivate {
    export type Input = {
      id: string
    }

    export type Output = TUserSanitized
  }
}

export class UserService {
  private readonly userRepository: UserRepository;
  private readonly print: Print;
  
  constructor(
      userRepository: UserRepository = new UserRepository(),
      print: Print = new Print()
   ){
    this.userRepository = userRepository;
    this.print = print;
  }

  async create(data: UserService.Create.Input): Promise<UserService.Create.Output>{
    const emailExists = await this.userRepository.exists({ email: data.email })
    if (emailExists) throw throwlhos.err_conflict('Email já cadastrado', { email: data.email });

    const cpfExists = await this.userRepository.exists({ cpf: data.cpf })
    if (cpfExists) throw throwlhos.err_conflict('CPF já cadastrado', { cpf: data.cpf });

    const salt = randomBytes(8).toString('hex');
    const hash = scryptSync(data.password, salt, 32) as Buffer;
    const saltAndHash = `${salt}.${hash.toString('hex')}`;

    const userCreated = await this.userRepository.createOne({
      name: data.name,
      email: data.email,
      password: saltAndHash, 
      cpf: data.cpf,
      birthDate: typeof data.birthDate === 'string' //<-- nao pude usar o isness aqui para
        ? new Date(data.birthDate)                  // para triggerar o narrowing do TS
        : data.birthDate,
      isActive: true
    });

    return this.sanitize(userCreated);
  }

  async findById(input: UserService.FindById.Input): Promise<UserService.FindById.Output> {
    const user = await this.userRepository
      .findById(input.id)
      .select(input.select || 'name email isActive')
      .lean()
      .exec();
    
    if(!user) throw throwlhos.err_notFound('Usuário não encontrado', { id: input.id });

    return this.sanitize(user);
  }
  async findAll (
    input: UserService.FindAll.Input
  ) {
    const $match: any = {};
    if (!input.includeInactive) {
      $match.isActive = true
    }

    const aggregate = [
      { $match },
      {
        $project: {
          name: 1,
          email: 1,
          cpf: 1,
          birthDate: 1,
          active: 1,
          createdAt: 1,
        },
      },
    ]

    return await this.userRepository.paginate(aggregate, {
      paginate: { page: input.page, limit: input.limit },
    })
  }
  async update(
    input: UserService.Update.Input
  ): Promise<UserService.Update.Output> {
    const userExists = await this.userRepository.exists({ _id: input.id });
    if (!userExists) throw throwlhos.err_notFound('Usuário não encontrando', { id: input.id });

    if (input.data.email) {
      const emailExists = await this.userRepository.findOne({
        email: input.data.email,
        _id: { $ne: input.id }
      });
      if (emailExists) throw throwlhos.err_conflict('Email já cadastrado', { email: input.data.email });
    }

    const updatedUser = await this.userRepository.updateById(input.id, input.data, {
      select: '-password'
    });

    return this.sanitize(updatedUser!);
  }
  async reactivate(input: UserService.Reactivate.Input): Promise<UserService.Reactivate.Output> {
    const user = await this.userRepository.findById(input.id, { select: '-password' });
    if (!user) {
      throw throwlhos.err_notFound('Usuário não encontrado', { id: input.id });
    }

    const reactivatedUser = await this.userRepository.updateById(
      input.id, 
      { isActive: true },
      { select: '-password' }
    );

    this.print.success(`Usuário ${user.name} (${input.id}) reativado com sucesso`);
    this.print.info(`As contas do usuário permanecem desativadas e devem ser reativadas individualmente`);

    return this.sanitize(reactivatedUser!);
  }
    
  private sanitize(user: any): UserService.TUserSanitized {
    const userObj = user.toObject ? user.toObject() : user;

    const { _password, ...sanitized } = userObj;

    return sanitized;
  }
}