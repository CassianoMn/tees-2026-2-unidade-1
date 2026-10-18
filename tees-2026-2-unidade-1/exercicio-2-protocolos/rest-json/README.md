# Protocolo A: REST (JSON) — Rede Social

Implementação do domínio da **Rede Social** utilizando o estilo arquitetural **REST sobre HTTP com payload JSON**.

> **O que o REST faz melhor que o GraphQL nesse domínio:** No domínio de rede social, o REST é superior na **simplicidade operacional e no aproveitamento nativo da semântica HTTP** (status codes `200`/`201`/`404`/`409` e cache HTTP por URL em recursos estáveis como `GET /api/usuarios/:id` ou `GET /api/posts/:id`), dispensando parsers de query no servidor.

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

# Ou, se quiser subir APENAS o servidor REST isoladamente:
npm run start:rest
```

O servidor REST estará disponível em:
- **Base URL:** `http://localhost:3000/api`
- Para restaurar os dados em memória ao estado original a qualquer momento:
  ```bash
  curl -X POST http://localhost:3000/api/reset
  ```

---

## 2. Mapeamento das Operações para Recursos REST

| Tipo | Operação do Domínio | Método e Endpoint REST |
| :--- | :--- | :--- |
| **Comando 1** | `criar_usuario(nome, email)` | `POST /api/usuarios` |
| **Comando 2** | `criar_post(usuario_id, texto)` | `POST /api/posts` *(ou `POST /api/usuarios/:usuario_id/posts`)* |
| **Comando 3** | `comentar(usuario_id, post_id, texto)` | `POST /api/posts/:post_id/comentarios` *(ou `POST /api/comentarios`)* |
| **Comando 4** | `curtir(usuario_id, post_id)` | `POST /api/posts/:post_id/curtidas` *(ou `POST /api/curtidas`)* |
| **Comando 5** | `seguir(usuario_id, alvo_id)` | `POST /api/usuarios/:usuario_id/seguindo` *(ou `POST /api/seguidores`)* |
| **Consulta 1** | `buscar_usuario(id)` | `GET /api/usuarios/:id` |
| **Consulta 2** | `posts_do_usuario(usuario_id)` | `GET /api/usuarios/:usuario_id/posts` |
| **Consulta 3** | `buscar_post(id)` | `GET /api/posts/:id` |
| **Consulta 4** | `seguidores_de(id)` / `seguindo_de(id)` | `GET /api/usuarios/:id/seguidores` e `GET /api/usuarios/:id/seguindo` |
| **Consulta 5** | `feed_do_usuario(usuario_id)` | `GET /api/usuarios/:usuario_id/feed` |

---

## 3. Os Cinco Comandos (Exemplos Copiáveis de Requisição e Resposta)

### Comando 1: `criar_usuario(nome, email)`
Cria a entidade `Usuario` e inicializa automaticamente sua entidade `Perfil` (relação `1:1`).

**Requisição (`curl`):**
```bash
curl -X POST http://localhost:3000/api/usuarios \
  -H "Content-Type: application/json" \
  -d '{"nome": "Diego Rocha", "email": "diego@rede.com", "bio": "Estudante de Sistemas de Informação", "localizacao": "Aracaju, SE"}'
```

**Resposta (`201 Created`):**
```json
{
  "success": true,
  "data": {
    "id": "u4",
    "nome": "Diego Rocha",
    "email": "diego@rede.com",
    "criado_em": "2026-10-17T22:58:00.000Z",
    "perfil": {
      "id": "perf4",
      "usuario_id": "u4",
      "bio": "Estudante de Sistemas de Informação",
      "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Diego%20Rocha",
      "localizacao": "Aracaju, SE"
    },
    "estatisticas": {
      "total_posts": 0,
      "total_seguidores": 0,
      "total_seguindo": 0
    }
  }
}
```

---

### Comando 2: `criar_post(usuario_id, texto)`
Cria um `Post` (relação `1:N` com `Usuario` como autor).

**Requisição (`curl`):**
```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{"usuario_id": "u4", "texto": "Meu primeiro post via API REST!"}'
```

