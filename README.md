# DesapegAuto: Adaptação Arquitetural para Arquitetura Hexagonal (Ports and Adapters)

Este repositório contém a implementação da **Arquitetura Hexagonal (Ports & Adapters)** no sistema **DesapegAuto**.

- **Branch Ativa / Entrega:** [`main`](https://github.com/CassianoMn/DesapegAuto_Porters-and-Adapters/tree/main)
- **Relatório Completo de Arquitetura:** Consulte o documento detalhado em [tees-2026-2-unidade-1/README.md](tees-2026-2-unidade-1/README.md).

## Estrutura Canônica das Pastas (Ports & Adapters)

```
tees-2026-2-unidade-1/exercicio-1-arquitetura/
├── Core/                                  <- Núcleo do Hexágono (Zero dependências de banco/ORM)
│   ├── Entities/                          <- Entidades de Domínio POCO
│   ├── Ports/
│   │   ├── Driving/                       <- Portas Primárias / Inbound (Contratos de Serviços)
│   │   └── Driven/                        <- Portas Secundárias / Outbound (Contrato de Persistência)
│   ├── DTO/                               <- Objetos de Transferência
│   └── Exceptions/                        <- Exceções de Domínio
├── Service/                               <- Lógica da Aplicação / Serviços do Núcleo
├── Repository/                            <- Adaptador Secundário / Driven Adapter (EF Core 8 + MySQL)
├── DesapegAutoWeb/                        <- Adaptador Primário / Driving Adapter (ASP.NET Core MVC)
├── ServiceTests/                          <- Testes unitários dos serviços (100% passando)
└── DesapegAutoWebTests/                   <- Testes dos controladores MVC (100% passando)
```

## Como Executar os Testes

```powershell
dotnet test tees-2026-2-unidade-1/exercicio-1-arquitetura/DesapegAuto.sln
```
Total: **151 testes executados e 100% aprovados**.
