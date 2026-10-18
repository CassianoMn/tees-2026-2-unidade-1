# Protocolo B: GraphQL — Rede Social

Implementação do domínio da **Rede Social** utilizando **GraphQL** (consulta declarativa em grafo fortemente tipada).

> **O que o GraphQL faz melhor que o REST nesse domínio:** No domínio de rede social, o GraphQL é superior por **navegar o grafo (`Usuario` $\leftrightarrow$ `Perfil` $\leftrightarrow$ `Post` $\leftrightarrow$ `Comentario` $\leftrightarrow$ `Curtida` $\leftrightarrow$ `Seguidor`) em uma única requisição declarativa sem *over-fetching* nem *under-fetching***, permitindo que o cliente escolha exatamente quais campos aninhados deseja receber no `feed_do_usuario` ou ao combinar `seguidores_de` e `seguindo_de`.

---

## 1. Instruções para Executar (Do Zero)

### Pré-requisitos
- [Node.js](https://nodejs.org/) (v18 ou superior)

### Passo a passo
Na raiz do projeto (`Atividade 2` / `exercicio-2-protocolos`):

```bash
# 1. Instalar as dependências
npm install

# 2. Iniciar o servidor (sobe REST em /api e GraphQL em /graphql na porta 3000)
npm start

# Ou, se quiser subir APENAS o servidor GraphQL isoladamente:
npm run start:graphql
```

O servidor GraphQL estará disponível em:
- **Endpoint HTTP (`POST`):** `http://localhost:3000/graphql`
- **Playground Interativo (GraphiQL no navegador):** Acesse `http://localhost:3000/graphql` no navegador para explorar o schema e rodar queries/mutations com autocomplete.

---

## 2. Mapeamento das Operações para o Schema GraphQL

| Tipo | Operação do Domínio | Operação GraphQL (`POST /graphql`) |
| :--- | :--- | :--- |
| **Comando 1** | `criar_usuario(nome, email)` | `mutation { criar_usuario(nome, email, ...) { ... } }` |
| **Comando 2** | `criar_post(usuario_id, texto)` | `mutation { criar_post(usuario_id, texto) { ... } }` |
| **Comando 3** | `comentar(usuario_id, post_id, texto)` | `mutation { comentar(usuario_id, post_id, texto) { ... } }` |
| **Comando 4** | `curtir(usuario_id, post_id)` | `mutation { curtir(usuario_id, post_id) { ... } }` |
| **Comando 5** | `seguir(usuario_id, alvo_id)` | `mutation { seguir(usuario_id, alvo_id) { ... } }` |
| **Consulta 1** | `buscar_usuario(id)` | `query { buscar_usuario(id) { ... } }` |
| **Consulta 2** | `posts_do_usuario(usuario_id)` | `query { posts_do_usuario(usuario_id) { ... } }` |
| **Consulta 3** | `buscar_post(id)` | `query { buscar_post(id) { ... } }` |
| **Consulta 4** | `seguidores_de(id)` / `seguindo_de(id)` | `query { seguidores_de(id) { ... } seguindo_de(id) { ... } }` |
| **Consulta 5** | `feed_do_usuario(usuario_id)` | `query { feed_do_usuario(usuario_id) { ... } }` |

---

## 3. Os Cinco Comandos — `Mutation` (Exemplos Copiáveis de Requisição e Resposta)

### Comando 1: `criar_usuario(nome, email)`

**Documento GraphQL (copiável para o GraphiQL):**
```graphql
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
    estatisticas {
      total_posts
      total_seguidores
      total_seguindo
    }
  }
}
```

**Requisição HTTP (`curl`):**
```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { criar_usuario(nome: \"Diego Rocha\", email: \"diego@rede.com\", bio: \"Estudante de Sistemas de Informação\", localizacao: \"Aracaju, SE\") { id nome email perfil { id bio localizacao } estatisticas { total_posts total_seguidores total_seguindo } } }"}'
```

**Resposta (`200 OK`):**
```json
{
  "data": {
    "criar_usuario": {
      "id": "u4",
      "nome": "Diego Rocha",
      "email": "diego@rede.com",
      "perfil": {
        "id": "perf4",
        "bio": "Estudante de Sistemas de Informação",
        "localizacao": "Aracaju, SE"
      },
      "estatisticas": {
        "total_posts": 0,
        "total_seguidores": 0,
        "total_seguindo": 0
      }
    }
  }
}
```

---

### Comando 2: `criar_post(usuario_id, texto)`

**Documento GraphQL (copiável para o GraphiQL):**
```graphql
mutation {
  criar_post(usuario_id: "u4", texto: "Meu primeiro post via GraphQL!") {
    id
    texto
    criado_em
    autor {
      id
      nome
    }
  }
}
```

**Requisição HTTP (`curl`):**
```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { criar_post(usuario_id: \"u4\", texto: \"Meu primeiro post via GraphQL!\") { id texto criado_em autor { id nome } } }"}'
```

**Resposta (`200 OK`):**
```json
{
  "data": {
    "criar_post": {
      "id": "p4",
      "texto": "Meu primeiro post via GraphQL!",
      "criado_em": "2026-10-17T22:58:05.000Z",
      "autor": {
        "id": "u4",
        "nome": "Diego Rocha"
      }
    }
  }
}
```

---

### Comando 3: `comentar(usuario_id, post_id, texto)`

**Documento GraphQL (copiável para o GraphiQL):**
```graphql
mutation {
  comentar(
    usuario_id: "u4"
    post_id: "p1"
    texto: "Ótima explicação sobre REST e GraphQL!"
  ) {
    id
    post_id
    texto
    criado_em
    autor {
      id
      nome
    }
  }
}
```

**Requisição HTTP (`curl`):**
```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { comentar(usuario_id: \"u4\", post_id: \"p1\", texto: \"Ótima explicação sobre REST e GraphQL!\") { id post_id texto criado_em autor { id nome } } }"}'
```

**Resposta (`200 OK`):**
```json
{
  "data": {
    "comentar": {
      "id": "c3",
      "post_id": "p1",
      "texto": "Ótima explicação sobre REST e GraphQL!",
      "criado_em": "2026-10-17T22:58:10.000Z",
      "autor": {
        "id": "u4",
        "nome": "Diego Rocha"
      }
    }
  }
}
```

---

### Comando 4: `curtir(usuario_id, post_id)`

**Documento GraphQL (copiável para o GraphiQL):**
```graphql
mutation {
  curtir(usuario_id: "u4", post_id: "p1") {
    usuario_id
    post_id
    criado_em
    usuario {
      nome
    }
    post {
      id
      total_curtidas
    }
  }
}
```

**Requisição HTTP (`curl`):**
```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { curtir(usuario_id: \"u4\", post_id: \"p1\") { usuario_id post_id criado_em usuario { nome } post { id total_curtidas } } }"}'
```

**Resposta (`200 OK`):**
```json
{
  "data": {
    "curtir": {
      "usuario_id": "u4",
      "post_id": "p1",
      "criado_em": "2026-10-17T22:58:15.000Z",
      "usuario": {
        "nome": "Diego Rocha"
      },
      "post": {
        "id": "p1",
        "total_curtidas": 3
      }
    }
  }
}
```

---

### Comando 5: `seguir(usuario_id, alvo_id)`

**Documento GraphQL (copiável para o GraphiQL):**
```graphql
mutation {
  seguir(usuario_id: "u4", alvo_id: "u2") {
    usuario_id
    alvo_id
    criado_em
    seguidor {
      id
      nome
    }
    alvo {
      id
      nome
      estatisticas {
        total_seguidores
      }
    }
  }
}
```

**Requisição HTTP (`curl`):**
```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { seguir(usuario_id: \"u4\", alvo_id: \"u2\") { usuario_id alvo_id criado_em seguidor { id nome } alvo { id nome estatisticas { total_seguidores } } } }"}'
```

**Resposta (`200 OK`):**
```json
{
  "data": {
    "seguir": {
      "usuario_id": "u4",
      "alvo_id": "u2",
      "criado_em": "2026-10-17T22:58:20.000Z",
      "seguidor": {
        "id": "u4",
        "nome": "Diego Rocha"
      },
      "alvo": {
        "id": "u2",
        "nome": "Bruno Costa",
        "estatisticas": {
          "total_seguidores": 2
        }
      }
    }
  }
}
```

---

## 4. As Cinco Consultas — `Query` (Exemplos Copiáveis de Requisição e Resposta)

### Consulta 1: `buscar_usuario(id)`

**Documento GraphQL (copiável para o GraphiQL):**
```graphql
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
```

**Requisição HTTP (`curl`):**
```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"query { buscar_usuario(id: \"u1\") { id nome email perfil { id bio localizacao } estatisticas { total_posts total_seguidores total_seguindo } } }"}'
```

**Resposta (`200 OK`):**
```json
{
  "data": {
    "buscar_usuario": {
      "id": "u1",
      "nome": "Ana Silva",
      "email": "ana@rede.com",
      "perfil": {
        "id": "perf1",
        "bio": "Engenheira de Software e entusiasta de arquitetura de APIs",
        "localizacao": "Aracaju, SE"
      },
      "estatisticas": {
        "total_posts": 1,
        "total_seguidores": 2,
        "total_seguindo": 2
      }
    }
  }
}
```

---

### Consulta 2: `posts_do_usuario(usuario_id)`

**Documento GraphQL (copiável para o GraphiQL):**
```graphql
query {
  posts_do_usuario(usuario_id: "u2") {
    id
    texto
    criado_em
    total_curtidas
    total_comentarios
  }
}
```

**Requisição HTTP (`curl`):**
```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"query { posts_do_usuario(usuario_id: \"u2\") { id texto criado_em total_curtidas total_comentarios } }"}'
```

**Resposta (`200 OK`):**
```json
{
  "data": {
    "posts_do_usuario": [
      {
        "id": "p1",
        "texto": "Comparando REST e GraphQL na prática: enquanto o REST brilha na simplicidade e no cache HTTP por recurso, o GraphQL elimina o over-fetching ao montar o feed!",
        "criado_em": "2026-10-16T14:00:00.000Z",
        "total_curtidas": 2,
        "total_comentarios": 2
      }
    ]
  }
}
```

---

### Consulta 3: `buscar_post(id)`

**Documento GraphQL (copiável para o GraphiQL):**
```graphql
query {
  buscar_post(id: "p1") {
    id
    texto
    autor {
      id
      nome
      perfil {
        localizacao
      }
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
```

**Requisição HTTP (`curl`):**
```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"query { buscar_post(id: \"p1\") { id texto autor { id nome perfil { localizacao } } total_comentarios total_curtidas comentarios { id texto autor { nome } } curtidas { usuario { nome } } } }"}'
```

**Resposta (`200 OK`):**
```json
{
  "data": {
    "buscar_post": {
      "id": "p1",
      "texto": "Comparando REST e GraphQL na prática: enquanto o REST brilha na simplicidade e no cache HTTP por recurso, o GraphQL elimina o over-fetching ao montar o feed!",
      "autor": {
        "id": "u2",
        "nome": "Bruno Costa",
        "perfil": {
          "localizacao": "São Paulo, SP"
        }
      },
      "total_comentarios": 2,
      "total_curtidas": 2,
      "comentarios": [
        {
          "id": "c1",
          "texto": "Excelente ponto, Bruno! No feed a diferença de payload fica muito clara.",
          "autor": {
            "nome": "Ana Silva"
          }
        },
        {
          "id": "c2",
          "texto": "Concordo! E a introspecção do schema GraphQL facilita muito explorar o grafo social.",
          "autor": {
            "nome": "Carla Mendes"
          }
        }
      ],
      "curtidas": [
        {
          "usuario": {
            "nome": "Ana Silva"
          }
        },
        {
          "usuario": {
            "nome": "Carla Mendes"
          }
        }
      ]
    }
  }
}
```

---

### Consulta 4: `seguidores_de(id)` / `seguindo_de(id)`
Observe como no GraphQL podemos buscar **ambas** as listas (`seguidores_de` e `seguindo_de`) em **uma única viagem de rede (1 request HTTP)**, selecionando apenas `id`, `nome` e `localizacao`!

**Documento GraphQL (copiável para o GraphiQL):**
```graphql
query {
  seguidores_de(id: "u1") {
    criado_em
    usuario {
      id
      nome
      perfil {
        localizacao
      }
    }
  }
  seguindo_de(id: "u1") {
    criado_em
    usuario {
      id
      nome
      perfil {
        localizacao
      }
    }
  }
}
```

**Requisição HTTP (`curl`):**
```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"query { seguidores_de(id: \"u1\") { criado_em usuario { id nome perfil { localizacao } } } seguindo_de(id: \"u1\") { criado_em usuario { id nome perfil { localizacao } } } }"}'
```

**Resposta (`200 OK`):**
```json
{
  "data": {
    "seguidores_de": [
      {
        "criado_em": "2026-10-15T10:20:00.000Z",
        "usuario": {
          "id": "u2",
          "nome": "Bruno Costa",
          "perfil": {
            "localizacao": "São Paulo, SP"
          }
        }
      },
      {
        "criado_em": "2026-10-15T10:25:00.000Z",
        "usuario": {
          "id": "u3",
          "nome": "Carla Mendes",
          "perfil": {
            "localizacao": "Recife, PE"
          }
        }
      }
    ],
    "seguindo_de": [
      {
        "criado_em": "2026-10-15T10:10:00.000Z",
        "usuario": {
          "id": "u2",
          "nome": "Bruno Costa",
          "perfil": {
            "localizacao": "São Paulo, SP"
          }
        }
      },
      {
        "criado_em": "2026-10-15T10:15:00.000Z",
        "usuario": {
          "id": "u3",
          "nome": "Carla Mendes",
          "perfil": {
            "localizacao": "Recife, PE"
          }
        }
      }
    ]
  }
}
```

---

### Consulta 5: `feed_do_usuario(usuario_id)`
Compare esta resposta enxuta do GraphQL com a do REST: aqui pedimos apenas `id`, `texto`, `autor.nome`, `total_curtidas` e os comentários resumidos, reduzindo drasticamente o payload trafegado!

**Documento GraphQL (copiável para o GraphiQL):**
```graphql
query {
  feed_do_usuario(usuario_id: "u1") {
    id
    texto
    criado_em
    autor {
      id
      nome
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
}
```

**Requisição HTTP (`curl`):**
```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"query { feed_do_usuario(usuario_id: \"u1\") { id texto criado_em autor { id nome } total_curtidas total_comentarios comentarios { id texto autor { nome } } } }"}'
```

**Resposta (`200 OK`):**
```json
{
  "data": {
    "feed_do_usuario": [
      {
        "id": "p2",
        "texto": "Modelando uma rede social com Usuario, Perfil (1:1), Post (1:N), Comentario (N:M com atributo), Curtida (N:M puro) e Seguidor (N:M auto).",
        "criado_em": "2026-10-16T15:30:00.000Z",
        "autor": {
          "id": "u3",
          "nome": "Carla Mendes"
        },
        "total_curtidas": 1,
        "total_comentarios": 0,
        "comentarios": []
      },
      {
        "id": "p1",
        "texto": "Comparando REST e GraphQL na prática: enquanto o REST brilha na simplicidade e no cache HTTP por recurso, o GraphQL elimina o over-fetching ao montar o feed!",
        "criado_em": "2026-10-16T14:00:00.000Z",
        "autor": {
          "id": "u2",
          "nome": "Bruno Costa"
        },
        "total_curtidas": 2,
        "total_comentarios": 2,
        "comentarios": [
          {
            "id": "c1",
            "texto": "Excelente ponto, Bruno! No feed a diferença de payload fica muito clara.",
            "autor": {
              "nome": "Ana Silva"
            }
          },
          {
            "id": "c2",
            "texto": "Concordo! E a introspecção do schema GraphQL facilita muito explorar o grafo social.",
            "autor": {
              "nome": "Carla Mendes"
            }
          }
        ]
      }
    ]
  }
}
```