**Resposta (`201 Created`):**
```json
{
  "success": true,
  "data": {
    "id": "p4",
    "usuario_id": "u4",
    "texto": "Meu primeiro post via API REST!",
    "criado_em": "2026-10-17T22:58:05.000Z",
    "autor": {
      "id": "u4",
      "nome": "Diego Rocha",
      "email": "diego@rede.com",
      "criado_em": "2026-10-17T22:58:00.000Z",
      "perfil": {
        "id": "perf4",
        "usuario_id": "u4",
        "bio": "Estudante de Sistemas de Informação",
        "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Diego%20Rocha",
        "localizacao": "Aracaju, SE"
      },
      "estatisticas": {
        "total_posts": 1,
        "total_seguidores": 0,
        "total_seguindo": 0
      }
    },
    "total_comentarios": 0,
    "total_curtidas": 0,
    "comentarios": [],
    "curtidas": []
  }
}
```

---

### Comando 3: `comentar(usuario_id, post_id, texto)`
Cria um `Comentario` (relação `N:M` com atributo `texto` entre `Usuario` e `Post`).

**Requisição (`curl`):**
```bash
curl -X POST http://localhost:3000/api/posts/p1/comentarios \
  -H "Content-Type: application/json" \
  -d '{"usuario_id": "u4", "texto": "Ótima explicação sobre REST e GraphQL!"}'
```

**Resposta (`201 Created`):**
```json
{
  "success": true,
  "data": {
    "id": "c3",
    "usuario_id": "u4",
    "post_id": "p1",
    "texto": "Ótima explicação sobre REST e GraphQL!",
    "criado_em": "2026-10-17T22:58:10.000Z",
    "autor": {
      "id": "u4",
      "nome": "Diego Rocha",
      "email": "diego@rede.com",
      "criado_em": "2026-10-17T22:58:00.000Z",
      "perfil": {
        "id": "perf4",
        "usuario_id": "u4",
        "bio": "Estudante de Sistemas de Informação",
        "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Diego%20Rocha",
        "localizacao": "Aracaju, SE"
      },
      "estatisticas": {
        "total_posts": 1,
        "total_seguidores": 0,
        "total_seguindo": 0
      }
    }
  }
}
```

---

### Comando 4: `curtir(usuario_id, post_id)`
Registra uma `Curtida` (relação `N:M` pura entre `Usuario` e `Post`).

**Requisição (`curl`):**
```bash
curl -X POST http://localhost:3000/api/posts/p1/curtidas \
  -H "Content-Type: application/json" \
  -d '{"usuario_id": "u4"}'
```

**Resposta (`201 Created`):**
```json
{
  "success": true,
  "data": {
    "usuario_id": "u4",
    "post_id": "p1",
    "criado_em": "2026-10-17T22:58:15.000Z",
    "usuario": {
      "id": "u4",
      "nome": "Diego Rocha",
      "email": "diego@rede.com",
      "criado_em": "2026-10-17T22:58:00.000Z",
      "perfil": {
        "id": "perf4",
        "usuario_id": "u4",
        "bio": "Estudante de Sistemas de Informação",
        "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Diego%20Rocha",
        "localizacao": "Aracaju, SE"
      },
      "estatisticas": {
        "total_posts": 1,
        "total_seguidores": 0,
        "total_seguindo": 0
      }
    },
    "post": {
      "id": "p1",
      "texto": "Comparando REST e GraphQL na prática: enquanto o REST brilha na simplicidade e no cache HTTP por recurso, o GraphQL elimina o over-fetching ao montar o feed!",
      "total_curtidas": 3
    }
  }
}
```

---

### Comando 5: `seguir(usuario_id, alvo_id)`
Registra um vínculo `Seguidor` (auto-relacionamento `N:M` `segue` entre `Usuario` e `Usuario`).

**Requisição (`curl`):**
```bash
curl -X POST http://localhost:3000/api/usuarios/u4/seguindo \
  -H "Content-Type: application/json" \
  -d '{"alvo_id": "u2"}'
```

