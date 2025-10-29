import { getBankingDB } from './db/bankingDB.ts'
import { UserSchema } from '../models/User/User.ts'
import { AccountSchema } from '../models/Account/Account.ts'
import { TransactionSchema } from '../models/Transaction/Transaction.ts'
import { Print } from '../utilities/Print.ts'
import { RefreshTokenSchema } from '../models/RefreshToken/RefreshToken.ts'

const print = new Print()
let modelsInitialized = false

export const initializeModels = () => {
  if (modelsInitialized) {
    print.info('[Models] Models already initialized, skipping...')
    return
  }

  const connection = getBankingDB()

  try {
    if (!connection.models['User']) {
      connection.model('User', UserSchema)
      print.sucess('[Models] ✅ User model registered')
    }

    if (!connection.models['Account']) {
      connection.model('Account', AccountSchema)
      print.sucess('[Models] ✅ Account model registered')
    }
    
    if (!connection.models['Transaction']) {
      connection.model('Transaction', TransactionSchema)
      print.sucess('[Models] ✅ Transaction model registered')
    }

    if (!connection.models['RefreshToken']) {
      connection.model('RefreshToken', RefreshTokenSchema)
      print.sucess('[Models] ✅ RefreshToken model registered')
    }

    modelsInitialized = true
    print.sucess('[Models] 🎉 All models initialized!')

  } catch (error) {
    print.error('[Models] ❌ Error initializing models:', error)
    throw error
  }
}

export const listRegisteredModels = (): string[] => {
  const connection = getBankingDB()
  return Object.keys(connection.models)
}