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
- Autentificação baseada em identificação do usuário
- Criação e gerenciamento de conta bancária, autorização baseada em propriedade

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
    deno task dev
    # ou
    deno run --allow-net --allow-env main.ts
    ```
- Execute testes    
    ```bash    
    deno test --watch
    ```
- Gerar relatório de cobertura
    ```bash
    deno test --coverage=coverage/
    # Visualizar relatório
    deno coverage coverage/
    ```