**Resposta (`201 Created`):**
```json
{
  "success": true,
  "data": {
    "usuario_id": "u4",
    "alvo_id": "u2",
    "criado_em": "2026-10-17T22:58:20.000Z",
    "seguidor": {
      "id": "u4",
      "nome": "Diego Rocha",
      "email": "diego@rede.com",
      "criado_em": "2026-10-17T22:58:00.000Z",
      "perfil": {
        "id": "perf4",
        "usuario_id": "u4",
        "bio": "Estudante de Sistemas de Informação",
        "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Diego%20Rocha",
        "localizacao": "Aracaju, SE"
      },
      "estatisticas": {
        "total_posts": 1,
        "total_seguidores": 0,
        "total_seguindo": 1
      }
    },
    "alvo": {
      "id": "u2",
      "nome": "Bruno Costa",
      "email": "bruno@rede.com",
      "criado_em": "2026-10-15T10:05:00.000Z",
      "perfil": {
        "id": "perf2",
        "usuario_id": "u2",
        "bio": "Desenvolvedor Backend | Node.js, REST & GraphQL",
        "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Bruno",
        "localizacao": "São Paulo, SP"
      },
      "estatisticas": {
        "total_posts": 1,
        "total_seguidores": 2,
        "total_seguindo": 1
      }
    }
  }
}
```

---

## 4. As Cinco Consultas (Exemplos Copiáveis de Requisição e Resposta)

### Consulta 1: `buscar_usuario(id)`

**Requisição (`curl`):**
```bash
curl -X GET http://localhost:3000/api/usuarios/u1
```

