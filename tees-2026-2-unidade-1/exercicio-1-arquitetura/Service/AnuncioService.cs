using Core;
using Core.Service;
using Core.Databases;

namespace Service
{
    public class AnuncioService : IAnuncioService
    {
        private readonly IDesapegAutoContext _context;

        public AnuncioService(IDesapegAutoContext context)
        {
            _context = context;
        }

        public int Create(Anuncio anuncio)
        {
            // Inicializa valores padr�o
            anuncio.DataPublicacao = System.DateTime.Now;
            anuncio.StatusAnuncio = anuncio.StatusAnuncio ?? "D"; // D = Dispon�vel
            anuncio.Visualizacoes = anuncio.Visualizacoes;

            _context.Add(anuncio);
            _context.SaveChanges();
            return anuncio.Id;
        }

        public void Edit(Anuncio anuncio)
        {
            _context.Update(anuncio);
            _context.SaveChanges();
        }

        public void Delete(int id)
        {
            var anuncio = _context.Anuncios.Find(id);
            if (anuncio != null)
            {
                _context.Remove(anuncio);
                _context.SaveChanges();
            }
        }

        public Anuncio? Get(int id)
        {
            return _context.Anuncios.Find(id);
        }

        public IEnumerable<Anuncio> GetAll()
        {
            return _context.Anuncios.AsNoTracking();
        }
    }
}
