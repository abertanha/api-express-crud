import { UserRepository } from '../../models/User/UserRepository.ts'
import { throwlhos } from '../../global/Throwlhos.ts'
import { IUser } from '../../models/User/IUser.ts'
import { AccountService } from '../../features/account/AccountService.ts'
import { randomBytes } from "node:crypto";
import { Buffer } from "node:buffer";
import { scryptSync } from 'node:crypto'
import { Print } from '../../utilities/Print.ts'


export interface CreateUserDTO {
  name: string;
  email: string;
  password: string;
  cpf: string;
  birthDate: Date | string;
}

export interface UserResponseDTO {
  _id?: string;
  name: string;
  email: string;
  cpf: string;
  birthDate: Date;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
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

  async create(data: CreateUserDTO): Promise<UserResponseDTO>{
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

  async findById(id: string): Promise<UserResponseDTO> {
    const user = await this.userRepository.findById(id, {
      name,
      select: '-password'
    });

    if(!user) throw throwlhos.err_notFound('Usuário não encontrado', { id });

    return this.sanitize(user);
  }
  async findAll (
    page: number,
    limit: number,
    includeInactive: boolean = false
  ) {
    const $match: any = {};
    if (!includeInactive) {
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
      paginate: { page, limit },
    })
  }
  async update(
    id: string,
    data: Partial<Pick<IUser, 'name' | 'email' | 'birthDate'>>
  ): Promise<UserResponseDTO> {
    const userExists = await this.userRepository.exists({ _id: id });
    if (!userExists) throw throwlhos.err_notFound('Usuário não encontrando', { id });

    if (data.email) {
      const emailExists = await this.userRepository.findOne({
        email: data.email,
        _id: { $ne: id}
      });
      if (emailExists) throw throwlhos.err_conflict('Email já cadastrado', { email: data.email });
    }

    const updatedUser = await this.userRepository.updateById(id, data, {
      select: '-password'
    });

    return this.sanitize(updatedUser!);
  }
  async deactivate(id: string, force: boolean = false): Promise<void> {
    const accountService = this.getAccountService();
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw throwlhos.err_notFound('Usuário não encontrado', { id });
    }
    
    if (!user.isActive) {
      throw throwlhos.err_badRequest('Usuário já está desativado', { id });
    }
    
    if (!force) {
      const hasBalance = await accountService.userHasBalance(id);
      if (hasBalance) {
        const totalBalance = await accountService.getUserTotalBalance(id);
        throw throwlhos.err_badRequest(
          'Não é possível desativar usuário com saldo em contas. Esvazie as contas primeiro ou use force=true',
          { 
            userId: id, 
            totalBalance,
            message: `Saldo total: R$ ${totalBalance.toFixed(2)}`
          }
        );
      }
    }

    await accountService.deactivateAllAccountsByUserId(id);
    this.print.sucess(`Contas do usuário ${user.name} (${id}) desativadas`);

    await this.userRepository.updateById(id, { isActive: false });
    this.print.sucess(`Usuário ${user.name} (${id}) desativado com sucesso`);
  }
  async reactivate(id: string): Promise<UserResponseDTO> {
    const user = await this.userRepository.findById(id, { select: '-password' });
    if (!user) {
      throw throwlhos.err_notFound('Usuário não encontrado', { id });
    }

    const reactivatedUser = await this.userRepository.updateById(
      id, 
      { isActive: true },
      { select: '-password' }
    );

    this.print.sucess(`Usuário ${user.name} (${id}) reativado com sucesso`);
    this.print.info(`As contas do usuário permanecem desativadas e devem ser reativadas individualmente`);

    return this.sanitize(reactivatedUser!);
  }
    
  private sanitize(user: any): UserResponseDTO {
    const userObj = user.toObject ? user.toObject() : user;

    const { _password, ...sanitized } = userObj;

    return sanitized;
  }
  private getAccountService(): AccountService {
    return new AccountService();
  }
}