**Resposta (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "id": "u1",
    "nome": "Ana Silva",
    "email": "ana@rede.com",
    "criado_em": "2026-10-15T10:00:00.000Z",
    "perfil": {
      "id": "perf1",
      "usuario_id": "u1",
      "bio": "Engenheira de Software e entusiasta de arquitetura de APIs",
      "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Ana",
      "localizacao": "Aracaju, SE"
    },
    "estatisticas": {
      "total_posts": 1,
      "total_seguidores": 2,
      "total_seguindo": 2
    }
  }
}
```

---

### Consulta 2: `posts_do_usuario(usuario_id)`

**Requisição (`curl`):**
```bash
curl -X GET http://localhost:3000/api/usuarios/u2/posts
```

**Resposta (`200 OK`):**
```json
{
  "success": true,
  "data": [
    {
      "id": "p1",
      "usuario_id": "u2",
      "texto": "Comparando REST e GraphQL na prática: enquanto o REST brilha na simplicidade e no cache HTTP por recurso, o GraphQL elimina o over-fetching ao montar o feed!",
      "criado_em": "2026-10-16T14:00:00.000Z",
      "autor": {
        "id": "u2",
        "nome": "Bruno Costa",
        "email": "bruno@rede.com",
        "criado_em": "2026-10-15T10:05:00.000Z",
        "perfil": {
          "id": "perf2",
          "usuario_id": "u2",
          "bio": "Desenvolvedor Backend | Node.js, REST & GraphQL",
          "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Bruno",
          "localizacao": "São Paulo, SP"
        },
        "estatisticas": {
          "total_posts": 1,
          "total_seguidores": 1,
          "total_seguindo": 1
        }
      },
      "total_comentarios": 2,
      "total_curtidas": 2,
      "comentarios": [
        {
          "id": "c1",
          "usuario_id": "u1",
          "post_id": "p1",
          "texto": "Excelente ponto, Bruno! No feed a diferença de payload fica muito clara.",
          "criado_em": "2026-10-16T14:15:00.000Z",
          "autor": {
            "id": "u1",
            "nome": "Ana Silva",
            "email": "ana@rede.com",
            "criado_em": "2026-10-15T10:00:00.000Z",
            "perfil": {
              "id": "perf1",
              "usuario_id": "u1",
              "bio": "Engenheira de Software e entusiasta de arquitetura de APIs",
              "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Ana",
              "localizacao": "Aracaju, SE"
            },
            "estatisticas": {
              "total_posts": 1,
              "total_seguidores": 2,
              "total_seguindo": 2
            }
          }
        },
        {
          "id": "c2",
          "usuario_id": "u3",
          "post_id": "p1",
          "texto": "Concordo! E a introspecção do schema GraphQL facilita muito explorar o grafo social.",
          "criado_em": "2026-10-16T14:30:00.000Z",
          "autor": {
            "id": "u3",
            "nome": "Carla Mendes",
            "email": "carla@rede.com",
            "criado_em": "2026-10-15T10:08:00.000Z",
            "perfil": {
              "id": "perf3",
              "usuario_id": "u3",
              "bio": "Pesquisadora em Sistemas Distribuídos e Protocolos de Rede",
              "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Carla",
              "localizacao": "Recife, PE"
            },
            "estatisticas": {
              "total_posts": 1,
              "total_seguidores": 1,
              "total_seguindo": 1
            }
          }
        }
      ],
      "curtidas": [
        {
          "usuario_id": "u1",
          "post_id": "p1",
          "criado_em": "2026-10-16T14:10:00.000Z",
          "usuario": {
            "id": "u1",
            "nome": "Ana Silva",
            "email": "ana@rede.com",
            "criado_em": "2026-10-15T10:00:00.000Z",
            "perfil": {
              "id": "perf1",
              "usuario_id": "u1",
              "bio": "Engenheira de Software e entusiasta de arquitetura de APIs",
              "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Ana",
              "localizacao": "Aracaju, SE"
            },
            "estatisticas": {
              "total_posts": 1,
              "total_seguidores": 2,
              "total_seguindo": 2
            }
          }
        },
        {
          "usuario_id": "u3",
          "post_id": "p1",
          "criado_em": "2026-10-16T14:25:00.000Z",
          "usuario": {
            "id": "u3",
            "nome": "Carla Mendes",
            "email": "carla@rede.com",
            "criado_em": "2026-10-15T10:08:00.000Z",
            "perfil": {
              "id": "perf3",
              "usuario_id": "u3",
              "bio": "Pesquisadora em Sistemas Distribuídos e Protocolos de Rede",
              "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Carla",
              "localizacao": "Recife, PE"
            },
            "estatisticas": {
              "total_posts": 1,
              "total_seguidores": 1,
              "total_seguindo": 1
            }
          }
        }
      ]
    }
  ]
}
```

---

### Consulta 3: `buscar_post(id)`

**Requisição (`curl`):**
```bash
curl -X GET http://localhost:3000/api/posts/p1
```

**Resposta (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "id": "p1",
    "usuario_id": "u2",
    "texto": "Comparando REST e GraphQL na prática: enquanto o REST brilha na simplicidade e no cache HTTP por recurso, o GraphQL elimina o over-fetching ao montar o feed!",
    "criado_em": "2026-10-16T14:00:00.000Z",
    "autor": {
      "id": "u2",
      "nome": "Bruno Costa",
      "email": "bruno@rede.com",
      "criado_em": "2026-10-15T10:05:00.000Z",
      "perfil": {
        "id": "perf2",
        "usuario_id": "u2",
        "bio": "Desenvolvedor Backend | Node.js, REST & GraphQL",
        "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Bruno",
        "localizacao": "São Paulo, SP"
      },
      "estatisticas": {
        "total_posts": 1,
        "total_seguidores": 1,
        "total_seguindo": 1
      }
    },
    "total_comentarios": 2,
    "total_curtidas": 2,
    "comentarios": [
      {
        "id": "c1",
        "usuario_id": "u1",
        "post_id": "p1",
        "texto": "Excelente ponto, Bruno! No feed a diferença de payload fica muito clara.",
        "criado_em": "2026-10-16T14:15:00.000Z",
        "autor": {
          "id": "u1",
          "nome": "Ana Silva",
          "email": "ana@rede.com",
          "criado_em": "2026-10-15T10:00:00.000Z",
          "perfil": {
            "id": "perf1",
            "usuario_id": "u1",
            "bio": "Engenheira de Software e entusiasta de arquitetura de APIs",
            "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Ana",
            "localizacao": "Aracaju, SE"
          },
          "estatisticas": {
            "total_posts": 1,
            "total_seguidores": 2,
            "total_seguindo": 2
          }
        }
      },
      {
        "id": "c2",
        "usuario_id": "u3",
        "post_id": "p1",
        "texto": "Concordo! E a introspecção do schema GraphQL facilita muito explorar o grafo social.",
        "criado_em": "2026-10-16T14:30:00.000Z",
        "autor": {
          "id": "u3",
          "nome": "Carla Mendes",
          "email": "carla@rede.com",
          "criado_em": "2026-10-15T10:08:00.000Z",
          "perfil": {
            "id": "perf3",
            "usuario_id": "u3",
            "bio": "Pesquisadora em Sistemas Distribuídos e Protocolos de Rede",
            "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Carla",
            "localizacao": "Recife, PE"
          },
          "estatisticas": {
            "total_posts": 1,
            "total_seguidores": 1,
            "total_seguindo": 1
          }
        }
      }
    ],
    "curtidas": [
      {
        "usuario_id": "u1",
        "post_id": "p1",
        "criado_em": "2026-10-16T14:10:00.000Z",
        "usuario": {
          "id": "u1",
          "nome": "Ana Silva",
          "email": "ana@rede.com",
          "criado_em": "2026-10-15T10:00:00.000Z",
          "perfil": {
            "id": "perf1",
            "usuario_id": "u1",
            "bio": "Engenheira de Software e entusiasta de arquitetura de APIs",
            "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Ana",
            "localizacao": "Aracaju, SE"
          },
          "estatisticas": {
            "total_posts": 1,
            "total_seguidores": 2,
            "total_seguindo": 2
          }
        }
      },
      {
        "usuario_id": "u3",
        "post_id": "p1",
        "criado_em": "2026-10-16T14:25:00.000Z",
        "usuario": {
          "id": "u3",
          "nome": "Carla Mendes",
          "email": "carla@rede.com",
          "criado_em": "2026-10-15T10:08:00.000Z",
          "perfil": {
            "id": "perf3",
            "usuario_id": "u3",
            "bio": "Pesquisadora em Sistemas Distribuídos e Protocolos de Rede",
            "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Carla",
            "localizacao": "Recife, PE"
          },
          "estatisticas": {
            "total_posts": 1,
            "total_seguidores": 1,
            "total_seguindo": 1
          }
        }
      }
    ]
  }
}
```

