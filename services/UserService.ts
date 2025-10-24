
import { UserRepository } from '../models/User/UserRepository.ts'
import { Types } from 'mongoose'
import { throwlhos } from '../global/Throwlhos.ts'
import { IUser } from '../models/User/IUser.ts'

//>>>>>>> TODO MELHORIAS DRY: emailExists, userExists, coisas correlatas
//>>>>>>> precisam ter um espaço separado no código para evitar repetecos

export interface CreateUserDTO {
  name: string;
  email: string;
  password: string;
  cpf: string;
  birthDate: Date | string;
}

export interface UserResponseDTO {
  _id?: Types.ObjectId;
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

  constructor(userRepository: UserRepository = new UserRepository()){
    this.userRepository = userRepository;
  }

  async create(data: CreateUserDTO): Promise<UserResponseDTO>{
    const emailExists = await this.userRepository.exists({ email: data.email })
    if (emailExists) throw throwlhos.err_conflict('Email já cadastrado', { email: data.email });

    const cpfExists = await this.userRepository.exists({ cpf: data.cpf })
    if (cpfExists) throw throwlhos.err_conflict('CPF já cadastrado', { cpf: data.cpf });

    const userCreated = await this.userRepository.createOne({
      name: data.name,
      email: data.email,
      password: data.password, // TODO hash será implementado no serviço
      cpf: data.cpf,
      birthDate: typeof data.birthDate === 'string' //<-- nao pude usar o isness aqui para
        ? new Date(data.birthDate)                  // para triggerar o narrowing do TS
        : data.birthDate,
      isActive: true
    });

    return this.sanitizeUser(userCreated);
  }

  async findUserById(id: string): Promise<UserResponseDTO> {
    const user = await this.userRepository.findById(id, {
      select: '-password'
    });

    if(!user) throw throwlhos.err_notFound('Usuário não encontrado', { id });

    return this.sanitizeUser(user);
  }
  async findAllUsers (
    page: number = 1,
    limit: number = 10,
    includeInactive: boolean = false
  ):Promise<{users: UserResponseDTO[], total: number, totalPages: number }>{
    const query: any = []
    if(!includeInactive) query.isActive = true;

    const skip = (page - 1) * limit;
    const users = await this.userRepository.findMany(query, {
      limit,
      skip,
      select: '-password'
    });

    const total = await this.userRepository.countDocuments(query);

    return {
      users: users.map(u => this.sanitizeUser(u)),
      total,
      totalPages: Math.ceil(total / limit)
    };
  }
  async updateUser(
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

    return this.sanitizeUser(updatedUser!);
  }
  // >>>>>TODO<<<<<
  // async deactivateUser(id: string, force: boolean = false): Promise<void> {
  //   const user = await this.userRepository.findById(id);
  //   if (!user) {
  //     throw throwlhos.err_notFound('Usuário não encontrado', { id });
  //   }

  //   if (!user.isActive) {
  //     throw throwlhos.err_badRequest('Usuário já está desativado', { id });
  //   }

  //   // TODO: Verificar saldo em contas (integração com AccountService)
  //   // if (!force) {
  //   //   const hasBalance = await accountService.userHasBalance(id);
  //   //   if (hasBalance) {
  //   //     throw throwlhos.err_badRequest('Usuário possui saldo em contas');
  //   //   }
  //   // }

  //   // Desativa usuário
  //   await this.userRepository.updateById(id, { isActive: false });

  //   // TODO: Desativar contas do usuário
  //   // await accountRepository.deactivateAllByUserId(id);
  // }
    
  private sanitizeUser(user: any): UserResponseDTO {
    const userObj = user.toObject ? user.toObject() : user;

    const { _password, ...sanitized } = userObj;

    return sanitized;
  }
}