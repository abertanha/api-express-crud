import { UserService } from '../UserService.ts'
import { MockUserRepository } from './MockUserRepository.ts'
import { UserRepository } from '../../../models/User/UserRepository.ts'

export class MockUserService extends UserService {
  constructor() {
    super(new MockUserRepository() as unknown as UserRepository)
  }
}