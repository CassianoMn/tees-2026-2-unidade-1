using System.Linq;

namespace Core.Databases;

/// <summary>
/// Métodos de extensão para consultas de domínio, permitindo instruções como AsNoTracking()
/// sem depender de pacotes externos como Microsoft.EntityFrameworkCore.
/// </summary>
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
