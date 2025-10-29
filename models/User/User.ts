import { IUser } from "./IUser.ts";
import { BaseSchema } from "../../base/BaseSchema.ts";
import isValidCPF from "../../utilities/Cpf.ts";
import isValidBirthDate from "../../utilities/BirthDate.ts";
import aggregatePaginate from 'npm:mongoose-aggregate-paginate-v2'


class UserClass implements IUser {
    name: IUser['name'];
    email: IUser['email'];
    password: IUser['password'];
    cpf: IUser['cpf'];
    birthDate: IUser['birthDate'];

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
          validator: function(v: any) {
            return isValidCPF(v); 
          }, 
          message: (props: any) => `${props.value} não é um CPF válido!` 
        },
        required: [true, 'Insira seu CPF'] 
      },
      birthDate: { 
        type: Date,
        validate: {
          validator: function(v: any) {
            return isValidBirthDate(v)
          },
          message: (props: any) => `${props.value} não é uma data de aniversário válida.`
        },
        required: [true, 'O aniversário precisa ser informado'] 
      },
      isActive: {
        type: Boolean,
        default: true,
        index: true,
      },
    })
  } 
}

const UserSchema = new UserSchemaClass().schema;
UserSchema.loadClass(UserClass);
UserSchema.plugin(aggregatePaginate);


export { UserSchema };