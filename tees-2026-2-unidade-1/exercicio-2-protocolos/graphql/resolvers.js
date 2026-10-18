const { store: defaultStore } = require('../src/domain/store');

function createGraphQLRoot(store = defaultStore, schema = null) {
  // Se o schema for fornecido, conecta os resolvers de campos aninhados em Usuario
  if (schema) {
    const usuarioType = schema.getType('Usuario');
    if (usuarioType) {
      const fields = usuarioType.getFields();
      fields.posts.resolve = (usuario) => store.posts_do_usuario(usuario.id);
      fields.seguidores.resolve = (usuario) => store.seguidores_de(usuario.id);
      fields.seguindo.resolve = (usuario) => store.seguindo_de(usuario.id);
      fields.feed.resolve = (usuario) => store.feed_do_usuario(usuario.id);
    }
  }

  return {
    // =========================================================================
    // 5 CONSULTAS OBRIGATÓRIAS (Query)
    // =========================================================================
    buscar_usuario: ({ id }) => store.buscar_usuario(id),
    posts_do_usuario: ({ usuario_id }) => store.posts_do_usuario(usuario_id),
    buscar_post: ({ id }) => store.buscar_post(id),
    seguidores_de: ({ id }) => store.seguidores_de(id),
    seguindo_de: ({ id }) => store.seguindo_de(id),
    feed_do_usuario: ({ usuario_id }) => store.feed_do_usuario(usuario_id),

    // =========================================================================
    // 5 COMANDOS OBRIGATÓRIAS (Mutation)
    // =========================================================================
    criar_usuario: ({ nome, email, bio, avatar_url, localizacao }) =>
      store.criar_usuario({ nome, email, bio, avatar_url, localizacao }),
    criar_post: ({ usuario_id, texto }) => store.criar_post({ usuario_id, texto }),
    comentar: ({ usuario_id, post_id, texto }) =>
      store.comentar({ usuario_id, post_id, texto }),
    curtir: ({ usuario_id, post_id }) => store.curtir({ usuario_id, post_id }),
    seguir: ({ usuario_id, alvo_id }) => store.seguir({ usuario_id, alvo_id }),

    // Utilitário de reset
    reset: () => {
      store.reset();
      return 'Estado da rede social restaurado para os dados iniciais.';
    }
  };
}

module.exports = { createGraphQLRoot };