---

### Consulta 4: `seguidores_de(id)` e `seguindo_de(id)`

**Requisição 4a — `seguidores_de(id)` (`curl`):**
```bash
curl -X GET http://localhost:3000/api/usuarios/u1/seguidores
```

**Resposta 4a (`200 OK`):**
```json
{
  "success": true,
  "data": [
    {
      "usuario_id": "u2",
      "alvo_id": "u1",
      "criado_em": "2026-10-15T10:20:00.000Z",
      "usuario": {
        "id": "u2",
        "nome": "Bruno Costa",
        "email": "bruno@rede.com",
        "criado_em": "2026-10-15T10:05:00.000Z",
        "perfil": {
          "id": "perf2",
          "usuario_id": "u2",
          "bio": "Desenvolvedor Backend | Node.js, REST & GraphQL",
          "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Bruno",
          "localizacao": "São Paulo, SP"
        },
        "estatisticas": {
          "total_posts": 1,
          "total_seguidores": 1,
          "total_seguindo": 1
        }
      }
    },
    {
      "usuario_id": "u3",
      "alvo_id": "u1",
      "criado_em": "2026-10-15T10:25:00.000Z",
      "usuario": {
        "id": "u3",
        "nome": "Carla Mendes",
        "email": "carla@rede.com",
        "criado_em": "2026-10-15T10:08:00.000Z",
        "perfil": {
          "id": "perf3",
          "usuario_id": "u3",
          "bio": "Pesquisadora em Sistemas Distribuídos e Protocolos de Rede",
          "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Carla",
          "localizacao": "Recife, PE"
        },
        "estatisticas": {
          "total_posts": 1,
          "total_seguidores": 1,
          "total_seguindo": 1
        }
      }
    }
  ]
}
```

