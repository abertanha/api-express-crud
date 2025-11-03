import { AccountService } from '../../features/account/AccountService.ts'
import { throwlhos } from '../../globals/Throwlhos.ts'
import { UserRepository } from '../../models/User/UserRepository.ts'
import { Print } from '../../utilities/Print.ts'

export class SoftDeleteService {
  private readonly userRepository: UserRepository;
  private readonly print: Print;
  private readonly accountService: AccountService;
  
  constructor(
      accountService: AccountService = new AccountService(),
      userRepository: UserRepository = new UserRepository(),
      print: Print = new Print()
   ){
    this.accountService = accountService;
    this.userRepository = userRepository;
    this.print = print;
  }
  async deactivate(id: string, force: boolean = false): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw throwlhos.err_notFound('Usuário não encontrado', { id });
    }
    
    if (!user.isActive) {
      throw throwlhos.err_badRequest('Usuário já está desativado', { id });
    }
    
    if (!force) {
      const hasBalance = await this.accountService.userHasBalance(id);
      if (hasBalance) {
        const totalBalance = await this.accountService.getUserTotalBalance(id);
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

    await this.accountService.deactivateAllAccountsByUserId(id);
    this.print.sucess(`Contas do usuário ${user.name} (${id}) desativadas`);

    await this.userRepository.updateById(id, { isActive: false });
    this.print.sucess(`Usuário ${user.name} (${id}) desativado com sucesso`);
  }
}