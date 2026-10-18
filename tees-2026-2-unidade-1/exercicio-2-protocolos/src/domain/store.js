class DomainError extends Error {
  constructor(code, message, statusCode = 400, details = []) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

class SocialNetworkStore {
  constructor() {
    this.reset();
  }

  reset() {
    this.counters = {
      usuario: 3,
      perfil: 3,
      post: 3,
      comentario: 2
    };

    // Entidade 1: Usuario
    this.usuarios = [
      {
        id: 'u1',
        nome: 'Ana Silva',
        email: 'ana@rede.com',
        criado_em: '2026-10-15T10:00:00.000Z'
      },
      {
        id: 'u2',
        nome: 'Bruno Costa',
        email: 'bruno@rede.com',
        criado_em: '2026-10-15T10:05:00.000Z'
      },
      {
        id: 'u3',
        nome: 'Carla Mendes',
        email: 'carla@rede.com',
        criado_em: '2026-10-15T10:08:00.000Z'
      }
    ];

    // Entidade 2: Perfil (Relação 1:1 com Usuario)
    this.perfis = [
      {
        id: 'perf1',
        usuario_id: 'u1',
        bio: 'Engenheira de Software e entusiasta de arquitetura de APIs',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana',
        localizacao: 'Aracaju, SE'
      },
      {
        id: 'perf2',
        usuario_id: 'u2',
        bio: 'Desenvolvedor Backend | Node.js, REST & GraphQL',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bruno',
        localizacao: 'São Paulo, SP'
      },
      {
        id: 'perf3',
        usuario_id: 'u3',
        bio: 'Pesquisadora em Sistemas Distribuídos e Protocolos de Rede',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carla',
        localizacao: 'Recife, PE'
      }
    ];

    // Entidade 3: Post (Relação 1:N com Usuario como autor)
    this.posts = [
      {
        id: 'p1',
        usuario_id: 'u2',
        texto: 'Comparando REST e GraphQL na prática: enquanto o REST brilha na simplicidade e no cache HTTP por recurso, o GraphQL elimina o over-fetching ao montar o feed!',
        criado_em: '2026-10-16T14:00:00.000Z'
      },
      {
        id: 'p2',
        usuario_id: 'u3',
        texto: 'Modelando uma rede social com Usuario, Perfil (1:1), Post (1:N), Comentario (N:M com atributo), Curtida (N:M puro) e Seguidor (N:M auto).',
        criado_em: '2026-10-16T15:30:00.000Z'
      },
      {
        id: 'p3',
        usuario_id: 'u1',
        texto: 'Iniciando os experimentos da Atividade 02 de Tópicos Especiais em Engenharia de Software!',
        criado_em: '2026-10-16T16:45:00.000Z'
      }
    ];

    // Entidade 4: Comentario (Relação N:M com atributo `texto` entre Usuario e Post)
    this.comentarios = [
      {
        id: 'c1',
        usuario_id: 'u1',
        post_id: 'p1',
        texto: 'Excelente ponto, Bruno! No feed a diferença de payload fica muito clara.',
        criado_em: '2026-10-16T14:15:00.000Z'
      },
      {
        id: 'c2',
        usuario_id: 'u3',
        post_id: 'p1',
        texto: 'Concordo! E a introspecção do schema GraphQL facilita muito explorar o grafo social.',
        criado_em: '2026-10-16T14:30:00.000Z'
      }
    ];

    // Entidade 5: Curtida (Relação N:M pura entre Usuario e Post)
    this.curtidas = [
      {
        usuario_id: 'u1',
        post_id: 'p1',
        criado_em: '2026-10-16T14:10:00.000Z'
      },
      {
        usuario_id: 'u3',
        post_id: 'p1',
        criado_em: '2026-10-16T14:25:00.000Z'
      },
      {
        usuario_id: 'u1',
        post_id: 'p2',
        criado_em: '2026-10-16T15:40:00.000Z'
      },
      {
        usuario_id: 'u2',
        post_id: 'p3',
        criado_em: '2026-10-16T17:00:00.000Z'
      }
    ];

    // Entidade 6: Seguidor (Relação N:M auto-relacionamento `segue` em Usuario)
    this.seguidores = [
      {
        usuario_id: 'u1',
        alvo_id: 'u2',
        criado_em: '2026-10-15T10:10:00.000Z'
      },
      {
        usuario_id: 'u1',
        alvo_id: 'u3',
        criado_em: '2026-10-15T10:15:00.000Z'
      },
      {
        usuario_id: 'u2',
        alvo_id: 'u1',
        criado_em: '2026-10-15T10:20:00.000Z'
      },
      {
        usuario_id: 'u3',
        alvo_id: 'u1',
        criado_em: '2026-10-15T10:25:00.000Z'
      }
    ];
  }

  // =========================================================================
  // Helpers internos de enriquecimento de entidades
  // =========================================================================

  _getUsuarioRawOrThrow(id, fieldName = 'usuario_id') {
    const usuario = this.usuarios.find((u) => u.id === id);
    if (!usuario) {
      throw new DomainError(
        'USUARIO_NAO_ENCONTRADO',
        `Usuário com id '${id}' não foi encontrado.`,
        404,
        [{ field: fieldName, message: `Nenhum registro encontrado para id '${id}'` }]
      );
    }
    return usuario;
  }

  _getPostRawOrThrow(id, fieldName = 'post_id') {
    const post = this.posts.find((p) => p.id === id);
    if (!post) {
      throw new DomainError(
        'POST_NAO_ENCONTRADO',
        `Post com id '${id}' não foi encontrado.`,
        404,
        [{ field: fieldName, message: `Nenhum registro encontrado para id '${id}'` }]
      );
    }
    return post;
  }

  _enrichUsuario(usuario) {
    const perfil = this.perfis.find((p) => p.usuario_id === usuario.id) || null;
    const total_posts = this.posts.filter((p) => p.usuario_id === usuario.id).length;
    const total_seguidores = this.seguidores.filter((s) => s.alvo_id === usuario.id).length;
    const total_seguindo = this.seguidores.filter((s) => s.usuario_id === usuario.id).length;

    return {
      ...usuario,
      perfil,
      estatisticas: {
        total_posts,
        total_seguidores,
        total_seguindo
      }
    };
  }

  _enrichComentario(comentario) {
    const autorRaw = this.usuarios.find((u) => u.id === comentario.usuario_id);
    return {
      ...comentario,
      autor: autorRaw ? this._enrichUsuario(autorRaw) : null
    };
  }

  _enrichCurtida(curtida) {
    const usuarioRaw = this.usuarios.find((u) => u.id === curtida.usuario_id);
    return {
      ...curtida,
      usuario: usuarioRaw ? this._enrichUsuario(usuarioRaw) : null
    };
  }

  _enrichPost(post) {
    const autorRaw = this.usuarios.find((u) => u.id === post.usuario_id);
    const comentarios = this.comentarios
      .filter((c) => c.post_id === post.id)
      .map((c) => this._enrichComentario(c));
    const curtidas = this.curtidas
      .filter((l) => l.post_id === post.id)
      .map((l) => this._enrichCurtida(l));

    return {
      ...post,
      autor: autorRaw ? this._enrichUsuario(autorRaw) : null,
      total_comentarios: comentarios.length,
      total_curtidas: curtidas.length,
      comentarios,
      curtidas
    };
  }

  // =========================================================================
  // COMANDOS OBRIGATÓRIOS (5)
  // =========================================================================

  /**
   * 1. criar_usuario(nome, email)
   * Cria um Usuario e automaticamente inicializa seu Perfil (1:1).
   */
  criar_usuario({ nome, email, bio, avatar_url, localizacao }) {
    const details = [];
    if (!nome || typeof nome !== 'string' || !nome.trim()) {
      details.push({ field: 'nome', message: 'O campo nome é obrigatório.' });
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      details.push({ field: 'email', message: 'Informe um e-mail válido.' });
    }
    if (details.length > 0) {
      throw new DomainError('VALIDATION_ERROR', 'Dados inválidos para criação de usuário.', 400, details);
    }

    const emailNormalizado = email.trim().toLowerCase();
    const existente = this.usuarios.find((u) => u.email.toLowerCase() === emailNormalizado);
    if (existente) {
      throw new DomainError(
        'EMAIL_JA_CADASTRADO',
        `Já existe um usuário cadastrado com o e-mail '${emailNormalizado}'.`,
        409,
        [{ field: 'email', message: 'E-mail já está em uso.' }]
      );
    }

    this.counters.usuario += 1;
    this.counters.perfil += 1;

    const novoUsuario = {
      id: `u${this.counters.usuario}`,
      nome: nome.trim(),
      email: emailNormalizado,
      criado_em: new Date().toISOString()
    };

    const novoPerfil = {
      id: `perf${this.counters.perfil}`,
      usuario_id: novoUsuario.id,
      bio: bio ? String(bio).trim() : `Olá! Eu sou ${novoUsuario.nome} na rede social.`,
      avatar_url: avatar_url
        ? String(avatar_url).trim()
        : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(novoUsuario.nome)}`,
      localizacao: localizacao ? String(localizacao).trim() : 'Brasil'
    };

    this.usuarios.push(novoUsuario);
    this.perfis.push(novoPerfil);

    return this._enrichUsuario(novoUsuario);
  }

  /**
   * 2. criar_post(usuario_id, texto)
   * Cria um Post (1:N) associado ao autor usuario_id.
   */
  criar_post({ usuario_id, texto }) {
    const details = [];
    if (!usuario_id || typeof usuario_id !== 'string' || !usuario_id.trim()) {
      details.push({ field: 'usuario_id', message: 'O campo usuario_id é obrigatório.' });
    }
    if (!texto || typeof texto !== 'string' || !texto.trim()) {
      details.push({ field: 'texto', message: 'O texto do post não pode ser vazio.' });
    }
    if (details.length > 0) {
      throw new DomainError('VALIDATION_ERROR', 'Dados inválidos para criação de post.', 400, details);
    }

    this._getUsuarioRawOrThrow(usuario_id.trim(), 'usuario_id');

    this.counters.post += 1;
    const novoPost = {
      id: `p${this.counters.post}`,
      usuario_id: usuario_id.trim(),
      texto: texto.trim(),
      criado_em: new Date().toISOString()
    };

    this.posts.push(novoPost);
    return this._enrichPost(novoPost);
  }

  /**
   * 3. comentar(usuario_id, post_id, texto)
   * Cria um Comentario (N:M com atributo `texto` entre Usuario e Post).
   */
  comentar({ usuario_id, post_id, texto }) {
    const details = [];
    if (!usuario_id || typeof usuario_id !== 'string' || !usuario_id.trim()) {
      details.push({ field: 'usuario_id', message: 'O campo usuario_id é obrigatório.' });
    }
    if (!post_id || typeof post_id !== 'string' || !post_id.trim()) {
      details.push({ field: 'post_id', message: 'O campo post_id é obrigatório.' });
    }
    if (!texto || typeof texto !== 'string' || !texto.trim()) {
      details.push({ field: 'texto', message: 'O texto do comentário é obrigatório.' });
    }
    if (details.length > 0) {
      throw new DomainError('VALIDATION_ERROR', 'Dados inválidos para criação de comentário.', 400, details);
    }

    this._getUsuarioRawOrThrow(usuario_id.trim(), 'usuario_id');
    this._getPostRawOrThrow(post_id.trim(), 'post_id');

    this.counters.comentario += 1;
    const novoComentario = {
      id: `c${this.counters.comentario}`,
      usuario_id: usuario_id.trim(),
      post_id: post_id.trim(),
      texto: texto.trim(),
      criado_em: new Date().toISOString()
    };

    this.comentarios.push(novoComentario);
    return this._enrichComentario(novoComentario);
  }

  /**
   * 4. curtir(usuario_id, post_id)
   * Registra uma Curtida (N:M puro entre Usuario e Post).
   */
  curtir({ usuario_id, post_id }) {
    const details = [];
    if (!usuario_id || typeof usuario_id !== 'string' || !usuario_id.trim()) {
      details.push({ field: 'usuario_id', message: 'O campo usuario_id é obrigatório.' });
    }
    if (!post_id || typeof post_id !== 'string' || !post_id.trim()) {
      details.push({ field: 'post_id', message: 'O campo post_id é obrigatório.' });
    }
    if (details.length > 0) {
      throw new DomainError('VALIDATION_ERROR', 'Dados inválidos para curtir post.', 400, details);
    }

    const uId = usuario_id.trim();
    const pId = post_id.trim();

    this._getUsuarioRawOrThrow(uId, 'usuario_id');
    const post = this._getPostRawOrThrow(pId, 'post_id');

    let curtida = this.curtidas.find((c) => c.usuario_id === uId && c.post_id === pId);
    if (!curtida) {
      curtida = {
        usuario_id: uId,
        post_id: pId,
        criado_em: new Date().toISOString()
      };
      this.curtidas.push(curtida);
    }

    return {
      ...this._enrichCurtida(curtida),
      post: {
        id: post.id,
        texto: post.texto,
        total_curtidas: this.curtidas.filter((c) => c.post_id === pId).length
      }
    };
  }

  /**
   * 5. seguir(usuario_id, alvo_id)
   * Registra um relacionamento Seguidor (N:M auto em Usuario).
   */
  seguir({ usuario_id, alvo_id }) {
    const details = [];
    if (!usuario_id || typeof usuario_id !== 'string' || !usuario_id.trim()) {
      details.push({ field: 'usuario_id', message: 'O campo usuario_id é obrigatório.' });
    }
    if (!alvo_id || typeof alvo_id !== 'string' || !alvo_id.trim()) {
      details.push({ field: 'alvo_id', message: 'O campo alvo_id é obrigatório.' });
    }
    if (details.length > 0) {
      throw new DomainError('VALIDATION_ERROR', 'Dados inválidos para seguir usuário.', 400, details);
    }

    const uId = usuario_id.trim();
    const aId = alvo_id.trim();

    if (uId === aId) {
      throw new DomainError(
        'AUTO_SEGUIMENTO_INVALIDO',
        'Um usuário não pode seguir a si mesmo.',
        400,
        [{ field: 'alvo_id', message: 'alvo_id deve ser diferente de usuario_id.' }]
      );
    }

    const seguidorRaw = this._getUsuarioRawOrThrow(uId, 'usuario_id');
    const alvoRaw = this._getUsuarioRawOrThrow(aId, 'alvo_id');

    let relacao = this.seguidores.find((s) => s.usuario_id === uId && s.alvo_id === aId);
    if (!relacao) {
      relacao = {
        usuario_id: uId,
        alvo_id: aId,
        criado_em: new Date().toISOString()
      };
      this.seguidores.push(relacao);
    }

    return {
      ...relacao,
      seguidor: this._enrichUsuario(seguidorRaw),
      alvo: this._enrichUsuario(alvoRaw)
    };
  }

  // =========================================================================
  // CONSULTAS OBRIGATÓRIAS (5)
  // =========================================================================

  /**
   * 1. buscar_usuario(id)
   */
  buscar_usuario(id) {
    const usuario = this._getUsuarioRawOrThrow(id, 'id');
    return this._enrichUsuario(usuario);
  }

  /**
   * 2. posts_do_usuario(usuario_id)
   */
  posts_do_usuario(usuario_id) {
    this._getUsuarioRawOrThrow(usuario_id, 'usuario_id');
    return this.posts
      .filter((p) => p.usuario_id === usuario_id)
      .sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em))
      .map((p) => this._enrichPost(p));
  }

  /**
   * 3. buscar_post(id)
   */
  buscar_post(id) {
    const post = this._getPostRawOrThrow(id, 'id');
    return this._enrichPost(post);
  }

  /**
   * 4a. seguidores_de(id) - quem segue este usuário
   */
  seguidores_de(id) {
    this._getUsuarioRawOrThrow(id, 'id');
    return this.seguidores
      .filter((s) => s.alvo_id === id)
      .map((s) => {
        const seguidorRaw = this.usuarios.find((u) => u.id === s.usuario_id);
        return {
          usuario_id: s.usuario_id,
          alvo_id: s.alvo_id,
          criado_em: s.criado_em,
          usuario: seguidorRaw ? this._enrichUsuario(seguidorRaw) : null
        };
      });
  }

  /**
   * 4b. seguindo_de(id) - quem este usuário segue
   */
  seguindo_de(id) {
    this._getUsuarioRawOrThrow(id, 'id');
    return this.seguidores
      .filter((s) => s.usuario_id === id)
      .map((s) => {
        const alvoRaw = this.usuarios.find((u) => u.id === s.alvo_id);
        return {
          usuario_id: s.usuario_id,
          alvo_id: s.alvo_id,
          criado_em: s.criado_em,
          usuario: alvoRaw ? this._enrichUsuario(alvoRaw) : null
        };
      });
  }

  /**
   * 5. feed_do_usuario(usuario_id)
   * Retorna os posts publicados pelas pessoas que `usuario_id` segue,
   * ordenados do mais recente para o mais antigo.
   */
  feed_do_usuario(usuario_id) {
    this._getUsuarioRawOrThrow(usuario_id, 'usuario_id');
    const idsSeguindo = new Set(
      this.seguidores.filter((s) => s.usuario_id === usuario_id).map((s) => s.alvo_id)
    );

    return this.posts
      .filter((p) => idsSeguindo.has(p.usuario_id))
      .sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em))
      .map((p) => this._enrichPost(p));
  }
}

const defaultStore = new SocialNetworkStore();

module.exports = {
  SocialNetworkStore,
  DomainError,
  store: defaultStore
};
