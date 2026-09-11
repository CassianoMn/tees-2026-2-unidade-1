using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using Core.Databases;
using Microsoft.EntityFrameworkCore;

namespace Repository;

/// <summary>
/// Adaptador que encapsula um DbSet do Entity Framework Core e implementa
/// a porta de persistência IEntitySet do domínio.
/// </summary>
/// <typeparam name="T">Entidade de domínio</typeparam>
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
