const assert = require('assert');
const { createApp } = require('../src/index');
const { SocialNetworkStore } = require('../src/domain/store');

async function runTests() {
  const store = new SocialNetworkStore();
  const app = createApp(store);

  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });

  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  console.log(`Iniciando bateria de testes automatizados em ${baseUrl}...\n`);

  try {
    // =========================================================================
    // PARTE 1: PROTOCOLO REST (JSON) - 5 COMANDOS E 5 CONSULTAS
    // =========================================================================
    console.log('--- [1/2] Testando Protocolo REST (JSON) ---');
    store.reset();

    // Comando 1: criar_usuario
    const resCriarUsuario = await fetch(`${baseUrl}/api/usuarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: 'Diego Rocha',
        email: 'diego@rede.com',
        bio: 'Estudante de Sistemas de Informação',
        localizacao: 'Aracaju, SE'
      })
    }).then((r) => r.json());
    assert.strictEqual(resCriarUsuario.success, true);
    assert.strictEqual(resCriarUsuario.data.id, 'u4');
    assert.strictEqual(resCriarUsuario.data.perfil.usuario_id, 'u4');
    console.log('  [OK] Comando 1 (REST): criar_usuario');

    // Comando 2: criar_post
    const resCriarPost = await fetch(`${baseUrl}/api/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usuario_id: 'u4',
        texto: 'Meu primeiro post via API REST!'
      })
    }).then((r) => r.json());
    assert.strictEqual(resCriarPost.success, true);
    assert.strictEqual(resCriarPost.data.id, 'p4');
    assert.strictEqual(resCriarPost.data.usuario_id, 'u4');
    console.log('  [OK] Comando 2 (REST): criar_post');

    // Comando 3: comentar
    const resComentar = await fetch(`${baseUrl}/api/posts/p1/comentarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usuario_id: 'u4',
        texto: 'Ótima explicação sobre REST e GraphQL!'
      })
    }).then((r) => r.json());
    assert.strictEqual(resComentar.success, true);
    assert.strictEqual(resComentar.data.id, 'c3');
    assert.strictEqual(resComentar.data.post_id, 'p1');
    console.log('  [OK] Comando 3 (REST): comentar');

    // Comando 4: curtir
    const resCurtir = await fetch(`${baseUrl}/api/posts/p1/curtidas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usuario_id: 'u4'
      })
    }).then((r) => r.json());
    assert.strictEqual(resCurtir.success, true);
    assert.strictEqual(resCurtir.data.usuario_id, 'u4');
    assert.strictEqual(resCurtir.data.post.total_curtidas, 3);
    console.log('  [OK] Comando 4 (REST): curtir');

    // Comando 5: seguir
    const resSeguir = await fetch(`${baseUrl}/api/usuarios/u4/seguindo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        alvo_id: 'u2'
      })
    }).then((r) => r.json());
    assert.strictEqual(resSeguir.success, true);
    assert.strictEqual(resSeguir.data.usuario_id, 'u4');
    assert.strictEqual(resSeguir.data.alvo_id, 'u2');
    console.log('  [OK] Comando 5 (REST): seguir');

    // Consulta 1: buscar_usuario
    const resBuscarUsuario = await fetch(`${baseUrl}/api/usuarios/u1`).then((r) => r.json());
    assert.strictEqual(resBuscarUsuario.success, true);
    assert.strictEqual(resBuscarUsuario.data.nome, 'Ana Silva');
    assert.strictEqual(resBuscarUsuario.data.perfil.id, 'perf1');
    console.log('  [OK] Consulta 1 (REST): buscar_usuario');

    // Consulta 2: posts_do_usuario
    const resPostsUsuario = await fetch(`${baseUrl}/api/usuarios/u2/posts`).then((r) => r.json());
    assert.strictEqual(resPostsUsuario.success, true);
    assert.strictEqual(resPostsUsuario.data.length, 1);
    assert.strictEqual(resPostsUsuario.data[0].id, 'p1');
    console.log('  [OK] Consulta 2 (REST): posts_do_usuario');

    // Consulta 3: buscar_post
    const resBuscarPost = await fetch(`${baseUrl}/api/posts/p1`).then((r) => r.json());
    assert.strictEqual(resBuscarPost.success, true);
    assert.strictEqual(resBuscarPost.data.id, 'p1');
    assert.strictEqual(resBuscarPost.data.total_comentarios, 3);
    assert.strictEqual(resBuscarPost.data.total_curtidas, 3);
    console.log('  [OK] Consulta 3 (REST): buscar_post');

    // Consulta 4: seguidores_de / seguindo_de
    const resSeguidores = await fetch(`${baseUrl}/api/usuarios/u2/seguidores`).then((r) => r.json());
    const resSeguindo = await fetch(`${baseUrl}/api/usuarios/u1/seguindo`).then((r) => r.json());
    assert.strictEqual(resSeguidores.success, true);
    assert.strictEqual(resSeguidores.data.length, 2); // u1 e u4 seguem u2
    assert.strictEqual(resSeguindo.success, true);
    assert.strictEqual(resSeguindo.data.length, 2); // u1 segue u2 e u3
    console.log('  [OK] Consulta 4 (REST): seguidores_de / seguindo_de');

    // Consulta 5: feed_do_usuario
    const resFeed = await fetch(`${baseUrl}/api/usuarios/u1/feed`).then((r) => r.json());
    assert.strictEqual(resFeed.success, true);
    assert.strictEqual(resFeed.data.length, 2); // posts p2 (de u3) e p1 (de u2)
    assert.strictEqual(resFeed.data[0].id, 'p2');
    assert.strictEqual(resFeed.data[1].id, 'p1');
    console.log('  [OK] Consulta 5 (REST): feed_do_usuario\n');

    // =========================================================================
    // PARTE 2: PROTOCOLO GRAPHQL - 5 COMANDOS E 5 CONSULTAS
    // =========================================================================
    console.log('--- [2/2] Testando Protocolo GraphQL ---');
    store.reset();

    const gqlRequest = async (query, variables = {}) => {
      const response = await fetch(`${baseUrl}/graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables })
      });
      return response.json();
    };

    // Comando 1: criar_usuario
    const gqlCriarUsuario = await gqlRequest(`
      mutation {
        criar_usuario(
          nome: "Diego Rocha"
          email: "diego@rede.com"
          bio: "Estudante de Sistemas de Informação"
          localizacao: "Aracaju, SE"
        ) {
          id
          nome
          email
          perfil {
            id
            bio
            localizacao
          }
        }
      }
    `);
    assert(!gqlCriarUsuario.errors, JSON.stringify(gqlCriarUsuario.errors));
    assert.strictEqual(gqlCriarUsuario.data.criar_usuario.id, 'u4');
    console.log('  [OK] Comando 1 (GraphQL): criar_usuario');

    // Comando 2: criar_post
    const gqlCriarPost = await gqlRequest(`
      mutation {
        criar_post(usuario_id: "u4", texto: "Meu primeiro post via GraphQL!") {
          id
          texto
          autor {
            id
            nome
          }
        }
      }
    `);
    assert(!gqlCriarPost.errors, JSON.stringify(gqlCriarPost.errors));
    assert.strictEqual(gqlCriarPost.data.criar_post.id, 'p4');
    console.log('  [OK] Comando 2 (GraphQL): criar_post');

    // Comando 3: comentar
    const gqlComentar = await gqlRequest(`
      mutation {
        comentar(usuario_id: "u4", post_id: "p1", texto: "Ótima explicação sobre REST e GraphQL!") {
          id
          texto
          post_id
          autor {
            id
            nome
          }
        }
      }
    `);
    assert(!gqlComentar.errors, JSON.stringify(gqlComentar.errors));
    assert.strictEqual(gqlComentar.data.comentar.id, 'c3');
    console.log('  [OK] Comando 3 (GraphQL): comentar');

    // Comando 4: curtir
    const gqlCurtir = await gqlRequest(`
      mutation {
        curtir(usuario_id: "u4", post_id: "p1") {
          usuario_id
          post_id
          usuario {
            nome
          }
          post {
            id
            total_curtidas
          }
        }
      }
    `);
    assert(!gqlCurtir.errors, JSON.stringify(gqlCurtir.errors));
    assert.strictEqual(gqlCurtir.data.curtir.post.total_curtidas, 3);
    console.log('  [OK] Comando 4 (GraphQL): curtir');

    // Comando 5: seguir
    const gqlSeguir = await gqlRequest(`
      mutation {
        seguir(usuario_id: "u4", alvo_id: "u2") {
          usuario_id
          alvo_id
          seguidor {
            nome
          }
          alvo {
            nome
          }
        }
      }
    `);
    assert(!gqlSeguir.errors, JSON.stringify(gqlSeguir.errors));
    assert.strictEqual(gqlSeguir.data.seguir.alvo.nome, 'Bruno Costa');
    console.log('  [OK] Comando 5 (GraphQL): seguir');

    // Consulta 1: buscar_usuario
    const gqlBuscarUsuario = await gqlRequest(`
      query {
        buscar_usuario(id: "u1") {
          id
          nome
          email
          perfil {
            id
            bio
            localizacao
          }
          estatisticas {
            total_posts
            total_seguidores
            total_seguindo
          }
        }
      }
    `);
    assert(!gqlBuscarUsuario.errors, JSON.stringify(gqlBuscarUsuario.errors));
    assert.strictEqual(gqlBuscarUsuario.data.buscar_usuario.nome, 'Ana Silva');
    console.log('  [OK] Consulta 1 (GraphQL): buscar_usuario');

    // Consulta 2: posts_do_usuario
    const gqlPostsUsuario = await gqlRequest(`
      query {
        posts_do_usuario(usuario_id: "u2") {
          id
          texto
          total_curtidas
          total_comentarios
        }
      }
    `);
    assert(!gqlPostsUsuario.errors, JSON.stringify(gqlPostsUsuario.errors));
    assert.strictEqual(gqlPostsUsuario.data.posts_do_usuario.length, 1);
    console.log('  [OK] Consulta 2 (GraphQL): posts_do_usuario');

    // Consulta 3: buscar_post
    const gqlBuscarPost = await gqlRequest(`
      query {
        buscar_post(id: "p1") {
          id
          texto
          autor {
            nome
          }
          total_comentarios
          total_curtidas
          comentarios {
            id
            texto
            autor {
              nome
            }
          }
          curtidas {
            usuario {
              nome
            }
          }
        }
      }
    `);
    assert(!gqlBuscarPost.errors, JSON.stringify(gqlBuscarPost.errors));
    assert.strictEqual(gqlBuscarPost.data.buscar_post.total_comentarios, 3);
    console.log('  [OK] Consulta 3 (GraphQL): buscar_post');

    // Consulta 4: seguidores_de / seguindo_de
    const gqlConexoes = await gqlRequest(`
      query {
        seguidores_de(id: "u2") {
          criado_em
          usuario {
            id
            nome
          }
        }
        seguindo_de(id: "u1") {
          criado_em
          usuario {
            id
            nome
          }
        }
      }
    `);
    assert(!gqlConexoes.errors, JSON.stringify(gqlConexoes.errors));
    assert.strictEqual(gqlConexoes.data.seguidores_de.length, 2);
    assert.strictEqual(gqlConexoes.data.seguindo_de.length, 2);
    console.log('  [OK] Consulta 4 (GraphQL): seguidores_de / seguindo_de');

    // Consulta 5: feed_do_usuario
    const gqlFeed = await gqlRequest(`
      query {
        feed_do_usuario(usuario_id: "u1") {
          id
          texto
          criado_em
          autor {
            id
            nome
            perfil {
              avatar_url
            }
          }
          total_curtidas
          total_comentarios
        }
      }
    `);
    assert(!gqlFeed.errors, JSON.stringify(gqlFeed.errors));
    assert.strictEqual(gqlFeed.data.feed_do_usuario.length, 2);
    console.log('  [OK] Consulta 5 (GraphQL): feed_do_usuario');

    console.log('\n===============================================================');
    console.log(' SUCESSO: Todas as 20 operações (10 REST + 10 GraphQL) passaram!');
    console.log('===============================================================');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('Falha nos testes:', err);
  process.exit(1);
});
