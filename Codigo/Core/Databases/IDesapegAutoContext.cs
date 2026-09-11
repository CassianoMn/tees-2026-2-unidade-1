using System;

namespace Core.Databases;

/// <summary>
/// Porta de persistência unificada (Secondary / Driven Port) para a aplicação DesapegAuto.
/// Define os contratos de acesso a dados e persistência requeridos pelo domínio,
/// sem depender de qualquer detalhe ou biblioteca de infraestrutura (ORM, SQL, etc.).
/// </summary>
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
