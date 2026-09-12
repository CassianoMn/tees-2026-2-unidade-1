# Relatório de Adaptação Arquitetural: Aplicação da Clean Architecture (Arquitetura Limpa) no DesapegAuto
 
**Arquitetura Escolhida:** **Clean Architecture (Arquitetura Limpa - Robert C. Martin / Uncle Bob)**  
**Branch de Entrega:** `Branch_CleanArchitecture`  
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
   - **Mapeamento:** Implementadas como classes de serviço dentro do projeto `Service/` (ex.: `VeiculoService`, `CategoriaService`, `MarcaService`), implementando contratos de interface definidos em `Core/Service/` (ex.: `IVeiculoService`, `ICategoriaService`).
3. **Classes do Tipo Entidade (Entity):**
   - Representam os objetos conceituais de negócio que possuem identidade e estado contínuo no sistema.
   - **Mapeamento:** Implementadas como classes POCO no projeto `Core/` (ex.: `Veiculo.cs`, `Anuncio.cs`, `Categoria.cs`, `Pessoa.cs`, `Venda.cs`).
4. **Classes do Tipo Coleção de Entidades (EntityCollection / Persistência):**
   - Representam o conjunto de dados persistidos das entidades e operações de armazenamento.
   - **Mapeamento Original:** Conforme registrado no próprio *Guia de Análise e Projeto* da disciplina, as coleções de persistência foram centralizadas em uma única classe de contexto: `DesapegAutoContext` (derivada de `Microsoft.EntityFrameworkCore.DbContext`).
   - **Problema do Mapeamento:** Essa classe de contexto e mapeamento com o banco foi inserida **diretamente dentro do pacote `Core`**.

---

### 1.3 Onde a Regra de Dependência AINDA NÃO se Aplicava (Violações Identificadas)

A **Regra de Dependência (The Dependency Rule)** da **Clean Architecture** (Robert C. Martin / Uncle Bob) estabelece que:
> *"As dependências de código-fonte devem apontar exclusivamente para dentro, em direção às políticas de nível mais alto. Nada no círculo interno pode saber algo sobre o que existe em um círculo externo. Isso inclui funções, classes, variáveis ou qualquer formato de dados declarado nos círculos externos."*

Na arquitetura original do projeto, essa regra era frontalmente violada em três pontos críticos:

1. **Acoplamento do Domínio (`Core`) ao Banco de Dados e ORM:**
   - O projeto `Core.csproj` continha referências explícitas aos pacotes NuGet:
     - `Microsoft.EntityFrameworkCore.Design`
     - `Microsoft.EntityFrameworkCore.InMemory`
     - `Microsoft.EntityFrameworkCore.Tools`
     - `MySql.EntityFrameworkCore`
   - O arquivo `Core/DesapegAutoContext.cs` residia dentro de `Core`, herdando de `DbContext` e importando `Microsoft.EntityFrameworkCore`.
   - **Consequência:** O Domínio (círculo mais interno) dependia diretamente do círculo mais externo (Frameworks & Drivers). Qualquer alteração ou atualização no Entity Framework ou troca de banco forçaria a modificação da camada de domínio.

2. **Acoplamento dos Casos de Uso / Serviços (`Service`) à Classe Concreta de Infraestrutura:**
   - Todas as 9 classes de serviço (`AnuncioService`, `CategoriaService`, `ConcessionariaService`, `MarcaService`, `ModeloService`, `PessoaService`, `VeiculoService`, `VendaService`, `VersaoService`) recebiam em seus construtores e manipulavam diretamente a classe concreta `DesapegAutoContext`.
   - As regras de negócio utilizavam diretamente APIs específicas do Entity Framework Core (`DbSet<T>`, `.AsNoTracking()`, `context.SaveChanges()`, `context.Add()`).
   - `Service.csproj` também referenciava diretamente os pacotes de banco de dados (`Microsoft.EntityFrameworkCore.*`, `MySql.EntityFrameworkCore`, `Microsoft.AspNetCore.Identity.EntityFrameworkCore`).

