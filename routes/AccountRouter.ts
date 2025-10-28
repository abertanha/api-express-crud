import { Router } from 'npm:express'
import { AccountRouter as Routes } from '../features/account/AccountRouter.ts'

const AccountRouter = Router()

AccountRouter.use(Routes)

export { AccountRouter }