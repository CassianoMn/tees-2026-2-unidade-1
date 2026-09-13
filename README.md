# DesapegAuto: Adaptação Arquitetural para Clean Architecture

Este repositório contém a implementação da **Clean Architecture (Arquitetura Limpa)** no sistema **DesapegAuto**.

- **Branch Ativa / Entrega:** [`Branch_CleanArchitecture`](https://github.com/CassianoMn/DesapegAuto_Porters-and-Adapters/tree/Branch_CleanArchitecture)
- **Relatório Completo de Arquitetura:** Consulte o documento detalhado em [tees-2026-2-unidade-1/README.md](tees-2026-2-unidade-1/README.md).

## Estrutura Canônica das Camadas (.NET 8)

```
tees-2026-2-unidade-1/exercicio-1-arquitetura/
├── Domain/              <- Entities, Gateways (Ports), DTOs, Exceptions (Zero dependências de ORM/banco)
├── Application/         <- Use Cases / Interfaces & Serviços da Aplicação
├── Infrastructure/      <- Data Gateways (Adapters) com Entity Framework Core 8 e MySQL
├── DesapegAutoWeb/      <- Apresentação Web ASP.NET Core MVC e composição de DI
├── ApplicationTests/    <- Testes unitários dos casos de uso (100% passando)
└── DesapegAutoWebTests/ <- Testes dos controladores MVC (100% passando)
```

## Como Executar os Testes

```powershell
dotnet test tees-2026-2-unidade-1/exercicio-1-arquitetura/DesapegAuto.sln
```
Total: **151 testes executados e 100% aprovados**.
