const express = require('express');
const cors = require('cors');
const { store } = require('./domain/store');
const { createRestRouter } = require('../rest-json/routes');
const { createGraphQLHandler } = require('../graphql/server');

function createApp(customStore = store) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Rota raiz informativa
  app.get('/', (req, res) => {
    res.json({
      projeto: 'Atividade 02 - APIs e Protocolos (Rede Social)',
      dominio: ['Usuario', 'Perfil (1:1)', 'Post (1:N)', 'Comentario (N:M com atributo)', 'Curtida (N:M puro)', 'Seguidor (N:M auto)'],
      protocolos: {
        rest_json: {
          base_url: `http://localhost:${PORT}/api`,
          comandos: {
            criar_usuario: 'POST /api/usuarios',
            criar_post: 'POST /api/posts',
            comentar: 'POST /api/posts/:post_id/comentarios (ou POST /api/comentarios)',
            curtir: 'POST /api/posts/:post_id/curtidas (ou POST /api/curtidas)',
            seguir: 'POST /api/usuarios/:usuario_id/seguindo (ou POST /api/seguidores)'
          },
          consultas: {
            buscar_usuario: 'GET /api/usuarios/:id',
            posts_do_usuario: 'GET /api/usuarios/:usuario_id/posts',
            buscar_post: 'GET /api/posts/:id',
            seguidores_de: 'GET /api/usuarios/:id/seguidores',
            seguindo_de: 'GET /api/usuarios/:id/seguindo',
            feed_do_usuario: 'GET /api/usuarios/:usuario_id/feed'
          }
        },
        graphql: {
          endpoint: `http://localhost:${PORT}/graphql`,
          playground_navegador: `http://localhost:${PORT}/graphql`,
          mutations: ['criar_usuario', 'criar_post', 'comentar', 'curtir', 'seguir'],
          queries: [
            'buscar_usuario',
            'posts_do_usuario',
            'buscar_post',
            'seguidores_de',
            'seguindo_de',
            'feed_do_usuario'
          ]
        }
      }
    });
  });

  // Protocolo A: REST (JSON)
  app.use('/api', createRestRouter(customStore));

  // Protocolo B: GraphQL
  app.all('/graphql', createGraphQLHandler(customStore));

  return app;
}

const PORT = process.env.PORT || 3000;
const app = createApp(store);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log('===============================================================');
    console.log(' Rede Social - Servidor Unificado (REST + GraphQL)');
    console.log('===============================================================');
    console.log(` -> Visão Geral : http://localhost:${PORT}/`);
    console.log(` -> REST (JSON) : http://localhost:${PORT}/api`);
    console.log(` -> GraphQL     : http://localhost:${PORT}/graphql (GraphiQL no navegador)`);
    console.log('===============================================================');
  });
}

module.exports = { app, createApp };
