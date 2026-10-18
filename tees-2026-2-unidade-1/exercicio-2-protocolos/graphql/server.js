const express = require('express');
const cors = require('cors');
const { graphql } = require('graphql');
const { schema } = require('./schema');
const { createGraphQLRoot } = require('./resolvers');
const { store: defaultStore } = require('../src/domain/store');

const GRAPHIQL_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>GraphiQL - Rede Social (Atividade 02)</title>
  <style>body { height: 100%; margin: 0; width: 100%; overflow: hidden; } #graphiql { height: 100vh; }</style>
  <link rel="stylesheet" href="https://unpkg.com/graphiql@3.0.10/graphiql.min.css" />
</head>
<body>
  <div id="graphiql">Carregando GraphiQL...</div>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/graphiql@3.0.10/graphiql.min.js"></script>
  <script>
    const fetcher = GraphiQL.createFetcher({ url: '/graphql' });
    const defaultQuery = \`# Bem-vindo ao GraphiQL da Rede Social (Atividade 02)
# Exemplo: Consultar o feed do usuário u1 escolhendo exatamente os campos desejados
query FeedDaAna {
  feed_do_usuario(usuario_id: "u1") {
    id
    texto
    criado_em
    autor {
      id
      nome
      perfil {
        bio
        localizacao
      }
    }
    total_curtidas
    total_comentarios
    comentarios {
      id
      texto
      autor {
        nome
      }
    }
  }
}\`;
    ReactDOM.createRoot(document.getElementById('graphiql')).render(
      React.createElement(GraphiQL, { fetcher, defaultQuery })
    );
  </script>
</body>
</html>`;

function createGraphQLHandler(store = defaultStore) {
  const rootValue = createGraphQLRoot(store, schema);

  return async (req, res) => {
    // Se for GET no navegador sem ?query= e aceitando HTML, renderiza o GraphiQL
    if (
      req.method === 'GET' &&
      !req.query.query &&
      req.headers.accept &&
      req.headers.accept.includes('text/html')
    ) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(GRAPHIQL_HTML);
    }

    const query = req.method === 'POST' ? req.body?.query : req.query?.query;
    let variables = req.method === 'POST' ? req.body?.variables : req.query?.variables;
    const operationName =
      req.method === 'POST' ? req.body?.operationName : req.query?.operationName;

    if (typeof variables === 'string') {
      try {
        variables = JSON.parse(variables);
      } catch (_) {
        return res.status(400).json({
          errors: [{ message: 'Variáveis GraphQL malformadas (JSON inválido).' }]
        });
      }
    }

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        errors: [{ message: 'O campo "query" é obrigatório na requisição GraphQL.' }]
      });
    }

    const result = await graphql({
      schema,
      source: query,
      rootValue,
      variableValues: variables,
      operationName
    });

    // Formata erros para manter mensagens limpas e códigos de domínio
    if (result.errors) {
      result.errors = result.errors.map((err) => ({
        message: err.message,
        locations: err.locations,
        path: err.path,
        extensions: err.originalError?.code
          ? {
              code: err.originalError.code,
              statusCode: err.originalError.statusCode,
              details: err.originalError.details
            }
          : undefined
      }));
    }

    return res.status(200).json(result);
  };
}

const app = express();
app.use(cors());
app.use(express.json());
app.all('/graphql', createGraphQLHandler(defaultStore));

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[GraphQL] Servidor rodando em http://localhost:${PORT}/graphql`);
  });
}

module.exports = { app, createGraphQLHandler };
