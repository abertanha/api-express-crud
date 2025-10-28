import is from '@zarco/isness'
import { BaseRules } from '../../base/BaseRules.ts'
import isValidCPF from '../../utilities/Cpf.ts'
import isValidBirthDate from '../../utilities/BirthDate.ts'


export class UserRules extends BaseRules {
  constructor() {
    super()

    this.rc.addRule('name', {
      validator: (value: any) => {
        if(!is.string(value)) return false;
        if(value.length < 3 || value.length > 100) return false;
        return true;
      },
      message: 'O nome inserido é inválido (3-100 caracteres)',
    })

    this.rc.addRule('cpf', {
      validator: (value: any) => {
        if (!is.string(value)) return false;
        const result = isValidCPF(value);
        return result;
      },
      message: 'O CPF informado é inválido',
    })

    this.rc.addRule('email', {
      validator: (value: string) => {
        if(is.string(value) &&
          is.email(value)){
          return true;
        }
          return false;  
      },
      message: 'Email deve ter formato válido',
    })

    this.rc.addRule('birthDate', {
      validator: (value: any) => {
        if(!is.date(value)) return false;
        const result = isValidBirthDate(value);
        return result;
      },
      message: 'Data de nascimento inválida.',
    })

    this.rc.addRule('password', {
      validator: (value:any) => {
        if(!is.string(value)) return false;
        if(value.length < 8) return false;
        return true;
      },
      message: 'A senha deve ter no mínimo 8 caracteres.',
    })
  }
  // validateUserCreate(data: ICheckObj) {
  //   return this.validate({
  //     ...data,
  //     name: { value: data.name, isRequiredField: true, rule: 'name' },
  //     email: { value: data.email, isRequiredField: true, rule: 'email' },
  //     password: { value: data.password, isRequiredField: true, rule: 'password' },
  //     cpf: { value: data.cpf, isRequiredField: true },
  //     birthDate: { value: data.birthDate, isRequiredField: true }
  //   })
  // }
}