**Requisição 4b — `seguindo_de(id)` (`curl`):**
```bash
curl -X GET http://localhost:3000/api/usuarios/u1/seguindo
```

**Resposta 4b (`200 OK`):**
```json
{
  "success": true,
  "data": [
    {
      "usuario_id": "u1",
      "alvo_id": "u2",
      "criado_em": "2026-10-15T10:10:00.000Z",
      "usuario": {
        "id": "u2",
        "nome": "Bruno Costa",
        "email": "bruno@rede.com",
        "criado_em": "2026-10-15T10:05:00.000Z",
        "perfil": {
          "id": "perf2",
          "usuario_id": "u2",
          "bio": "Desenvolvedor Backend | Node.js, REST & GraphQL",
          "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Bruno",
          "localizacao": "São Paulo, SP"
        },
        "estatisticas": {
          "total_posts": 1,
          "total_seguidores": 1,
          "total_seguindo": 1
        }
      }
    },
    {
      "usuario_id": "u1",
      "alvo_id": "u3",
      "criado_em": "2026-10-15T10:15:00.000Z",
      "usuario": {
        "id": "u3",
        "nome": "Carla Mendes",
        "email": "carla@rede.com",
        "criado_em": "2026-10-15T10:08:00.000Z",
        "perfil": {
          "id": "perf3",
          "usuario_id": "u3",
          "bio": "Pesquisadora em Sistemas Distribuídos e Protocolos de Rede",
          "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Carla",
          "localizacao": "Recife, PE"
        },
        "estatisticas": {
          "total_posts": 1,
          "total_seguidores": 1,
          "total_seguindo": 1
        }
      }
    }
  ]
}
```

---

### Consulta 5: `feed_do_usuario(usuario_id)`
Retorna os posts publicados pelos usuários que `usuario_id` segue, ordenados do mais recente para o mais antigo. Note como no REST o payload de cada post traz **todos** os campos fixos do recurso (evidenciando *over-fetching* caso a tela do feed só precisasse de `id`, `texto`, `autor.nome` e `total_curtidas`).

**Requisição (`curl`):**
```bash
curl -X GET http://localhost:3000/api/usuarios/u1/feed
```

