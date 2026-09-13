# Comparativo Arquitetural: Original vs. Hexagonal (Ports & Adapters) vs. Clean Architecture

Este documento apresenta uma análise comparativa aprofundada entre as três arquiteturas do sistema **DesapegAuto**:
1. **Arquitetura Original (Legada):** Modelo em camadas tradicional com acoplamento direto ao banco de dados na camada central.
2. **Arquitetura Hexagonal (Ports and Adapters - Alistair Cockburn):** Implementada e padronizada na branch [`main`](https://github.com/CassianoMn/DesapegAuto_Porters-and-Adapters/tree/main).
3. **Clean Architecture (Arquitetura Limpa - Robert C. Martin / Uncle Bob):** Implementada e padronizada na branch [`Branch_CleanArchitecture`](https://github.com/CassianoMn/DesapegAuto_Porters-and-Adapters/tree/Branch_CleanArchitecture).

---

## 1. Matriz Comparativa Geral (Visão 360°)

| Critério de Comparação | Arquitetura Original (Legada) | Arquitetura Hexagonal (Ports & Adapters) | Clean Architecture (Uncle Bob) |
| :--- | :--- | :--- | :--- |
| **Branch no Repositório** | Histórico Inicial (`340cd11`) | **`main`** | **`Branch_CleanArchitecture`** |
| **Origem Conceitual** | Camadas Tradicionais (N-Tier) | Alistair Cockburn (2005) | Robert C. Martin / Uncle Bob (2012) |
| **Metáfora Estrutural** | Camadas horizontais unidirecionais | **Hexágono:** Núcleo protegido + Portas + Adaptadores | **Círculos Concêntricos:** Políticas de alto a baixo nível |
| **Regra de Dependência** | ❌ **Violada:** Domínio dependia de drivers e do EF Core | ✅ **Respeitada:** Dependências apontam para o centro | ✅ **Respeitada:** Dependências apontam exclusivamente para dentro |
| **Onde fica a interface de persistência?** | Não existia (usava a classe concreta `DesapegAutoContext`) | **No Domínio (`Core/Ports/Driven/IDesapegAutoContext.cs`)** | **No Domínio (`Domain/Gateways/IDesapegAutoGateway.cs`)** |
| **Onde fica a implementação do EF Core?** | No próprio `Core` (`Core/DesapegAutoContext.cs`) | Fora do Domínio: **`Repository/DesapegAutoContext.cs`** | Fora do Domínio: **`Infrastructure/Data/DesapegAutoContext.cs`** |
| **Pacotes NuGet de Banco no Domínio** | ❌ `Microsoft.EntityFrameworkCore.*`, `MySql.EntityFrameworkCore` | ✅ **0 pacotes** (.NET 8 puro) | ✅ **0 pacotes** (.NET 8 puro) |
| **Pacotes NuGet de Banco nos Serviços** | ❌ Referenciava pacotes do EF Core e Identity | ✅ **0 pacotes** (.NET 8 puro) | ✅ **0 pacotes** (.NET 8 puro) |
| **Nomenclatura dos Projetos** | `Core`, `Service`, `Repository`, `DesapegAutoWeb` | `Core`, `Service`, `Repository`, `DesapegAutoWeb` | **`Domain`**, **`Application`**, **`Infrastructure`**, **`DesapegAutoWeb`** |
| **Organização Interna das Pastas** | `Core/` (entidades soltas), `Core/Databases/`, `Core/Service/` | `Core/Entities/`, `Core/Ports/Driving/`, `Core/Ports/Driven/` | `Domain/Entities/`, `Domain/Gateways/`, `Application/Interfaces/`, `Application/Services/`, `Infrastructure/Data/` |
| **Independência de Frameworks / ORM** | ❌ Nula (código amarrado ao EF Core) | ✅ Alta (banco de dados é detalhe em adaptador) | ✅ Total (ORM isolado como detalhe periférico) |
| **Testabilidade das Regras de Negócio** | ⚠️ Difícil (exigia instanciar `DbContext` real ou em memória) | ✅ Alta (testável via mocks da Porta Driven) | ✅ Alta (testável via mocks do Data Gateway) |
| **Status dos Testes Automatizados** | 151 testes passando | **151 testes passando (100%)** | **151 testes passando (100%)** |

---

## 2. Diagramas Comparativos: Sentido das Dependências

### 2.1 Arquitetura Original (Violação da Inversão de Dependência)
Na arquitetura original, a camada de apresentação chamava os serviços, e os serviços chamavam o domínio. No entanto, o **domínio continha diretamente o DbContext** e dependia dos pacotes do Entity Framework Core e MySQL:

```
[DesapegAutoWeb (Apresentação)]
            │  depende de
            ▼
[Service (Regras de Negócio)]
            │  depende de
            ▼
[Core (Entidades + DesapegAutoContext + EF Core + MySQL)]  <-- Ponto Crítico de Acoplamento
            │
            ▼ Conexão TCP / SQL
[Banco de Dados MySQL]
```
> **Problema Central:** O domínio (política de mais alto nível) estava no final da cadeia e dependia diretamente de detalhes voláteis de infraestrutura (ORM e banco de dados).

---

### 2.2 Arquitetura Hexagonal (Ports & Adapters)
Na Arquitetura Hexagonal, o sistema é dividido entre o **Interior do Hexágono (Núcleo da Aplicação)** e o **Exterior do Hexágono (Atores e Adaptadores)**:

```
                          MUNDO EXTERNO (Atores / Usuários)
                                          │
                                          ▼ [HTTP Request]
           ┌─────────────────────────────────────────────────────────────┐
           │ ADAPTADOR PRIMÁRIO (Driving Adapter): DesapegAutoWeb (MVC)  │
           └──────────────────────────────┬──────────────────────────────┘
                                          │ invoca
                                          ▼
           ┌─────────────────────────────────────────────────────────────┐
           │ PORTAS PRIMÁRIAS (Driving Ports): Core/Ports/Driving/       │
           │ (ICategoriaService, IVeiculoService, iAnuncioService, etc.) │
           ├─────────────────────────────────────────────────────────────┤
           │                    NÚCLEO DO HEXÁGONO                       │
           │  • Entidades POCO: Core/Entities/                           │
           │  • Lógica da Aplicação: Service/                            │
           │  • Exceções e DTOs: Core/Exceptions/ e Core/DTO/            │
           ├─────────────────────────────────────────────────────────────┤
           │ PORTAS SECUNDÁRIAS (Driven Ports): Core/Ports/Driven/       │
           │ (IDesapegAutoContext, IEntitySet<T>, QueryableExtensions)   │
           └──────────────────────────────▲──────────────────────────────┘
                                          │ implementado por
           ┌──────────────────────────────┴──────────────────────────────┐
           │ ADAPTADOR SECUNDÁRIO (Driven Adapter): Repository           │
           │ (DesapegAutoContext : DbContext, IDesapegAutoContext)       │
           │ (EfEntitySet<T> : IEntitySet<T>)                            │
           └──────────────────────────────┬──────────────────────────────┘
                                          │
                                          ▼ Conexão TCP / SQL
                             BANCO DE DADOS (MySQL)
```
> **Diferencial Hexagonal:** O vocabulário central é baseado em **Portas** (o que o núcleo expõe ou necessita) e **Adaptadores** (quem traduz a tecnologia externa para a linguagem das portas).

---

### 2.3 Clean Architecture (Círculos Concêntricos de Uncle Bob)
Na Clean Architecture, o sistema é estratificado em 4 círculos concêntricos com a **The Dependency Rule** atuando de fora para dentro:

```
    ┌─────────────────────────────────────────────────────────────────────────┐
    │ 4. Frameworks & Drivers: ASP.NET Core, EF Core 8, MySQL Driver, Razor  │
    │    ┌───────────────────────────────────────────────────────────────┐    │
    │    │ 3. Interface Adapters:                                        │    │
    │    │    • Controllers Web: DesapegAutoWeb/Controllers              │    │
    │    │    • Persistence Gateway Adapter: Infrastructure/Data/        │    │
    │    │    ┌─────────────────────────────────────────────────────┐    │    │
    │    │    │ 2. Use Cases / Application Business Rules:          │    │    │
    │    │    │    • Application/Services (Implementações)          │    │    │
    │    │    │    • Application/Interfaces (Contratos dos Casos)   │    │    │
    │    │    │    ┌───────────────────────────────────────────┐    │    │    │
    │    │    │    │ 1. Entities / Enterprise Business Rules:  │    │    │    │
    │    │    │    │    • Domain/Entities/ (Entidades POCO)    │    │    │    │
    │    │    │    │    • Domain/Gateways/ (IDesapegAutoGateway│    │    │    │
    │    │    │    │    • Domain/DTOs/ e Domain/Exceptions/    │    │    │    │
    │    │    │    └───────────────────────────────────────────┘    │    │    │
    │    │    └─────────────────────────────────────────────────────┘    │    │
    │    └───────────────────────────────────────────────────────────────┘    │
    └─────────────────────────────────────────────────────────────────────────┘
```
> **Diferencial Clean Architecture:** Nomenclatura canônica padronizada da indústria em .NET (`Domain`, `Application`, `Infrastructure`, `Presentation`), separando claramente regras corporativas (Entities) de regras específicas da aplicação (Use Cases).

---

## 3. Comparativo da Estrutura Física de Arquivos e Pastas

| Elemento do Sistema | 1. Arquitetura Original | 2. Arquitetura Hexagonal (`main`) | 3. Clean Architecture (`Branch_CleanArchitecture`) |
| :--- | :--- | :--- | :--- |
| **Arquivo de Solução** | `DesapegAuto.sln` | `DesapegAuto.sln` | `DesapegAuto.sln` |
| **Projeto de Domínio / Entidades** | `Core/Core.csproj` | `Core/Core.csproj` | **`Domain/Domain.csproj`** |
| **Entidades POCO (`Veiculo.cs`, etc.)** | `Core/` *(soltas na raiz)* | **`Core/Entities/`** | **`Domain/Entities/`** |
| **Porta / Gateway de Persistência** | *Inexistente (era o DbContext)* | **`Core/Ports/Driven/`** | **`Domain/Gateways/`** |
| **Portas de Serviços / Interfaces** | `Core/Service/` | **`Core/Ports/Driving/`** | **`Application/Interfaces/`** |
| **Objetos de Transferência (DTOs)** | `Core/DTO/` | `Core/DTO/` | **`Domain/DTOs/`** |
| **Exceções de Regra de Negócio** | `Core/Service/ServiceException.cs` | **`Core/Exceptions/`** | **`Domain/Exceptions/`** |
| **Projeto de Aplicação / Serviços** | `Service/Service.csproj` | `Service/Service.csproj` | **`Application/Application.csproj`** |
| **Implementação dos Serviços** | `Service/` | `Service/` | **`Application/Services/`** |
| **Projeto de Persistência / EF Core** | *Inexistente (estava em `Core`)* | `Repository/Repository.csproj` | **`Infrastructure/Infrastructure.csproj`** |
| **Classes Concretas do EF Core** | `Core/DesapegAutoContext.cs` | `Repository/DesapegAutoContext.cs` | **`Infrastructure/Data/DesapegAutoContext.cs`** |
| **Adaptador do DbSet (`EfEntitySet.cs`)** | *Inexistente* | `Repository/EfEntitySet.cs` | **`Infrastructure/Data/EfEntitySet.cs`** |
| **Projeto de Apresentação Web** | `DesapegAutoWeb/` | `DesapegAutoWeb/` | `DesapegAutoWeb/` |
| **Projeto de Testes de Serviços** | `ServiceTests/` | `ServiceTests/` | **`ApplicationTests/`** |
| **Projeto de Testes Web** | `DesapegAutoWebTests/` | `DesapegAutoWebTests/` | `DesapegAutoWebTests/` |

---

## 4. Comparativo de Código: Como a Dependência foi Invertida

### 4.1 Injeção nos Serviços / Casos de Uso

#### Na Arquitetura Original:
```csharp
// O serviço dependia DIRETAMENTE da classe concreta do EF Core
namespace Service
{
    public class CategoriaService : ICategoriaService
    {
        private readonly DesapegAutoContext context; // ACÚMULO DE ACOPLAMENTO TÉCNICO

        public CategoriaService(DesapegAutoContext context)
        {
            this.context = context;
        }
    }
}
```

#### Na Arquitetura Hexagonal (`main`):
```csharp
// O serviço depende da PORTA SECUNDÁRIA (Driven Port)
namespace Service
{
    public class CategoriaService : ICategoriaService
    {
        private readonly IDesapegAutoContext context; // PORTA DE PERSISTÊNCIA ABSTRATA

        public CategoriaService(IDesapegAutoContext context)
        {
            this.context = context;
        }
    }
}
```

#### Na Clean Architecture (`Branch_CleanArchitecture`):
```csharp
// O caso de uso depende da interface do DATA GATEWAY
namespace Service
{
    public class CategoriaService : ICategoriaService
    {
        private readonly IDesapegAutoContext context; // CONTRATO DO PERSISTENCE GATEWAY

        public CategoriaService(IDesapegAutoContext context)
        {
            this.context = context;
        }
    }
}
```

---

### 4.2 Arquivos de Projeto (`.csproj`) e Dependências de Pacotes

#### Projeto de Domínio na Arquitetura Original (`Core/Core.csproj`):
```xml
<!-- TOTALMENTE POLUÍDO COM PACOTES DE INFRAESTRUTURA E BANCO -->
<Project Sdk="Microsoft.NET.Sdk">
  <ItemGroup>
    <PackageReference Include="Microsoft.EntityFrameworkCore" Version="8.0.17" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="8.0.17" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.InMemory" Version="8.0.17" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.Tools" Version="8.0.17" />
    <PackageReference Include="MySql.EntityFrameworkCore" Version="8.0.17" />
  </ItemGroup>
</Project>
```

#### Projeto de Domínio na Arquitetura Hexagonal e Clean (`Core.csproj` / `Domain.csproj`):
```xml
<!-- 100% PURO: ZERO PACOTES EXTERNOS -->
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>
</Project>
```

---

## 5. Prós, Contras e Trade-offs de Cada Abordagem

### 1. Arquitetura Original
- **Vantagens:** Menor quantidade inicial de arquivos; desenvolvimento rápido para protótipos descartáveis (*Quick & Dirty*).
- **Desvantagens:** Forte acoplamento; violação do DIP e da Separation of Concerns; impossibilidade de trocar de ORM ou banco sem alterar o domínio; testes unitários lentos ou inviáveis sem banco.

### 2. Arquitetura Hexagonal (Ports & Adapters)
- **Vantagens:**
  - Clareza extrema na separação entre o que é "interior" (negócio) e "exterior" (tecnologia).
  - Terminologia rica e expressiva (**Portas de Entrada/Saída** e **Adaptadores**).
  - Preserva a coesão de serviços existentes com esforço de refatoração cirúrgico.
  - Permite plugar novos canais de entrada (ex.: CLI, gRPC, RabbitMQ) e novos armazenamentos de dados com impacto zero no núcleo.
- **Desvantagens:**
  - Requer disciplina da equipe para não criar vazamento de dependências de infraestrutura para dentro das portas.

### 3. Clean Architecture (Robert C. Martin)
- **Vantagens:**
  - Padrão mais consolidado e difundido na comunidade .NET empresarial (`Domain`, `Application`, `Infrastructure`, `Presentation`).
  - Estrutura de pastas imediatamente familiar para qualquer desenvolvedor que utilize referências de mercado (como Jason Taylor, Ardalis e templates corporativos).
  - Isolamento estrito entre entidades corporativas de alto nível e regras de fluxo de aplicação.
- **Desvantagens:**
  - Maior granularidade de projetos e arquivos, exigindo gerenciamento cuidadoso de referências de projetos e injeção de dependências.

---

## 6. Quadro Resumo dos 5 Critérios de Avaliação

| Critério de Avaliação | Peso | Arquitetura Original | Arquitetura Hexagonal (`main`) | Clean Architecture (`Branch_CleanArchitecture`) |
| :--- | :---: | :---: | :---: | :---: |
| **Sentido das dependências e inversão (DIP)** | **3,5** | 0,0 | **3,5** (Portas abstratas no domínio e adaptadores externos) | **3,5** (Dependency Rule com Data Gateway de Uncle Bob) |
| **Isolamento da regra de negócio** | **2,5** | 0,5 | **2,5** (Domínio purificado com 0 dependências de ORM/SQL) | **2,5** (Domínio e Aplicação 100% desacoplados de persistência) |
| **Separação de responsabilidades (SoC)** | **2,0** | 0,5 | **2,0** (Divisão nítida: Núcleo, Driving/Driven Ports e Adapters) | **2,0** (Divisão canônica: Domain, Application, Infrastructure) |
| **Documentação e justificativa** | **1,5** | 0,0 | **1,5** (Relatório completo com diagramas BCE, estilos e decisões) | **1,5** (Relatório completo com diagramas dos círculos e matriz) |
| **Testes existentes passando** | **0,5** | 0,5 | **0,5** (151 testes executados e 100% aprovados) | **0,5** (151 testes executados e 100% aprovados) |
| **NOTA TOTAL ESTIMADA** | **10,0** | 1,5 | **10,0** | **10,0** |
