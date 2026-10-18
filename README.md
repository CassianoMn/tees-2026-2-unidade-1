# Tópicos Especiais em Engenharia de Software (2026.2) — Unidade 1

[![.NET 8](https://img.shields.io/badge/.NET-8.0-512BD4?logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![C#](https://img.shields.io/badge/C%23-239120?logo=csharp&logoColor=white)](https://docs.microsoft.com/pt-br/dotnet/csharp/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![GraphQL](https://img.shields.io/badge/GraphQL-E10098?logo=graphql&logoColor=white)](https://graphql.org/)
[![REST](https://img.shields.io/badge/API-REST%20(JSON)-02569B?logo=postman&logoColor=white)](https://restfulapi.net/)
[![Tests DesapegAuto](https://img.shields.io/badge/Testes%20.NET-151%20Aprovados-success?logo=checkmarx&logoColor=white)](tees-2026-2-unidade-1/exercicio-1-arquitetura)
[![Tests Protocolos](https://img.shields.io/badge/Testes%20Node.js-20%20Aprovados-success?logo=checkmarx&logoColor=white)](tees-2026-2-unidade-1/exercicio-2-protocolos)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Repositório oficial das entregas práticas e relatórios técnicos da **Unidade 1** da disciplina **Tópicos Especiais em Engenharia de Software (TEES - 2026.2)** do curso de Sistemas de Informação da **Universidade Federal de Sergipe (UFS)**, ministrada pelo Prof. Dr. Marcos Dósea.

---

## 📌 Sumário da Unidade 1

A unidade compreende dois projetos principais de engenharia de software avançada:

| Módulo | Projeto | Foco Técnico | Stack | Status dos Testes |
| :--- | :--- | :--- | :--- | :---: |
| **Exercício 1** | [**DesapegAuto: Adaptação Arquitetural**](tees-2026-2-unidade-1/exercicio-1-arquitetura/README.md) | **Arquitetura Hexagonal (Ports & Adapters)**, Inversão de Dependência, isolamento do ORM (EF Core) e banco (MySQL). | C# / ASP.NET Core (.NET 8), EF Core, MySQL, MSTest, Moq | **151/151 Aprovados (100%)** |
| **Exercício 1** | [**Quadro Comparativo de Arquiteturas**](tees-2026-2-unidade-1/exercicio-1-arquitetura/COMPARATIVO_ARQUITETURAS.md) | Análise 360° comparando **Arquitetura Original (Legada)** vs. **Hexagonal (`main`)** vs. **Clean Architecture (`Branch_CleanArchitecture`)**. | Engenharia de Software, Modelagem Arquitetural | Documentação Completa |
| **Exercício 2** | [**APIs e Protocolos: Rede Social**](tees-2026-2-unidade-1/exercicio-2-protocolos/README.md) | Estudo comparativo e implementação prática de **REST (JSON)** vs. **GraphQL** sobre o mesmo domínio compartilhado. | Node.js, Express, GraphQL, GraphiQL, Suíte Automatizada | **20/20 Aprovados (100%)** |
| **Exercício 2** | [**Guia de Exemplos REST (JSON)**](tees-2026-2-unidade-1/exercicio-2-protocolos/rest-json/README.md) | Documentação de endpoints REST, payloads, status codes e 10 exemplos copiáveis de requisição/resposta. | REST / HTTP / cURL | Documentação Completa |
| **Exercício 2** | [**Guia de Exemplos GraphQL**](tees-2026-2-unidade-1/exercicio-2-protocolos/graphql/README.md) | Documentação de Schema SDL, Types, Queries, Mutations e 10 exemplos copiáveis de consultas no grafo. | GraphQL SDL / GraphiQL | Documentação Completa |

---

## 🏛️ Exercício 1: Adaptação Arquitetural no DesapegAuto

O **DesapegAuto** é um sistema web para gestão e anúncio de veículos seminovos e usados por concessionárias e usuários.

### Objetivo da Refatoração
A versão original em camadas tradicionais violava a Inversão de Dependência: a camada central de domínio (`Core`) continha diretamente o `DbContext` e dependia dos pacotes do Entity Framework Core e MySQL.

A remodelação aplicou a **Arquitetura Hexagonal (Ports & Adapters - Alistair Cockburn)**:
- **Núcleo Hexagonal (`Core`):** 100% puro em C# .NET 8 (zero dependências de bibliotecas de banco de dados e ORM).
- **Portas Primárias / Inbound (`Core/Ports/Driving`):** Contratos de serviços de aplicação (`ICategoriaService`, `IModeloService`, `IVeiculoService`, etc.).
- **Portas Secundárias / Outbound (`Core/Ports/Driven`):** Contratos de persistência e repositório (`IDesapegAutoContext`, `IEntitySet<T>`).
- **Adaptador Primário / Driving Adapter (`DesapegAutoWeb`):** Aplicação ASP.NET Core MVC que consome as portas de serviço.
- **Adaptador Secundário / Driven Adapter (`Repository`):** Implementação concreta de acesso a dados com EF Core 8 e MySQL.

```
                              HEXÁGONO DESAPEGAUTO
    ┌────────────────────────────────────────────────────────────────────────┐
    │  Adaptador Primário (Driving)                                          │
    │  [DesapegAutoWeb (ASP.NET MVC)]                                        │
    │         │                                                              │
    │         ▼ chama                                                        │
    │  Portas Primárias (Driving Ports - Core/Ports/Driving)                 │
    │  ┌──────────────────────────────────────────────────────────────────┐  │
    │  │ Núcleo da Aplicação (Core + Service)                             │  │
    │  │  - Entidades de Domínio POCO (Core/Entities)                     │  │
    │  │  - Regras de Negócio e Serviços (Service)                        │  │
    │  │  - Exceções e DTOs (Core/Exceptions, Core/DTO)                   │  │
    │  │                                                                  │  │
    │  │  Portas Secundárias (Driven Ports - Core/Ports/Driven)            │  │
    │  │  - IDesapegAutoContext, IEntitySet<T>                            │  │
    │  └─────────────────────────────────┬────────────────────────────────┘  │
    │                                    │ implementado por                  │
    │                                    ▼                                   │
    │  Adaptador Secundário (Driven)                                         │
    │  [Repository (EF Core 8 + MySQL)]                                      │
    └────────────────────────────────────────────────────────────────────────┘
```

### Como Executar os Testes do DesapegAuto (.NET 8)

```powershell
# Compilar a solução
dotnet build tees-2026-2-unidade-1/exercicio-1-arquitetura/DesapegAuto.sln --nologo

# Executar a suíte de testes automatizados (151 testes)
dotnet test tees-2026-2-unidade-1/exercicio-1-arquitetura/DesapegAuto.sln --nologo --verbosity minimal
```

- **Total:** **151 testes** (72 em `ServiceTests` e 79 em `DesapegAutoWebTests`), **100% aprovados**.
- Para mais detalhes, consulte o [**Relatório Completo de Arquitetura**](tees-2026-2-unidade-1/exercicio-1-arquitetura/README.md) e o [**Quadro Comparativo das 3 Arquiteturas**](tees-2026-2-unidade-1/exercicio-1-arquitetura/COMPARATIVO_ARQUITETURAS.md).

---

## 🌐 Exercício 2: APIs e Protocolos (Rede Social: REST vs. GraphQL)

Implementação e análise comparativa prática entre os protocolos **REST (JSON)** e **GraphQL** aplicados exatamente sobre o mesmo modelo de domínio de uma Rede Social, compartilhando a mesma fonte de regras de negócio em memória (`src/domain/store.js`).

### O Domínio da Rede Social (6 Entidades)
1. **`Usuario`**: dados cadastrais (`id`, `nome`, `email`, `criado_em`).
2. **`Perfil`** *(1:1 com Usuário)*: `bio`, `avatar_url`, `localizacao`.
3. **`Post`** *(1:N com Usuário)*: `texto`, `usuario_id`, `criado_em`.
4. **`Comentario`** *(N:M com atributo entre Usuário e Post)*: texto do comentário associando autor e post.
5. **`Curtida`** *(N:M puro entre Usuário e Post)*: registro de likes únicos por usuário.
6. **`Seguidor`** *(N:M auto-relacionamento em Usuário)*: conexões de seguidores e seguindo.

### As 10 Operações Obrigatórias em Ambos os Protocolos

| Categoria | Operação | REST (JSON) | GraphQL |
| :--- | :--- | :--- | :--- |
| **Comando 1** | `criar_usuario(nome, email)` | `POST /api/usuarios` | `mutation { criar_usuario(...) }` |
| **Comando 2** | `criar_post(usuario_id, texto)` | `POST /api/posts` | `mutation { criar_post(...) }` |
| **Comando 3** | `comentar(usuario_id, post_id, texto)` | `POST /api/posts/:id/comentarios` | `mutation { comentar(...) }` |
| **Comando 4** | `curtir(usuario_id, post_id)` | `POST /api/posts/:id/curtidas` | `mutation { curtir(...) }` |
| **Comando 5** | `seguir(usuario_id, alvo_id)` | `POST /api/usuarios/:id/seguindo` | `mutation { seguir(...) }` |
| **Consulta 1** | `buscar_usuario(id)` | `GET /api/usuarios/:id` | `query { buscar_usuario(...) }` |
| **Consulta 2** | `posts_do_usuario(usuario_id)` | `GET /api/usuarios/:id/posts` | `query { posts_do_usuario(...) }` |
| **Consulta 3** | `buscar_post(id)` | `GET /api/posts/:id` | `query { buscar_post(...) }` |
| **Consulta 4** | `seguidores_de` / `seguindo_de` | `GET /api/usuarios/:id/seguidores` e `/seguindo` | `query { seguidores_de(...) seguindo_de(...) }` |
| **Consulta 5** | `feed_do_usuario(usuario_id)` | `GET /api/usuarios/:id/feed` | `query { feed_do_usuario(...) }` |

### Comparativo Sintético: REST vs. GraphQL

| Critério | REST (JSON) | GraphQL |
| :--- | :--- | :--- |
| **Paradigma** | Orientado a recursos (URLs e verbos HTTP) | Orientado a grafo e consultas declarativas |
| **Over-fetching & Under-fetching** | Vulnerável: endpoints retornam DTO fixo, exigindo múltiplas requisições encadeadas | Eliminado: o cliente declara exatamente os campos que deseja receber em uma única requisição |
| **Cache em Rede** | Nativo e trivial via cabeçalhos HTTP (`Cache-Control`, `ETag`) e proxies/CDNs | Requer soluções de cache em nível de aplicação (DataLoader, Apollo Client, persisted queries) |
| **Semântica e Erros** | Aproveita status codes HTTP padronizados (`200`, `201`, `400`, `404`, `409`) | Sempre responde HTTP `200 OK` (erros retornados no array `"errors"` do payload JSON) |
| **Interface Interativa** | Postman, Swagger/OpenAPI | GraphiQL embutido (`http://localhost:3000/graphql`) com auto-complete do schema |

### Como Executar e Testar a Rede Social (Node.js)

```bash
# Navegar até a pasta do exercício 2
cd tees-2026-2-unidade-1/exercicio-2-protocolos

# Instalar as dependências
npm install

# Executar a suíte de testes automatizados (20 testes)
npm test

# Iniciar o servidor unificado (porta 3000)
npm start
```

Com o servidor iniciado:
- **Visão Geral da API:** `http://localhost:3000/`
- **Endpoints REST:** `http://localhost:3000/api`
- **GraphiQL Playground Interativo:** `http://localhost:3000/graphql`

---

## 📁 Estrutura Canônica de Diretórios

```text
DesapegAuto_Porters-and-Adapters/
├── README.md                                      # Visão geral unificada da Unidade 1
├── LICENSE                                        # Licença MIT do projeto
└── tees-2026-2-unidade-1/                         # Diretório oficial das atividades da disciplina
    ├── exercicio-1-arquitetura/                   # Atividade 01: Arquitetura Hexagonal (.NET 8)
    │   ├── README.md                              # Relatório técnico completo de arquitetura
    │   ├── COMPARATIVO_ARQUITETURAS.md            # Quadro comparativo (Original vs Hexagonal vs Clean)
    │   ├── DesapegAuto.sln                        # Solução Visual Studio / .NET 8
    │   ├── Core/                                  # Núcleo do Hexágono (Zero dependências externas)
    │   │   ├── Entities/                          # Entidades de Domínio POCO
    │   │   ├── Ports/
    │   │   │   ├── Driving/                       # Portas Primárias / Inbound (Serviços)
    │   │   │   └── Driven/                        # Portas Secundárias / Outbound (Persistência)
    │   │   ├── DTO/                               # Objetos de Transferência de Dados
    │   │   └── Exceptions/                        # Exceções de Domínio
    │   ├── Service/                               # Serviços de Aplicação e Regras de Negócio
    │   ├── Repository/                            # Adaptador Secundário / Driven (EF Core 8 + MySQL)
    │   ├── DesapegAutoWeb/                        # Adaptador Primário / Driving (ASP.NET Core MVC)
    │   ├── ServiceTests/                          # Testes unitários de serviços (MSTest + Moq)
    │   ├── DesapegAutoWebTests/                   # Testes unitários de controladores MVC
    │   └── AnaliseProjeto/                        # Modelos conceituais e diagramas
    └── exercicio-2-protocolos/                    # Atividade 02: APIs e Protocolos (Node.js)
        ├── README.md                              # Documentação geral da atividade e comparativo
        ├── package.json                           # Scripts e dependências do projeto
        ├── src/
        │   ├── index.js                           # Servidor unificado (REST em /api e GraphQL em /graphql)
        │   └── domain/
        │       └── store.js                       # Domínio compartilhado e banco em memória (6 entidades)
        ├── rest-json/
        │   ├── README.md                          # Guia REST + 10 exemplos copiáveis de requisição/resposta
        │   ├── routes.js                          # Rotas e controladores REST
        │   └── server.js                          # Servidor REST standalone
        ├── graphql/
        │   ├── README.md                          # Guia GraphQL + 10 exemplos copiáveis de queries/mutations
        │   ├── schema.js                          # Schema SDL (Types, Query, Mutation)
        │   ├── resolvers.js                       # Resolvers GraphQL conectando ao domínio
        │   └── server.js                          # Servidor GraphQL standalone + GraphiQL
        └── test/
            └── verify-all.js                      # Suíte de testes automatizados (20 testes ponta a ponta)
```

---

## 👨‍💻 Autor

**Cassiano Menezes**  
- Estudante de Sistemas de Informação — Universidade Federal de Sergipe (UFS)
- GitHub: [@CassianoMn](https://github.com/CassianoMn)
- LinkedIn: [Cassiano Menezes](https://linkedin.com/in/CassianoMn)
- Email: [cassianomenezes1@gmail.com](mailto:cassianomenezes1@gmail.com)
