import { IUser } from "./IUser.ts";
import { BaseSchema } from "../../base/BaseSchema.ts";
import isValidCPF from "../../utilities/Cpf.ts";
import isValidBirthDate from "../../utilities/BirthDate.ts";


class UserClass implements IUser {
    name: IUser['name']
    email: IUser['email']
    password: IUser['password']
    cpf: IUser['cpf']
    birthDate: IUser['birthDate']

    constructor(data: IUser){
        this.name = data.name;
        this.email = data.email;
        this.password = data.password;
        this.cpf = data.cpf;
        this.birthDate = data.birthDate;
    }
}

class UserSchemaClass extends BaseSchema {
  constructor() {
    super({
      name: { type: String, required: [true, 'O nome precisa ser informado'] }, 
      email: { type: String, required: [true, 'O Email precisa ser informado'], unique: true},
      password: { type: String, required: true, minLength: [8, "Mínimo de oito caracteres"]},
      cpf: { 
        type: String, 
        maxLength: 11,
        unique: true,
        validate:{
          validator: function(v) {
            return isValidCPF(v); 
          }, 
          message: cpf => `${cpf} não é um CPF válido!` 
        },
        required: [true, 'Insira seu CPF'] 
      },
      birthDate: { 
        type: Date,
        validate: {
          validator: function(v) {
            return isValidBirthDate(v)
          },
          message: birthDate => `${birthDate} não é uma data de aniversário válida.`
        },
        required: [true, 'O aniversário precisa ser informado'] 
      },
    })
  } 
}

const UserSchema = new UserSchemaClass().schema;
UserSchema.loadClass(UserClass);

export { UserSchema };