import { throwlhos } from '../../../globals/Throwlhos.ts'
import { SoftDeleteService } from '../../../services/SoftDeleteUserService/SoftDeleteUserService.ts'

export class MockSoftDeleteService  {
  private mockUsers: Map<string, { isActive: boolean; name: string; hasBalance: boolean }>;

  constructor() {
    this.mockUsers = new Map([
      ['507f1f77bcf86cd799439011', { isActive: true, name: 'João Silva', hasBalance: false }],
      ['507f1f77bcf86cd799439012', { isActive: true, name: 'Maria Santos', hasBalance: false }],
      ['507f1f77bcf86cd799439013', { isActive: false, name: 'Pedro Oliveira', hasBalance: false }],
    ]);
  }

  async deactivate(id: string, force: boolean = false): Promise<void> {
    const user = this.mockUsers.get(id);
    
    if (!user) {
      throw throwlhos.err_notFound('Usuário não encontrado', { id });
    }
    
    if (!user.isActive) {
      throw throwlhos.err_badRequest('Usuário já está desativado', { id });
    }
    
    if (!force && user.hasBalance) {
      throw throwlhos.err_badRequest(
        'Não é possível desativar usuário com saldo em contas. Esvazie as contas primeiro ou use force=true',
        { 
          userId: id, 
          totalBalance: 100,
          message: 'Saldo total: R$ 100.00'
        }
      );
    }

    user.isActive = false;
  }

  setUserBalance(id: string, hasBalance: boolean) {
    const user = this.mockUsers.get(id);
    if (user) {
      user.hasBalance = hasBalance;
    }
  }

  resetMockData() {
    this.mockUsers = new Map([
      ['507f1f77bcf86cd799439011', { isActive: true, name: 'João Silva', hasBalance: false }],
      ['507f1f77bcf86cd799439012', { isActive: true, name: 'Maria Santos', hasBalance: false }],
      ['507f1f77bcf86cd799439013', { isActive: false, name: 'Pedro Oliveira', hasBalance: false }],
    ]);
  }
}