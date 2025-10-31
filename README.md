# API EXPRESS CRUD
## _Tarefa para triha back-end_

Esse á uma API-CRUD minimalista realizada com a biblioteca express e tem sua persistência de dados garantida
pelo Atlas da MongoDB.

- Mongoose ODM
- Mongo DB - Altas
- Express web framework
- TypeScript como linguagem

## Funcionalidades

- CRUD básico para usuários
- Operações Financeiras (Deposito, Saque e Transferência)
- Autenticação baseada em identidade do usuário (JWT)
- Criação e gerenciamento de conta bancária, autorização baseada em propriedade(PBAC)

## Como executar
- clone esse repo
    ```bash
    git clone git@github.com:abertanha/api-express-crud.git
    cd api-express-crud
    ```
    
- Instale Deno (se necessário)
    ```bash
    curl -fsSL https://deno.land/install.sh | sh
    # Adicione Deno ao PATH (se instalado via script)
    export PATH="$HOME/.deno/bin:$PATH"
    ```
- Instale dependências
    ```bash
    deno install
    # Execute
    deno run dev
    ```
- Execute testes    
    ```bash    
    deno run test:watch
    ```
- Gerar relatório de cobertura
    ```bash
    deno run test:coverage
    # Visualizar relatório
    deno coverage coverage/
    ```
## Rotas do sistema
## API Endpoints

### Auth (`/api/auth`)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `POST` | `/login` | ❌ | Autentica usuário (retorna JWT + RefreshToken) |
| `POST` | `/logout` | ✅ | Invalida RefreshToken no banco |
| `POST` | `/refresh` | ❌ | Renova JWT usando RefreshToken |
| `GET` | `/me` | ✅ | Retorna dados do usuário logado |

### Users (`/api/users`)

| Método | Rota | Auth | Ownership | Descrição |
|--------|------|------|-----------|-----------|
| `POST` | `/` | ❌ | - | Cria novo usuário (registro público) |
| `GET` | `/` | ✅ | - | Lista usuários com paginação |
| `GET` | `/:id` | ✅ | ✅ Busca usuário por ID (apenas próprio) |
| `PUT` | `/:id` | ✅ | ✅ | Atualiza dados do usuário |
| `PATCH` | `/:id/deactivate` | ✅ | ✅ | Desativa usuário (soft delete) |
| `PATCH` | `/:id/reactivate` | ✅ | ✅ | Reativa usuário desativado |

### Accounts (`/api/accounts`)

| Método | Rota | Auth | Ownership | Descrição |
|--------|------|------|-----------|-----------|
| `POST` | `/` | ✅ | - | Cria nova conta bancária |
| `GET` | `/` | ✅ | - | Lista contas do usuário logado |
| `GET` | `/:id` | ✅ | ✅ | Busca conta por ID |
| `GET` | `/:id/balance` | ✅ | ✅ | Consulta saldo da conta |
| `PUT` | `/:id` | ✅ | ✅ | Atualiza tipo da conta |
| `POST` | `/:id/deposit` | ✅ | ❌ | Depósito externo (caixa/TED) |
| `POST` | `/:id/withdraw` | ✅ | ✅ | Realiza saque da conta |
| `PATCH` | `/:id/deactivate` | ✅ | ✅ | Desativa conta (requer saldo zero) |
| `PATCH` | `/:id/reactivate` | ✅ | ✅ | Reativa conta desativada |
| `GET` | `/user/:userId` | ✅ | ✅ | Lista contas de um usuário |
| `GET` | `/user/:userId/total-balance` | ✅ | ✅ | Saldo total de todas as contas |
| `POST` | `/transfer` | ✅ | ✅ | Transferência entre contas (atômica) |

### Transactions (`/api/transactions`)

| Método | Rota | Auth | Ownership | Descrição |
|--------|------|------|-----------|-----------|
| `GET` | `/:id` | ✅ | ✅ | Busca transação por ID |
| `GET` | `/account/:accountId` | ✅ | ✅ | Lista transações de uma conta |
| `GET` | `/account/:accountId/type/:type` | ✅ | ✅ | Filtra transações por tipo |
| `GET` | `/account/:accountId/stats` | ✅ | ✅ | Estatísticas da conta |
| `GET` | `/transfers/:accountId1/:accountId2` | ✅ | - | Transferências entre duas contas |

**Legenda:**
- ✅ = Requerido
- ❌ = Não requerido
- **Auth** = Autenticação JWT
- **Ownership** = Validação de propriedade (PBAC)

## Arquivos do sistema
.
├── database
│   ├── Database.ts
│   ├── db
│       └── bankingDB.ts
├── deno.json
├── deno.lock
├── docs
│   ├── custom
│   │   ├── swagger.css
│   │   └── swagger.js
│   ├── jsons
│   │   └── Banking_API_0.0.1.swagger.json
│   └── Swagger.ts
├── features
│   ├── account
│   │   ├── AccountController.test.ts
│   │   ├── AccountController.ts
│   │   ├── AccountRouter.ts
│   │   ├── AccountRules.ts
│   │   ├── AccountService.ts
│   │   └── mocks
│   │       ├── MockAccountRepository.ts
│   │       └── MockAccountService.ts
│   ├── auth
│   │   ├── AuthController.test.ts
│   │   ├── AuthController.ts
│   │   ├── AuthRouter.ts
│   │   ├── AuthService.ts
│   │   └── mocks
│   │       ├── MockAuthRepository.ts
│   │       └── MockAuthService.ts
│   ├── transaction
│   │   ├── mocks
│   │   │   ├── MockTransactionRepository.ts
│   │   │   └── MockTransactionService.ts
│   │   ├── TransactionController.test.ts
│   │   ├── TransactionController.ts
│   │   ├── TransactionRouter.ts
│   │   ├── TransactionRules.ts
│   │   └── TransactonService.ts
│   └── user
│       ├── mocks
│       │   ├── MockUserRepository.ts
│       │   └── MockUserService.ts
│       ├── UserController.test.ts
│       ├── UserController.ts
│       ├── UserRouter.ts
│       ├── UserRules.ts
│       └── UserService.ts
├── middlewares
│   ├── AuthMiddleware.ts
│   ├── OwnershipMiddleware.ts
│   ├── PaginationMiddle.ts
│   └── ResponserrorMiddle.ts
├── models
│   ├── Account
│   │   ├── AccountRepository.ts
│   │   ├── Account.ts
│   │   └── IAccount.ts
│   ├── RefreshToken
│   │   ├── IRefreshToken.ts
│   │   ├── RefreshTokenRepository.ts
│   │   └── RefreshToken.ts
│   ├── shared
│   │   ├── counterSchema.ts
│   │   └── ICounter.ts
│   ├── Transaction
│   │   ├── ITransaction.ts
│   │   ├── TransactionRepository.ts
│   │   └── Transaction.ts
│   └── User
│       ├── IUser.ts
│       ├── UserRepository.ts
│       └── User.ts
├── README.md
├── routes
│   ├── AccountRouter.ts
│   ├── DocsRouter.ts
│   ├── TransactionRouter.ts
│   └── UserRouter.ts
├── server.ts
├── types
│   └── express
│       └── index.d.ts
└── utilities
    ├── BirthDate.ts
    ├── Colors.ts
    ├── Cpf.ts
    ├── Print.ts
    └── Time.ts
