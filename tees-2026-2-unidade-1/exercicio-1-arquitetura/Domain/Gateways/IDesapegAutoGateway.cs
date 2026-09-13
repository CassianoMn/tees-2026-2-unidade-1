using System;

namespace Core.Databases;

/// <summary>
/// Persistence Data Gateway (Clean Architecture - Robert C. Martin).
/// Define a interface do gateway de persistência para as entidades e casos de uso de negócio,
/// aplicando a Regra de Dependência da Clean Architecture onde os adaptadores e frameworks
/// externos dependem desta abstração de domínio.
/// </summary>
public interface IDesapegAutoGateway : IDesapegAutoContext
{
}
