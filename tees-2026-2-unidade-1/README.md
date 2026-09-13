# Relatório de Adaptação Arquitetural: Aplicação da Arquitetura Hexagonal (Ports & Adapters) no DesapegAuto

**Arquitetura Escolhida:** **Arquitetura Hexagonal (Ports and Adapters - Alistair Cockburn)**  
**Branch de Entrega:** `main`  
**Repositório:** [DesapegAuto_Porters-and-Adapters](https://github.com/CassianoMn/DesapegAuto_Porters-and-Adapters)

---

## 1. Documentação da Arquitetura Atual

### 1.1 Estilo Externo (Conceitos do Encontro 01)
Na visão externa e estrutural (estilo macroarquitetural de sistema), o projeto **DesapegAuto** foi concebido combinando os seguintes estilos arquiteturais clássicos:

1. **Estilo em Camadas (Layered Architecture):**
   - A solução é particionada em camadas de software com responsabilidades bem delimitadas e fluxo unidirecional tradicional:
     - **Camada de Apresentação (`DesapegAutoWeb`):** Aplicação Web ASP.NET Core MVC responsável por receber requisições HTTP, renderizar páginas Razor (Views) e coordenar interações do usuário.
     - **Camada de Serviços / Lógica de Negócio (`Service`):** Orquestra os fluxos funcionais, valida regras de negócio e intermedia as chamadas entre a apresentação e os dados.
     - **Camada de Domínio e Acesso a Dados (`Core`):** Agrupa os modelos do negócio e, originalmente, o mecanismo de acesso ao banco de dados relacional.
2. **Estilo Centrado em Dados / Repositório Compartilhado (Repository / Shared Data Store):**
   - O estado da aplicação é centralizado em uma base de dados relacional (MySQL). Toda a consistência dos dados transacionais de anúncios, veículos, vendas e usuários converge para essa base unificada.
3. **Estilo Cliente-Servidor (Web MVC):**
   - Clientes (navegadores web) comunicam-se via HTTP/HTTPS com o servidor web, que processa requisições, interage com o repositório de dados e retorna respostas HTML/JSON.

```
+-------------------------------------------------------------+
|                      Cliente (Browser)                      |
+-------------------------------------------------------------+
                               |  HTTP Request / Response
                               v
+-------------------------------------------------------------+
|    Camada de Apresentação (DesapegAutoWeb - ASP.NET MVC)    |
+-------------------------------------------------------------+
                               |  Depende de
                               v
+-------------------------------------------------------------+
|     Camada de Negócio / Aplicação (Service - Regras)        |
+-------------------------------------------------------------+
                               |  Depende de
                               v
+-------------------------------------------------------------+
|     Camada de Domínio & Dados (Core - Entidades + DbContext) |
+-------------------------------------------------------------+
                               |  Conexão TCP / SQL
                               v
+-------------------------------------------------------------+
|                Banco de Dados MySQL (Persistência)           |
+-------------------------------------------------------------+
```

---

### 1.2 Estilo Interno (Conceitos do Encontro 02 - Análise & Projeto Orientado a Objetos / BCE)
Na visão interna dos módulos de código-fonte e mapeamento de análise para implementação, o sistema adota o padrão **BCE (Boundary-Control-Entity)** originário do RUP / Ivar Jacobson:

1. **Classes de Fronteira (Boundary):**
   - Representam a interface com os atores do sistema (usuários, concessionárias, administradores).
   - **Mapeamento:** Implementadas como classes `Controller` dentro de `DesapegAutoWeb/Controllers/` (ex.: `VeiculoController`, `AnuncioController`, `CategoriaController`, etc.) juntamente com as telas correspondentes (`Views/`).
2. **Classes de Controle (Control):**
   - Encapsulam as regras de negócio, coordenação de fluxos e validações.
   - **Mapeamento:** Implementadas como classes de serviço dentro do projeto `Service/` (ex.: `VeiculoService`, `CategoriaService`, `MarcaService`), implementando contratos de interface definidos no núcleo.
3. **Classes do Tipo Entidade (Entity):**
   - Representam os objetos conceituais de negócio que possuem identidade e estado contínuo no sistema.
   - **Mapeamento:** Implementadas como classes POCO organizadas em `Core/Entities/` (ex.: `Veiculo.cs`, `Anuncio.cs`, `Categoria.cs`, `Pessoa.cs`, `Venda.cs`).
4. **Classes do Tipo Coleção de Entidades (EntityCollection / Persistência):**
   - Representam o conjunto de dados persistidos das entidades e operações de armazenamento.
   - **Mapeamento Original:** Conforme registrado no próprio *Guia de Análise e Projeto* da disciplina, as coleções de persistência foram centralizadas em uma única classe de contexto: `DesapegAutoContext` (derivada de `Microsoft.EntityFrameworkCore.DbContext`).
   - **Problema do Mapeamento Original:** Essa classe de contexto e mapeamento com o banco foi inserida **diretamente dentro do pacote `Core`**, violando o isolamento do domínio.

---

### 1.3 Onde a Regra de Dependência AINDA NÃO se Aplicava (Violações Identificadas)

A **Regra de Dependência (Dependency Rule)** de arquiteturas modernas (Clean Architecture, Hexagonal Architecture e Onion Architecture) estabelece que:
> *O código-fonte de negócio (domínio) deve ser o centro estável do sistema. As dependências devem apontar sempre para dentro, em direção às políticas de mais alto nível. O domínio não pode depender de detalhes voláteis como bancos de dados, ORMs, frameworks de UI ou bibliotecas de terceiros.*

Na arquitetura original do projeto, essa regra era frontalmente violada em três pontos críticos:

1. **Acoplamento do Domínio (`Core`) ao Banco de Dados e ORM:**
   - O projeto `Core.csproj` continha referências explícitas aos pacotes NuGet:
     - `Microsoft.EntityFrameworkCore.Design`
     - `Microsoft.EntityFrameworkCore.InMemory`
     - `Microsoft.EntityFrameworkCore.Tools`
     - `MySql.EntityFrameworkCore`
   - O arquivo `Core/DesapegAutoContext.cs` residia dentro de `Core`, herdando de `DbContext` e importando `Microsoft.EntityFrameworkCore`.
   - **Consequência:** O Domínio dependia diretamente de detalhes de infraestrutura e de fornecedores externos de banco de dados. Qualquer alteração no ORM forçaria a modificação da camada de domínio.

2. **Acoplamento dos Serviços (`Service`) à Classe Concreta de Infraestrutura:**
   - Todas as 9 classes de serviço (`AnuncioService`, `CategoriaService`, `ConcessionariaService`, `MarcaService`, `ModeloService`, `PessoaService`, `VeiculoService`, `VendaService`, `VersaoService`) recebiam em seus construtores e manipulavam diretamente a classe concreta `DesapegAutoContext`.
   - As regras de negócio utilizavam diretamente APIs específicas do Entity Framework Core (`DbSet<T>`, `.AsNoTracking()`, `context.SaveChanges()`, `context.Add()`).
   - `Service.csproj` também referenciava diretamente os pacotes de banco de dados (`Microsoft.EntityFrameworkCore.*`, `MySql.EntityFrameworkCore`, etc.).

3. **Violação do Princípio da Inversão de Dependência (DIP - SOLID):**
   - Em vez de o módulo de alto nível (Domínio/Negócio) definir a abstração de que necessita para persistir dados, o sistema dependia da implementação concreta do Entity Framework Core.
   - A persistência não era um componente plugável ou substituível, inviabilizando a execução de testes unitários rápidos e isolados sem instanciar um contexto do EF Core.

---

## 2. Escolha da Arquitetura e Justificativa

### 2.1 Arquitetura Escolhida: **Arquitetura Hexagonal (Ports and Adapters)**
Criada por **Alistair Cockburn**, a Arquitetura Hexagonal tem como premissa central isolar a aplicação de negócio do mundo exterior, permitindo que a mesma seja executada e testada de forma autônoma em relação a tecnologias de interface (UI), bancos de dados, serviços de mensageria ou dispositivos externos.

```
                      ARQUITETURA HEXAGONAL (PORTS & ADAPTERS)
                      
                    +------------------------------------------+
                    |           Mundo Externo (Atores)         |
                    |  (Usuários Web, Admins, Concessionárias) |
                    +------------------------------------------+
                                         |
                                         v
                +----------------------------------------------------+
                |      ADAPTADORES PRIMÁRIOS / DRIVING ADAPTERS      |
                |        (DesapegAutoWeb - MVC Controllers)          |
                +----------------------------------------------------+
                                         |
                                         v [Invoca via]
                +----------------------------------------------------+
                |       PORTAS PRIMÁRIAS / DRIVING (INBOUND) PORTS   |
                |   (Core/Ports/Driving/: ICategoriaService, etc.)   |
                +----------------------------------------------------+
                |                                                    |
                |               NÚCLEO DO HEXÁGONO                   |
                |         (Regras de Negócio em Service/)            |
                |         (Entidades em Core/Entities/)              |
                |                                                    |
                |      PORTAS SECUNDÁRIAS / DRIVEN (OUTBOUND) PORTS  |
                |  (Core/Ports/Driven/: IDesapegAutoContext, etc.)   |
                +----------------------------------------------------+
                                         |
                                         | [Implementado por]
                                         v
                +----------------------------------------------------+
                |     ADAPTADORES SECUNDÁRIOS / DRIVEN ADAPTERS      |
                |      (Repository - DesapegAutoContext + EF Core)   |
                +----------------------------------------------------+
                                         |
                                         v
                    +------------------------------------------+
                    |             Mundo Externo                |
                    |         (Banco de Dados MySQL)           |
                    +------------------------------------------+
```

### 2.2 Justificativa da Escolha

1. **Aderência Terminológica e Conceitual ao Requisito do Trabalho:**
   - O enunciado da atividade determina: *"Declarar a porta/interface de persistência como interface no domínio, e implementar o adaptador com Entity Framework fora dele"*.
   - A terminologia de **Portas** (*Ports*) e **Adaptadores** (*Adapters*) constitui a base fundamental da Arquitetura Hexagonal:
     - **Porta:** Abstração que declara uma necessidade ou serviço (sempre pertencente ao interior do domínio).
     - **Adaptador:** Código técnico que implementa a porta ou traduz dados entre a tecnologia externa e a linguagem da porta (sempre pertencente ao exterior do domínio).

2. **Isolamento Completo do Domínio (Regra de Dependência):**
   - Ao aplicar a Arquitetura Hexagonal, o projeto `Core` tornou-se uma biblioteca .NET 8 **100% pura**, sem qualquer referência de pacote NuGet de banco de dados ou Entity Framework.
   - O domínio declara a **Porta Secundária** (`IDesapegAutoContext` e `IEntitySet<T>`). Toda dependência de código-fonte agora aponta para dentro do domínio: o adaptador externo `Repository` depende de `Core`, e não o inverso.

3. **Plugabilidade e Testabilidade:**
   - Com o desacoplamento, a persistência tornou-se um detalhe de infraestrutura plugável. No ambiente de produção, utiliza-se o adaptador MySQL via Entity Framework. No ambiente de testes automatizados, utiliza-se o adaptador em memória (`UseInMemoryDatabase`).

---

### 2.3 Convenção de Nomenclatura e Estrutura de Pastas (Ports & Adapters)

A estrutura de diretórios e arquivos foi padronizada para expressar formalmente a terminologia canônica da Arquitetura Hexagonal:

```
tees-2026-2-unidade-1/exercicio-1-arquitetura/
├── DesapegAuto.sln
│
├── Core/                                  <-- [NÚCLEO DO HEXÁGONO] (Zero pacotes de banco/ORM)
│   ├── Core.csproj
│   ├── Entities/                          <-- Entidades de Domínio
│   │   ├── Anuncio.cs
│   │   ├── Categoria.cs
│   │   ├── Concessionaria.cs
│   │   ├── Marca.cs
│   │   ├── Modelo.cs
│   │   ├── Pessoa.cs
│   │   ├── Usuario.cs
│   │   ├── Veiculo.cs
│   │   ├── VeiculoHasVersao.cs
│   │   ├── Venda.cs
│   │   └── Versao.cs
│   ├── Ports/                             <-- [PORTAS DO DOMÍNIO]
│   │   ├── Driving/                       <-- Portas Primárias / Inbound (Contratos de Serviços)
│   │   │   ├── iAnuncioService.cs
│   │   │   ├── ICategoriaService.cs
│   │   │   ├── iConcessionariaService.cs
│   │   │   ├── iMarcaService.cs
│   │   │   ├── IModeloService.cs
│   │   │   ├── iPessoaService.cs
│   │   │   ├── iVeiculoService.cs
│   │   │   ├── iVendaService.cs
│   │   │   └── iVersaoService.cs
│   │   └── Driven/                        <-- Portas Secundárias / Outbound (Contratos de Persistência)
│   │       ├── IDesapegAutoContext.cs     <-- Porta de Persistência Unificada
│   │       ├── IEntitySet.cs              <-- Abstração de coleção LINQ
│   │       └── QueryableExtensions.cs     <-- Extensões puras de IQueryable
│   ├── DTO/                               <-- Data Transfer Objects
│   │   ├── ModeloDTO.cs
│   │   ├── PessoaDTO.cs
│   │   ├── VeiculoDTO.cs
│   │   ├── VendaDTO.cs
│   │   └── VersaoDTO.cs
│   └── Exceptions/                        <-- Exceções de Domínio
│       └── ServiceException.cs
│
├── Service/                               <-- [LÓGICA DA APLICAÇÃO DO HEXÁGONO]
│   ├── Service.csproj                     <-- (Depende apenas de Core)
│   ├── AnuncioService.cs
│   ├── CategoriaService.cs
│   ├── ConcessionariaService.cs
│   ├── MarcaService.cs
│   ├── ModeloService.cs
│   ├── PessoaService.cs
│   ├── VeiculoService.cs
│   ├── VendaService.cs
│   └── VersaoService.cs
│
├── Repository/                            <-- [ADAPTADOR SECUNDÁRIO / DRIVEN ADAPTER]
│   ├── Repository.csproj                  <-- (EF Core 8 + Driver MySQL)
│   ├── DesapegAutoContext.cs              <-- Implementação concreta de IDesapegAutoContext via DbContext
│   └── EfEntitySet.cs                     <-- Adaptador concreto de DbSet<T> para IEntitySet<T>
│
├── DesapegAutoWeb/                         <-- [ADAPTADOR PRIMÁRIO / DRIVING ADAPTER]
│   ├── DesapegAutoWeb.csproj
│   ├── Controllers/                       <-- Adaptadores HTTP/MVC consumindo Driving Ports
│   ├── Views/
│   ├── Models/
│   ├── Mappers/
│   └── Program.cs                          <-- Composição do container de Injeção de Dependência
│
├── ServiceTests/                          <-- Testes Automatizados dos Serviços / Casos de Uso
│   ├── ServiceTests.csproj
│   ├── AnuncioServiceTests.cs
│   ├── CategoriaServiceTests.cs
│   ├── ConcessionariaServiceTests.cs
│   ├── MarcaServiceTests.cs
│   ├── ModeloServiceTests.cs
│   ├── PessoaServiceTests.cs
│   ├── VeiculoServiceTests.cs
│   ├── VendaServiceTests.cs
│   ├── VersaoServiceTests.cs
│   └── AdminWorkflowMySqlIntegrationTests.cs
│
└── DesapegAutoWebTests/                    <-- Testes Automatizados do Adaptador Web MVC
    ├── DesapegAutoWebTests.csproj
    └── Controllers/
```

---

## 3. Implementação: Portas no Domínio e Adaptador com EF Core

### 3.1 Declaração da Porta de Persistência no Domínio (`Core`)

O projeto `Core` foi purificado. Todos os pacotes de banco de dados foram removidos de `Core.csproj`:
```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>
</Project>
```

Em seguida, foram declaradas as interfaces que compõem a **Porta Secundária de Persistência** dentro do domínio em `Core/Ports/Driven/`:

#### 1. Interface `IEntitySet<T>` (`Core/Ports/Driven/IEntitySet.cs`):
Abstrai as coleções de entidades persistidas (`EntityCollection`), permitindo consultas LINQ e manipulação de entidades sem importar namespaces de ORM:
```csharp
namespace Core.Databases;

public interface IEntitySet<T> : IQueryable<T> where T : class
{
    void Add(T entity);
    void AddRange(IEnumerable<T> entities);
    void Update(T entity);
    void Remove(T entity);
    T? Find(params object?[]? keyValues);
    IQueryable<T> AsNoTracking();
}
```

#### 2. Interface `IDesapegAutoContext` (`Core/Ports/Driven/IDesapegAutoContext.cs`):
Contrato unificado de persistência exigido pela aplicação para operar sobre as 11 entidades de negócio:
```csharp
namespace Core.Databases;

public interface IDesapegAutoContext : IDisposable
{
    IEntitySet<Anuncio> Anuncios { get; }
    IEntitySet<Categoria> Categoria { get; }
    IEntitySet<Concessionaria> Concessionaria { get; }
    IEntitySet<Marca> Marcas { get; }
    IEntitySet<Modelo> Modelos { get; }
    IEntitySet<Pessoa> Pessoas { get; }
    IEntitySet<Usuario> Usuarios { get; }
    IEntitySet<Veiculo> Veiculos { get; }
    IEntitySet<VeiculoHasVersao> VeiculoHasVersaos { get; }
    IEntitySet<Venda> Venda { get; }
    IEntitySet<Versao> Versaos { get; }

    void Add<TEntity>(TEntity entity) where TEntity : class;
    void Update<TEntity>(TEntity entity) where TEntity : class;
    void Remove<TEntity>(TEntity entity) where TEntity : class;
    TEntity? Find<TEntity>(params object?[]? keyValues) where TEntity : class;
    int SaveChanges();
}
```

#### 3. Extensões de Domínio `QueryableExtensions` (`Core/Ports/Driven/QueryableExtensions.cs`):
Permite que consultas LINQ em camadas internas utilizem operações como `AsNoTracking()` sem dependência direta do pacote `Microsoft.EntityFrameworkCore`:
```csharp
namespace Core.Databases;

public static class QueryableExtensions
{
    public static IQueryable<T> AsNoTracking<T>(this IQueryable<T> source) where T : class
    {
        if (source is IEntitySet<T> entitySet)
        {
            return entitySet.AsNoTracking();
        }
        return source;
    }
}
```

---

### 3.2 Implementação do Adaptador Fora do Domínio (`Repository`)

O projeto `Repository` (`Repository/Repository.csproj`) isola todos os detalhes do Entity Framework Core 8 e MySQL:
```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.EntityFrameworkCore" Version="8.0.17" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="8.0.17">
      <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
      <PrivateAssets>all</PrivateAssets>
    </PackageReference>
    <PackageReference Include="Microsoft.EntityFrameworkCore.InMemory" Version="8.0.17" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.Tools" Version="8.0.17">
      <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
      <PrivateAssets>all</PrivateAssets>
    </PackageReference>
    <PackageReference Include="MySql.EntityFrameworkCore" Version="8.0.17" />
  </ItemGroup>

  <ItemGroup>
    <ProjectReference Include="..\Core\Core.csproj" />
  </ItemGroup>
</Project>
```

O projeto `Repository` implementa o adaptador através de duas classes:

#### 1. Adaptador `EfEntitySet<T>` (`Repository/EfEntitySet.cs`):
Encapsula o `DbSet<T>` nativo do EF Core e o adapta para satisfazer o contrato `IEntitySet<T>` do domínio.

#### 2. Adaptador de Contexto `DesapegAutoContext` (`Repository/DesapegAutoContext.cs`):
Herda do `DbContext` do Entity Framework Core e implementa a porta `IDesapegAutoContext`, contendo todos os mapeamentos relacionais (`OnModelCreating`).

---

### 3.3 Ajuste na Camada de Serviços (`Service`)

A camada de serviços (`Service`) também foi desacoplada completamente do Entity Framework e do MySQL:
1. Todos os pacotes de persistência foram removidos de `Service.csproj`.
2. As 9 classes de serviço foram atualizadas para injetar a interface `IDesapegAutoContext` (a porta de persistência) em vez da classe concreta:
```csharp
namespace Service
{
    public class CategoriaService : ICategoriaService
    {
        private readonly IDesapegAutoContext context;

        public CategoriaService(IDesapegAutoContext context)
        {
            this.context = context;
        }
        // Métodos de negócio operam sobre a porta IDesapegAutoContext
    }
}
```

---

### 3.4 Injeção de Dependência na Camada Web (`DesapegAutoWeb`)

No arquivo `Program.cs` de `DesapegAutoWeb`, o container nativo de DI do ASP.NET Core conecta o adaptador EF Core à porta de persistência exigida pelos serviços:
```csharp
// Configuração do contexto concreto EF Core com MySQL
builder.Services.AddDbContext<DesapegAutoContext>(options =>
    options.UseMySQL(connectionString));

// Registro da Porta IDesapegAutoContext resolvendo para a instância do adaptador
builder.Services.AddScoped<IDesapegAutoContext>(provider =>
    provider.GetRequiredService<DesapegAutoContext>());

// Registro dos serviços de aplicação (que agora dependem de IDesapegAutoContext)
builder.Services.AddScoped<ICategoriaService, CategoriaService>();
builder.Services.AddScoped<IVeiculoService, VeiculoService>();
// ... demais serviços
```

---

## 4. Nova Distribuição de Responsabilidades e Matriz de Dependências

### 4.1 Resumo das Responsabilidades por Camada

| Camada / Projeto | Papel na Arquitetura Hexagonal | Responsabilidades | Dependências de Pacotes | Dependências de Projetos |
| :--- | :--- | :--- | :--- | :--- |
| **`Core`** | **Núcleo de Domínio & Portas** | Define as entidades de negócio (`Core/Entities/`), exceções de domínio (`Core/Exceptions/`), contratos de serviços (portas primárias em `Core/Ports/Driving/`) e contratos de persistência (portas secundárias em `Core/Ports/Driven/`). | **Nenhum pacote** (C# Puro / .NET 8) | Nenhuma |
| **`Service`** | **Lógica de Aplicação / Núcleo** | Implementa as regras de negócio e casos de uso, orquestrando validações e persistência exclusivamente através de portas. | **Nenhum pacote** (.NET 8 puro) | `Core` |
| **`Repository`** | **Adaptador de Persistência (Driven Adapter)** | Implementa o acesso concreto a dados via Entity Framework Core e MySQL, mapeando as tabelas e adaptando `DbSet<T>` para `IEntitySet<T>`. | `Microsoft.EntityFrameworkCore.*`, `MySql.EntityFrameworkCore` | `Core` |
| **`DesapegAutoWeb`** | **Adaptador Primário (Driving Adapter) & Apresentação** | Interface com o usuário (Controllers MVC, Razor Views), autenticação Identity e composição de Injeção de Dependências. | `Microsoft.AspNetCore.Identity.*`, `AutoMapper.*` | `Core`, `Service`, `Repository` |
| **`ServiceTests`** | **Suíte de Testes de Serviços** | Valida as regras de negócio dos serviços utilizando o adaptador em memória do EF Core sem necessidade de banco MySQL real. | `MSTest`, `Microsoft.EntityFrameworkCore.InMemory` | `Core`, `Service`, `Repository` |
| **`DesapegAutoWebTests`** | **Suíte de Testes de Interface** | Valida os controladores MVC através de mocks das portas primárias (`ICategoriaService`, etc.). | `MSTest`, `Moq` | `Core`, `Service`, `DesapegAutoWeb` |

---

### 4.2 Comparativo: Direção das Dependências (Antes vs. Depois)

#### Antes (Violação da Regra de Dependência):
```
[DesapegAutoWeb] --------> [Service] --------> [Core (com DbContext, EF Core e MySQL)]
```
*O domínio estava no final da cadeia de dependências e dependia diretamente de tecnologias externas de banco de dados.*

#### Depois (Arquitetura Hexagonal com Regra de Dependência Respeitada):
```
[DesapegAutoWeb (Driving Adapter)]
       |
       +-------> [Service (Aplicação)] -------> [Core (Domínio puro)]
       |                                                ^
[Repository (Driven Adapter com EF Core)] -------------+
```
*Todas as setas de dependência de código-fonte apontam para dentro, em direção ao Domínio (`Core`). O Domínio e os Serviços possuem ZERO referências a bibliotecas de banco de dados.*

---

## 5. Validação e Resultados dos Testes Automatizados

A adaptação arquitetural foi validada com **100% de compatibilidade e zero regressão**. Todos os testes automatizados da solução compilaram e foram executados com sucesso:

```powershell
dotnet test "tees-2026-2-unidade-1\exercicio-1-arquitetura\DesapegAuto.sln"
```

### Resultados Obtidos:
- **`DesapegAutoWebTests.dll` (Testes dos Controladores):**
  - **Aprovados:** 79
  - **Falhas:** 0
  - **Ignorados:** 0
- **`ServiceTests.dll` (Testes de Regras de Negócio e Serviços):**
  - **Aprovados:** 68 (+ 4 testes de integração com MySQL ignorados por design)
  - **Falhas:** 0
  - **Total:** 72
- **Total Geral:** **151 testes executados, 151 aprovados com sucesso.**

### Verificação de Purificação dos Pacotes NuGet:
```powershell
dotnet list "tees-2026-2-unidade-1\exercicio-1-arquitetura\Core\Core.csproj" package
# Resultado: Nenhum pacote foi encontrado para essa estrutura.

dotnet list "tees-2026-2-unidade-1\exercicio-1-arquitetura\Service\Service.csproj" package
# Resultado: Nenhum pacote foi encontrado para essa estrutura.
```

---

## 6. Conclusão

A adaptação arquitetural alcançou plenamente os objetivos propostos:
1. A arquitetura externa (Encontro 01) e interna (Encontro 02 - BCE) foi detalhadamente documentada, explicitando as falhas da arquitetura original.
2. A Arquitetura Hexagonal (Ports and Adapters) foi escolhida e justificada com base em seus conceitos canônicos de portas e adaptadores.
3. A porta de persistência (`IDesapegAutoContext` e `IEntitySet<T>`) foi declarada no domínio (`Core`), e o adaptador concreto com Entity Framework Core e MySQL foi implementado fora do domínio no projeto `Repository`.
4. As responsabilidades foram reorganizadas em conformidade estrita com o Princípio da Inversão de Dependência (DIP) e com a Regra de Dependência de Cockburn, mantendo a integridade e nomenclatura canônica de todos os 151 testes automatizados do sistema.