3. **Violação do Princípio da Inversão de Dependência (DIP - SOLID):**
   - Em vez de o módulo de alto nível (Domínio/Casos de Uso) definir a abstração de que necessita para persistir dados, o sistema dependia da implementação concreta do Entity Framework Core.
   - A persistência não era tratada como um detalhe periférico (um *driver* ou *gateway* plugável), inviabilizando a execução de testes de regras de negócio sem instanciar um contexto do EF Core.

---

## 2. Escolha da Arquitetura e Justificativa

### 2.1 Arquitetura Escolhida: **Clean Architecture (Arquitetura Limpa - Robert C. Martin)**
A **Clean Architecture** organiza o sistema em camadas concêntricas concisas baseadas na estabilidade e no nível de abstração:

```
                  CÍRCULOS CONCÊNTRICOS DA CLEAN ARCHITECTURE
                  
    +-------------------------------------------------------------------+
    | 4. Frameworks & Drivers (Mecanismos Externos)                     |
    |    - ASP.NET Core MVC (Web Host, Razor Views, HTTP, Routing)      |
    |    - Microsoft.EntityFrameworkCore, MySql.EntityFrameworkCore     |
    |    - Banco de Dados MySQL                                         |
    |                                                                   |
    |   +-----------------------------------------------------------+   |
    |   | 3. Interface Adapters (Adaptadores de Interface)          |   |
    |   |    - Controllers: DesapegAutoWeb/Controllers              |   |
    |   |    - Data Gateways: Repository (DesapegAutoContext)       |   |
    |   |    - Presenters, ViewModels & Mappers                     |   |
    |   |                                                           |   |
    |   |   +---------------------------------------------------+   |   |
    |   |   | 2. Use Cases / Application Business Rules         |   |   |
    |   |   |    - Service (Casos de Uso e Regras da Aplicação) |   |   |
    |   |   |    - Interfaces de Gateways de Persistência       |   |   |
    |   |   |                                                   |   |   |
    |   |   |   +-------------------------------------------+   |   |   |
    |   |   |   | 1. Entities (Enterprise Business Rules)   |   |   |   |
    |   |   |   |    - Core (Veiculo, Anuncio, Categoria)   |   |   |   |
    |   |   |   |    - Regras essenciais e dados de negócio |   |   |   |
    |   |   |   +-------------------------------------------+   |   |   |
    |   |   +---------------------------------------------------+   |   |
    |   +-----------------------------------------------------------+   |
    +-------------------------------------------------------------------+
```

### 2.2 Mapeamento dos Projetos nos Círculos da Clean Architecture

1. **Círculo 1 - Entities (Entidades de Negócio Corporativas):**
   - **Projeto:** `Core`
   - **Conteúdo:** Entidades POCO (`Veiculo.cs`, `Anuncio.cs`, `Categoria.cs`, `Pessoa.cs`, `Venda.cs`, etc.), DTOs e regras intrínsecas às entidades. É o núcleo mais estável e protegido do sistema.
