using System;
using System.Collections.Generic;
using System.Linq;

namespace Core.Databases;

/// <summary>
/// Porta de persistência para conjunto de entidades de domínio (EntityCollection).
/// Fornece operações de consulta LINQ e métodos de manipulação CRUD sem acoplamento a ORMs específicos.
/// </summary>
/// <typeparam name="T">Tipo da entidade de domínio</typeparam>
public interface IEntitySet<T> : IQueryable<T> where T : class
{
    void Add(T entity);
    void AddRange(IEnumerable<T> entities);
    void Update(T entity);
    void Remove(T entity);
    T? Find(params object?[]? keyValues);
    IQueryable<T> AsNoTracking();
}