**Resposta (`200 OK`):**
```json
{
  "success": true,
  "data": [
    {
      "id": "p2",
      "usuario_id": "u3",
      "texto": "Modelando uma rede social com Usuario, Perfil (1:1), Post (1:N), Comentario (N:M com atributo), Curtida (N:M puro) e Seguidor (N:M auto).",
      "criado_em": "2026-10-16T15:30:00.000Z",
      "autor": {
        "id": "u3",
        "nome": "Carla Mendes",
        "email": "carla@rede.com",
        "criado_em": "2026-10-15T10:08:00.000Z",
        "perfil": {
          "id": "perf3",
          "usuario_id": "u3",
          "bio": "Pesquisadora em Sistemas Distribuídos e Protocolos de Rede",
          "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Carla",
          "localizacao": "Recife, PE"
        },
        "estatisticas": {
          "total_posts": 1,
          "total_seguidores": 1,
          "total_seguindo": 1
        }
      },
      "total_comentarios": 0,
      "total_curtidas": 1,
      "comentarios": [],
      "curtidas": [
        {
          "usuario_id": "u1",
          "post_id": "p2",
          "criado_em": "2026-10-16T15:40:00.000Z",
          "usuario": {
            "id": "u1",
            "nome": "Ana Silva",
            "email": "ana@rede.com",
            "criado_em": "2026-10-15T10:00:00.000Z",
            "perfil": {
              "id": "perf1",
              "usuario_id": "u1",
              "bio": "Engenheira de Software e entusiasta de arquitetura de APIs",
              "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Ana",
              "localizacao": "Aracaju, SE"
            },
            "estatisticas": {
              "total_posts": 1,
              "total_seguidores": 2,
              "total_seguindo": 2
            }
          }
        }
      ]
    },
    {
      "id": "p1",
      "usuario_id": "u2",
      "texto": "Comparando REST e GraphQL na prática: enquanto o REST brilha na simplicidade e no cache HTTP por recurso, o GraphQL elimina o over-fetching ao montar o feed!",
      "criado_em": "2026-10-16T14:00:00.000Z",
      "autor": {
        "id": "u2",
        "nome": "Bruno Costa",
        "email": "bruno@rede.com",
        "criado_em": "2026-10-15T10:05:00.000Z",
        "perfil": {
          "id": "perf2",
          "usuario_id": "u2",
          "bio": "Desenvolvedor Backend | Node.js, REST & GraphQL",
          "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Bruno",
          "localizacao": "São Paulo, SP"
        },
        "estatisticas": {
          "total_posts": 1,
          "total_seguidores": 1,
          "total_seguindo": 1
        }
      },
      "total_comentarios": 2,
      "total_curtidas": 2,
      "comentarios": [
        {
          "id": "c1",
          "usuario_id": "u1",
          "post_id": "p1",
          "texto": "Excelente ponto, Bruno! No feed a diferença de payload fica muito clara.",
          "criado_em": "2026-10-16T14:15:00.000Z",
          "autor": {
            "id": "u1",
            "nome": "Ana Silva",
            "email": "ana@rede.com",
            "criado_em": "2026-10-15T10:00:00.000Z",
            "perfil": {
              "id": "perf1",
              "usuario_id": "u1",
              "bio": "Engenheira de Software e entusiasta de arquitetura de APIs",
              "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Ana",
              "localizacao": "Aracaju, SE"
            },
            "estatisticas": {
              "total_posts": 1,
              "total_seguidores": 2,
              "total_seguindo": 2
            }
          }
        },
        {
          "id": "c2",
          "usuario_id": "u3",
          "post_id": "p1",
          "texto": "Concordo! E a introspecção do schema GraphQL facilita muito explorar o grafo social.",
          "criado_em": "2026-10-16T14:30:00.000Z",
          "autor": {
            "id": "u3",
            "nome": "Carla Mendes",
            "email": "carla@rede.com",
            "criado_em": "2026-10-15T10:08:00.000Z",
            "perfil": {
              "id": "perf3",
              "usuario_id": "u3",
              "bio": "Pesquisadora em Sistemas Distribuídos e Protocolos de Rede",
              "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Carla",
              "localizacao": "Recife, PE"
            },
            "estatisticas": {
              "total_posts": 1,
              "total_seguidores": 1,
              "total_seguindo": 1
            }
          }
        }
      ],
      "curtidas": [
        {
          "usuario_id": "u1",
          "post_id": "p1",
          "criado_em": "2026-10-16T14:10:00.000Z",
          "usuario": {
            "id": "u1",
            "nome": "Ana Silva",
            "email": "ana@rede.com",
            "criado_em": "2026-10-15T10:00:00.000Z",
            "perfil": {
              "id": "perf1",
              "usuario_id": "u1",
              "bio": "Engenheira de Software e entusiasta de arquitetura de APIs",
              "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Ana",
              "localizacao": "Aracaju, SE"
            },
            "estatisticas": {
              "total_posts": 1,
              "total_seguidores": 2,
              "total_seguindo": 2
            }
          }
        },
        {
          "usuario_id": "u3",
          "post_id": "p1",
          "criado_em": "2026-10-16T14:25:00.000Z",
          "usuario": {
            "id": "u3",
            "nome": "Carla Mendes",
            "email": "carla@rede.com",
            "criado_em": "2026-10-15T10:08:00.000Z",
            "perfil": {
              "id": "perf3",
              "usuario_id": "u3",
              "bio": "Pesquisadora em Sistemas Distribuídos e Protocolos de Rede",
              "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=Carla",
              "localizacao": "Recife, PE"
            },
            "estatisticas": {
              "total_posts": 1,
              "total_seguidores": 1,
              "total_seguindo": 1
            }
          }
        }
      ]
    }
  ]
}
```