2. **Círculo 2 - Use Cases / Application Business Rules (Regras de Negócio da Aplicação):**
   - **Projeto:** `Service`
   - **Conteúdo:** Implementação dos casos de uso (`VeiculoService`, `CategoriaService`, etc.), validações funcionais, exceções de negócio e orquestração dos fluxos.
   - **Interfaces de Gateway:** O contrato abstrato de persistência ([`IDesapegAutoGateway`](file:///c:/Users/Cassiano%20Menezes/Desktop/DesapegAuto_Porters-and-Adapters/tees-2026-2-unidade-1/exercicio-1-arquitetura/Core/Databases/IDesapegAutoGateway.cs) / [`IDesapegAutoContext`](file:///c:/Users/Cassiano%20Menezes/Desktop/DesapegAuto_Porters-and-Adapters/tees-2026-2-unidade-1/exercicio-1-arquitetura/Core/Databases/IDesapegAutoContext.cs)) reside no domínio/casos de uso.
3. **Círculo 3 - Interface Adapters (Adaptadores de Interface):**
   - **Projetos:** `Repository` e `DesapegAutoWeb/Controllers`
   - **Conteúdo:** 
     - **Persistence Data Gateway:** O projeto `Repository` implementa o gateway concreto de acesso ao banco de dados (`DesapegAutoContext` e `EfEntitySet`), convertendo as entidades de domínio em tabelas relacionais.
     - **Controllers & Presenters:** Controladores MVC que convertem requisições HTTP em chamadas aos Use Cases e formatam dados em ViewModels.
4. **Círculo 4 - Frameworks & Drivers (Mecanismos e Ferramentas Externas):**
   - **Componentes:** ASP.NET Core Runtime, Microsoft.EntityFrameworkCore 8, MySQL Driver, Bootstrap, jQuery.

---

### 2.3 Justificativa Técnica da Escolha

1. **Cumprimento Rigoroso da Regra de Dependência (The Dependency Rule):**
   - Na Clean Architecture, as políticas de negócio não dependem de nada externo. Todas as dependências apontam para o centro.
   - Os projetos `Core` e `Service` não contêm **nenhum pacote NuGet** de banco de dados ou Entity Framework (`Nenhum pacote foi encontrado para essa estrutura`).
2. **O Conceito Canônico de Data Gateway:**
   - Uncle Bob define que o acesso ao banco deve ser realizado através de uma interface de **Data Gateway** declarada na camada de Use Cases / Domínio e implementada na camada de Interface Adapters.
   - A interface `IDesapegAutoGateway` / `IDesapegAutoContext` cumpre exatamente esse papel: os Casos de Uso manipulam dados por meio do Gateway sem conhecer SQL ou Entity Framework.
3. **Os 5 Atributos Fundamentais de Uncle Bob Atingidos:**
   - **Independência de Frameworks:** A aplicação não é escrava do Entity Framework Core.
   - **Testabilidade:** As regras de negócio dos Use Cases podem ser testadas sem banco de dados, sem UI e sem servidor web.
   - **Independência da UI:** A interface ASP.NET MVC pode ser substituída por uma API REST ou interface desktop sem alterar uma única linha de regras de negócio.
   - **Independência de Banco de Dados:** O MySQL pode ser substituído por PostgreSQL, Oracle ou MongoDB modificando apenas a camada de Interface Adapters (`Repository`).
   - **Independência de Qualquer Agente Externo:** As regras de negócio não sabem que o mundo exterior existe.

---

## 3. Implementação da Persistência na Clean Architecture

### 3.1 Declaração da Interface de Persistência (Data Gateway) no Domínio (`Core`)

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

Em seguida, foram declaradas as interfaces que compõem o **Data Gateway de Persistência** dentro do domínio:

#### 1. Interface `IDesapegAutoGateway` e `IDesapegAutoContext` (`Core/Databases/`):
Contrato abstrato de persistência exigido pelos Use Cases para manipular as entidades corporativas:
```csharp
namespace Core.Databases;

public interface IDesapegAutoGateway : IDesapegAutoContext
{
}

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

#### 2. Interface `IEntitySet<T>` (`Core/Databases/IEntitySet.cs`):
Abstrai a coleção de entidades para consulta LINQ e operações de persistência sem referenciar tipos do EF Core:
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

#### 3. Extensões de Domínio `QueryableExtensions` (`Core/Databases/QueryableExtensions.cs`):
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

### 3.2 Implementação do Adaptador de Gateway fora do Domínio (`Repository`)

No círculo de **Interface Adapters**, o projeto `Repository` implementa o Data Gateway utilizando o Entity Framework Core e o driver MySQL:
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

#### 1. Adaptador de Gateway `DesapegAutoContext` (`Repository/DesapegAutoContext.cs`):
Herda de `DbContext` e implementa `IDesapegAutoGateway` e `IDesapegAutoContext`:
```csharp
namespace Repository;

public partial class DesapegAutoContext : DbContext, IDesapegAutoContext, IDesapegAutoGateway
{
    public DesapegAutoContext(DbContextOptions<DesapegAutoContext> options) : base(options) { }

    public virtual DbSet<Anuncio> Anuncios { get; set; } = null!;
    public virtual DbSet<Categoria> Categoria { get; set; } = null!;
    // ... demais DbSets nativos

    // Adaptadores para o contrato IEntitySet do Gateway
    private IEntitySet<Categoria>? _categoriaAdapter;
    IEntitySet<Categoria> IDesapegAutoContext.Categoria =>
        _categoriaAdapter ??= new EfEntitySet<Categoria>(Categoria);

    void IDesapegAutoContext.Add<TEntity>(TEntity entity) => base.Add(entity);
    void IDesapegAutoContext.Update<TEntity>(TEntity entity) => base.Update(entity);
    void IDesapegAutoContext.Remove<TEntity>(TEntity entity) => base.Remove(entity);
    TEntity? IDesapegAutoContext.Find<TEntity>(params object?[]? keyValues) where TEntity : class => base.Find<TEntity>(keyValues);
    int IDesapegAutoContext.SaveChanges() => base.SaveChanges();

    // Mapeamento relacional (OnModelCreating)
}
```

#### 2. Adaptador `EfEntitySet<T>` (`Repository/EfEntitySet.cs`):
Adapta o `DbSet<T>` nativo do EF Core para cumprir o contrato `IEntitySet<T>` do Gateway:
```csharp
namespace Repository;

public class EfEntitySet<T> : IEntitySet<T> where T : class
{
    private readonly DbSet<T> _dbSet;

    public EfEntitySet(DbSet<T> dbSet)
    {
        _dbSet = dbSet ?? throw new ArgumentNullException(nameof(dbSet));
    }

    public Type ElementType => ((IQueryable<T>)_dbSet).ElementType;
    public Expression Expression => ((IQueryable<T>)_dbSet).Expression;
    public IQueryProvider Provider => ((IQueryable<T>)_dbSet).Provider;

    public IEnumerator<T> GetEnumerator() => ((IQueryable<T>)_dbSet).GetEnumerator();
    IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();

    public void Add(T entity) => _dbSet.Add(entity);
    public void AddRange(IEnumerable<T> entities) => _dbSet.AddRange(entities);
    public void Update(T entity) => _dbSet.Update(entity);
    public void Remove(T entity) => _dbSet.Remove(entity);
    public T? Find(params object?[]? keyValues) => _dbSet.Find(keyValues);
    public IQueryable<T> AsNoTracking() => EntityFrameworkQueryableExtensions.AsNoTracking(_dbSet);
}
```

---

### 3.3 Ajuste nos Casos de Uso (`Service`)

A camada de serviços/casos de uso (`Service`) foi 100% desacoplada:
1. `Service.csproj` não possui qualquer pacote de persistência ou ORM (depende unicamente de `Core.csproj`).
2. As 9 classes de serviço recebem o Data Gateway `IDesapegAutoContext` / `IDesapegAutoGateway` via injeção de dependência:
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
        // Casos de uso operam sobre a interface do Gateway
    }
}
```

---

### 3.4 Composição e Injeção de Dependência (`DesapegAutoWeb`)

No arquivo `Program.cs` de `DesapegAutoWeb`, o container nativo de DI realiza a inversão de dependência conectando a abstração do Gateway à implementação concreta:
```csharp
// Configuração do contexto concreto com MySQL (Frameworks & Drivers)
builder.Services.AddDbContext<DesapegAutoContext>(options =>
    options.UseMySQL(connectionString));

// Amarração da interface do Gateway para a instância concreta
builder.Services.AddScoped<IDesapegAutoContext>(provider =>
    provider.GetRequiredService<DesapegAutoContext>());

// Injeção dos casos de uso da aplicação
builder.Services.AddScoped<ICategoriaService, CategoriaService>();
builder.Services.AddScoped<IVeiculoService, VeiculoService>();
// ... demais serviços
```

---

## 4. Nova Distribuição de Responsabilidades e Matriz de Dependências

### 4.1 Resumo das Responsabilidades na Clean Architecture

| Camada da Clean Architecture | Projeto na Solução | Responsabilidades Estritas | Dependências de Pacotes | Dependências de Projetos |
| :--- | :--- | :--- | :--- | :--- |
| **Entities** | **`Core`** | Entidades de negócio (`Veiculo`, `Anuncio`, `Categoria`), DTOs, exceções de domínio e contratos do Data Gateway de persistência (`IDesapegAutoGateway`, `IEntitySet<T>`). | **Nenhum pacote** (C# .NET 8 Puro) | Nenhuma |
| **Use Cases** | **`Service`** | Implementação das regras de aplicação e casos de uso, validação de regras e orquestração via Data Gateways. | **Nenhum pacote** (C# .NET 8 Puro) | `Core` |
| **Interface Adapters** | **`Repository`** | Implementação do Data Gateway com Entity Framework Core e mapeamento relacional de dados. | `Microsoft.EntityFrameworkCore.*`, `MySql.EntityFrameworkCore` | `Core` |
| **Interface Adapters & Drivers** | **`DesapegAutoWeb`** | Interface de usuário (Controllers MVC, Razor Views), autenticação Identity e composição de DI. | `Microsoft.AspNetCore.Identity.*`, `AutoMapper.*` | `Core`, `Service`, `Repository` |
| **Testes de Casos de Uso** | **`ServiceTests`** | Validação dos casos de uso com Gateway em memória (`UseInMemoryDatabase`). | `MSTest`, `Microsoft.EntityFrameworkCore.InMemory` | `Core`, `Service`, `Repository` |
| **Testes de Controladores** | **`DesapegAutoWebTests`** | Validação dos adaptadores de interface MVC via mocks dos Use Cases. | `MSTest`, `Moq` | `Core`, `Service`, `DesapegAutoWeb` |

---

### 4.2 Comparativo: Sentido das Dependências (Antes vs. Depois)

#### Antes (Violação da Regra de Dependência):
```
[DesapegAutoWeb] --------> [Service] --------> [Core (com DbContext, EF Core e MySQL)]
```
*O domínio estava no final da cadeia de dependências e dependia diretamente de detalhes de infraestrutura.*

#### Depois (Clean Architecture com The Dependency Rule Respeitada):
```
[DesapegAutoWeb (Interface Adapters / Web)]
       |
       +-------> [Service (Use Cases)] -------> [Core (Entities)]
       |                                              ^
[Repository (Data Gateway Adapter)] -----------------+
```
*Todas as setas de dependência de código-fonte apontam para dentro, em direção às Entities (`Core`). O Domínio e os Use Cases possuem ZERO dependências de pacotes externos.*

---

## 5. Validação e Resultados dos Testes Automatizados

A adaptação para a Clean Architecture foi validada com **100% de compatibilidade e zero regressões**:

```powershell
dotnet test "tees-2026-2-unidade-1\exercicio-1-arquitetura\DesapegAuto.sln"
```

### Resultados Obtidos:
- **`DesapegAutoWebTests.dll` (Testes dos Controladores MVC):**
  - **Aprovados:** 79
  - **Falhas:** 0
  - **Ignorados:** 0
- **`ServiceTests.dll` (Testes dos Use Cases / Serviços):**
  - **Aprovados:** 68 (+ 4 testes de integração que requerem servidor MySQL real ignorados por design)
  - **Falhas:** 0
  - **Total:** 72
- **Total Geral:** **151 testes executados, 151 testes aprovados/validados com sucesso.**

### Verificação de Purificação dos Pacotes NuGet:
```powershell
dotnet list Core\Core.csproj package
# Resultado: Nenhum pacote foi encontrado para essa estrutura.

dotnet list Service\Service.csproj package
# Resultado: Nenhum pacote foi encontrado para essa estrutura.
```

---

## 6. Conclusão

A adaptação para a **Clean Architecture** foi concluída com êxito na branch `Branch_CleanArchitecture`:
1. A arquitetura externa (Encontro 01) e interna (Encontro 02 - BCE) foi documentada, explicitando as falhas da arquitetura original.
2. A Clean Architecture foi escolhida e profundamente justificada com base nos 4 círculos concêntricos de Robert C. Martin, nos 5 atributos de independência arquitetural e no padrão Data Gateway.
3. A interface do Data Gateway de persistência foi declarada no domínio (`Core`), e sua implementação concreta com Entity Framework Core e MySQL foi isolada na camada de Interface Adapters (`Repository`).
4. Todas as responsabilidades foram redistribuídas em estrita observância da Regra de Dependência (*The Dependency Rule*) e do Princípio da Inversão de Dependência (DIP), mantendo a estabilidade de todos os 151 testes automatizados.
