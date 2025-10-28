import { BaseRules, ICheckObj } from '../../base/BaseRules.ts'

export class AccountRules extends BaseRules {
  constructor(){
    super()
      
    this.rc.addRule('balance',{
      validator: (value: any) => {
        const num = parseFloat(value);
        return !isNaN(num) && num >= 0;
      },
      message: 'Saldo deve ser um número não negativo'
    })

    this.rc.addRule('type', {
      validator: (value: any) => {
        return ['poupança', 'corrente'].includes(value);
      },
      message: "Tipo de conta deve ser 'poupança' ou 'corrente'"
    })

    this.rc.addRule('transactionAmount', {
      validator: (value: any) => {
        const num = parseFloat(value)
        return !isNaN(num) && num > 0
      },
      message: 'O valor da transação deve ser maior que zero.'
    })

    this.rc.addRule('transactionType', {
      validator: (value: any) => ['deposit' , 'whithdraw'].includes(value),
      message: "Tipo de transação deve ser 'deposit' ou 'withdraw'"
    })
  }
  validateAccountCreate(data: ICheckObj) {
    return this.validate({
      ...data,
      type: { value: data.type, isRequiredField: true },
      userId: { value: data.userId, isRequiredField: true },
      balance: { value: data.balance ?? 0 }
    })
  }

  validateTransaction(data: ICheckObj) {
    return this.validate({
      ...data,
      amount: { 
        value: data.amount, 
        isRequiredField: true,
        rule: 'transacationAmount'
      },
      type: { 
        value: data.type, 
        isRequiredField: true,
        rule: 'transactionType'
      }
    })
  }  
}