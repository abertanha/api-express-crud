import { UserService } from '../UserService.ts'
import { MockUserRepository } from './MockUserRepository.ts'
import { UserRepository } from '../../../models/User/UserRepository.ts'
import { Print } from '../../../utilities/Print.ts'

export class MockPrint extends Print {
  override sucess(_message: string) {}
  override error(_message: string, _error?: any) {}
  override info(_message: string, _data?: any) {}
}

export class MockUserService extends UserService {
  constructor() {
    super(
      new MockUserRepository() as unknown as UserRepository,
      new MockPrint()
    )
  }
}