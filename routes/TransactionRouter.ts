import { Router } from 'npm:express'
import { TransactionRouter as Routes } from '../features/transaction/TransactionRouter.ts'

const TransactionRouter = Router()

TransactionRouter.use(Routes)

export { TransactionRouter }