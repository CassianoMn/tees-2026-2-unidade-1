const { buildSchema } = require('graphql');

const typeDefs = `
  """
  Entidade Perfil (Relação 1:1 com Usuario)
  """
  type Perfil {
    id: ID!
    usuario_id: ID!
    bio: String!
    avatar_url: String!
    localizacao: String!
  }

  """
  Métricas agregadas do usuário na rede social
  """
  type EstatisticasUsuario {
    total_posts: Int!
    total_seguidores: Int!
    total_seguindo: Int!
  }

  """
  Entidade Usuario
  """
  type Usuario {
    id: ID!
    nome: String!
    email: String!
    criado_em: String!
    perfil: Perfil
    estatisticas: EstatisticasUsuario!
    posts: [Post!]!
    seguidores: [Seguidor!]!
    seguindo: [Seguidor!]!
    feed: [Post!]!
  }

  """
  Entidade Comentario (Relação N:M com atributo texto entre Usuario e Post)
  """
  type Comentario {
    id: ID!
    usuario_id: ID!
    post_id: ID!
    texto: String!
    criado_em: String!
    autor: Usuario
  }

  """
  Resumo do post retornado ao registrar uma curtida
  """
  type ResumoPostCurtida {
    id: ID!
    texto: String!
    total_curtidas: Int!
  }

  """
  Entidade Curtida (Relação N:M pura entre Usuario e Post)
  """
  type Curtida {
    usuario_id: ID!
    post_id: ID!
    criado_em: String!
    usuario: Usuario
    post: ResumoPostCurtida
  }

  """
  Entidade Post (Relação 1:N com Usuario como autor)
  """
  type Post {
    id: ID!
    usuario_id: ID!
    texto: String!
    criado_em: String!
    autor: Usuario
    total_comentarios: Int!
    total_curtidas: Int!
    comentarios: [Comentario!]!
    curtidas: [Curtida!]!
  }

  """
  Entidade Seguidor (Relação N:M auto-relacionamento segue em Usuario)
  """
  type Seguidor {
    usuario_id: ID!
    alvo_id: ID!
    criado_em: String!
    usuario: Usuario
    seguidor: Usuario
    alvo: Usuario
  }

  """
  As 5 Consultas obrigatórias do domínio
  """
  type Query {
    "1. Busca um usuário pelo ID (inclui seu Perfil 1:1 e estatísticas)"
    buscar_usuario(id: ID!): Usuario

    "2. Lista todos os posts criados por um usuário"
    posts_do_usuario(usuario_id: ID!): [Post!]!

    "3. Busca um post específico pelo ID com autor, comentários e curtidas"
    buscar_post(id: ID!): Post

    "4a. Lista quem segue o usuário informado"
    seguidores_de(id: ID!): [Seguidor!]!

    "4b. Lista quem o usuário informado está seguindo"
    seguindo_de(id: ID!): [Seguidor!]!

    "5. Retorna o feed do usuário (posts das pessoas que ele segue, ordenados por data)"
    feed_do_usuario(usuario_id: ID!): [Post!]!
  }

  """
  Os 5 Comandos obrigatórios do domínio
  """
  type Mutation {
    "1. Cria um novo usuário e inicializa seu Perfil (1:1)"
    criar_usuario(
      nome: String!
      email: String!
      bio: String
      avatar_url: String
      localizacao: String
    ): Usuario!

    "2. Cria um novo post para um usuário"
    criar_post(usuario_id: ID!, texto: String!): Post!

    "3. Adiciona um comentário (N:M com atributo texto) a um post"
    comentar(usuario_id: ID!, post_id: ID!, texto: String!): Comentario!

    "4. Registra uma curtida (N:M puro) de um usuário em um post"
    curtir(usuario_id: ID!, post_id: ID!): Curtida!

    "5. Faz um usuário seguir outro usuário (N:M auto)"
    seguir(usuario_id: ID!, alvo_id: ID!): Seguidor!

    "Utilitário para restaurar os dados iniciais em memória"
    reset: String!
  }
`;

const schema = buildSchema(typeDefs);

module.exports = {
  typeDefs,
  schema
};
