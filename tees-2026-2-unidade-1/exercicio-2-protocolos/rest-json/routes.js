const express = require('express');
const { DomainError, store: defaultStore } = require('../src/domain/store');

function createRestRouter(store = defaultStore) {
  const router = express.Router();

  const handleRequest = (fn, successStatus = 200) => (req, res) => {
    try {
      const result = fn(req, res);
      return res.status(successStatus).json({
        success: true,
        data: result
      });
    } catch (err) {
      if (err instanceof DomainError) {
        return res.status(err.statusCode).json({
          success: false,
          error: {
            code: err.code,
            message: err.message,
            details: err.details
          }
        });
      }
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: err.message || 'Erro interno no servidor REST.'
        }
      });
    }
  };

  // =========================================================================
  // COMANDOS (5 Operações de Escrita - POST)
  // =========================================================================

  // 1. criar_usuario(nome, email)
  router.post(
    '/usuarios',
    handleRequest((req) => {
      const { nome, email, bio, avatar_url, localizacao } = req.body || {};
      return store.criar_usuario({ nome, email, bio, avatar_url, localizacao });
    }, 201)
  );

  // 2. criar_post(usuario_id, texto)
  router.post(
    '/posts',
    handleRequest((req) => {
      const { usuario_id, texto } = req.body || {};
      return store.criar_post({ usuario_id, texto });
    }, 201)
  );

  // Rota aninhada equivalente: POST /api/usuarios/:usuario_id/posts
  router.post(
    '/usuarios/:usuario_id/posts',
    handleRequest((req) => {
      const { usuario_id } = req.params;
      const { texto } = req.body || {};
      return store.criar_post({ usuario_id, texto });
    }, 201)
  );

  // 3. comentar(usuario_id, post_id, texto)
  router.post(
    '/posts/:post_id/comentarios',
    handleRequest((req) => {
      const { post_id } = req.params;
      const { usuario_id, texto } = req.body || {};
      return store.comentar({ usuario_id, post_id, texto });
    }, 201)
  );

  // Rota equivalente plana: POST /api/comentarios
  router.post(
    '/comentarios',
    handleRequest((req) => {
      const { usuario_id, post_id, texto } = req.body || {};
      return store.comentar({ usuario_id, post_id, texto });
    }, 201)
  );

  // 4. curtir(usuario_id, post_id)
  router.post(
    '/posts/:post_id/curtidas',
    handleRequest((req) => {
      const { post_id } = req.params;
      const { usuario_id } = req.body || {};
      return store.curtir({ usuario_id, post_id });
    }, 201)
  );

  // Rota equivalente plana: POST /api/curtidas
  router.post(
    '/curtidas',
    handleRequest((req) => {
      const { usuario_id, post_id } = req.body || {};
      return store.curtir({ usuario_id, post_id });
    }, 201)
  );

  // 5. seguir(usuario_id, alvo_id)
  router.post(
    '/usuarios/:usuario_id/seguindo',
    handleRequest((req) => {
      const { usuario_id } = req.params;
      const { alvo_id } = req.body || {};
      return store.seguir({ usuario_id, alvo_id });
    }, 201)
  );

  // Rota equivalente plana: POST /api/seguidores
  router.post(
    '/seguidores',
    handleRequest((req) => {
      const { usuario_id, alvo_id } = req.body || {};
      return store.seguir({ usuario_id, alvo_id });
    }, 201)
  );

  // =========================================================================
  // CONSULTAS (5 Operações de Leitura - GET)
  // =========================================================================

  // 1. buscar_usuario(id)
  router.get(
    '/usuarios/:id',
    handleRequest((req) => {
      return store.buscar_usuario(req.params.id);
    })
  );

  // 2. posts_do_usuario(usuario_id)
  router.get(
    '/usuarios/:usuario_id/posts',
    handleRequest((req) => {
      return store.posts_do_usuario(req.params.usuario_id);
    })
  );

  // 3. buscar_post(id)
  router.get(
    '/posts/:id',
    handleRequest((req) => {
      return store.buscar_post(req.params.id);
    })
  );

  // 4a. seguidores_de(id)
  router.get(
    '/usuarios/:id/seguidores',
    handleRequest((req) => {
      return store.seguidores_de(req.params.id);
    })
  );

  // 4b. seguindo_de(id)
  router.get(
    '/usuarios/:id/seguindo',
    handleRequest((req) => {
      return store.seguindo_de(req.params.id);
    })
  );

  // 5. feed_do_usuario(usuario_id)
  router.get(
    '/usuarios/:usuario_id/feed',
    handleRequest((req) => {
      return store.feed_do_usuario(req.params.usuario_id);
    })
  );

  // Utilitário para restaurar o banco em memória ao estado inicial (seed)
  router.post(
    '/reset',
    handleRequest(() => {
      store.reset();
      return { message: 'Estado da rede social restaurado para os dados iniciais.' };
    })
  );

  return router;
}

module.exports = { createRestRouter };
