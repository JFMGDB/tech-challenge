# 🔧 Soluções Implementadas - [José Felipe]

“Commit 1 (fix-backend: corrigir assertions quebradas em auth.test.ts)”
  - “Antes”: `expect(user.username).toBe('wrongusername');` e `expect(token).toBeUndefined();`
  - “Depois”: `expect(user.username).toBe(userData.username);`, `expect(token).toBeDefined();` e `expect(typeof token).toBe('string');`
  - “Impacto”: Testes alinhados ao comportamento real do modelo e prevenção de falsos negativos na suíte de autenticação.
  - “Como testar”: `cd backend && npm test`

“Commit 2 (fix-frontend: alinhar testes do App às rotas reais)”
  - “Antes”: `screen.getByText(/learn react/i);` e `screen.getByText(/this text does not exist/i);`
  - “Depois”: `screen.getByRole('heading', { name: /welcome back/i });`
  - “Impacto”: Teste reflete a rota `/login`, cobrindo fluxo de autenticação sem falsos positivos.
  - “Como testar”: `cd frontend && npm test`

“Commit 3 (perf: remover N+1 em getPosts com eager loading)”
  - “Antes”: `const commentCount = await Comment.count({ where: { postId: post.id } }); const likeCount = await Like.count({ where: { postId: post.id } }); const isLiked = req.user ? await Like.findOne({ where: { postId: post.id, userId: req.user.id } }) !== null : false;`
  - “Depois”: `include: [{ model: Comment, as: 'comments', attributes: ['id'] }, { model: Like, as: 'likes', attributes: ['id', 'userId'] }], ... const enrichedPost = { ...jsonPost, commentCount: jsonPost.comments.length, likeCount: jsonPost.likes.length, isLiked: req.user ? jsonPost.likes.some((like: { userId: number }) => like.userId === req.user?.id) : false }; delete enrichedPost.comments; delete enrichedPost.likes;`
  - “Impacto”: Redução de queries de 1 + 3N para 1 por requisição, melhorando performance e escalabilidade.
  - “Como testar”: `GET /api/posts?limit=50` 

“Commit 4 (refactor: remover método N+1 de Post)”
  - “Antes”:
    ```ts
    // Intentionally inefficient method that will cause N+1 queries
    public async getCommentsWithAuthors(): Promise<any[]> {
      const comments = await this.getComments();
      for (const comment of comments) {
        const author = await comment.getAuthor();
        // ... monta objeto com author
      }
    }
    ```
  - “Depois”:
    ```ts
    // Controllers usam eager loading com include (exemplos)
    // getPosts: inclui author/comments/likes com atributos enxutos
    include: [
      { model: User, as: 'author', attributes: ['id','username','avatar'] },
      { model: Comment, as: 'comments', attributes: ['id'] },
      { model: Like, as: 'likes', attributes: ['id','userId'] },
    ]

    // getPostById: inclui comments.author e replies.author em um único SELECT
    include: [
      { model: User, as: 'author', attributes: ['id','username','firstName','lastName','avatar'] },
      { model: Comment, as: 'comments', include: [
          { model: User, as: 'author', attributes: ['id','username','avatar'] },
          { model: Comment, as: 'replies', include: [
              { model: User, as: 'author', attributes: ['id','username','avatar'] },
          ]}
      ]},
      { model: Like, as: 'likes', attributes: ['id','userId'] },
    ]
    ```
  - “Impacto”: Redução de N+1 (1 + N) para 1 consulta por endpoint; menos round-trips ao banco; padrão seguro reforçado (remoção de helper que induzia lazy getters em loop); zero breaking changes; build/lint ok.
  - “Como testar”:
    - Habilite logs (já ativo quando `NODE_ENV=development`).
    - Rode a API: `cd backend && npm run dev`
    - Exercite rotas:
      - `GET /api/posts?limit=50` → deve emitir 1 SELECT com JOINs (sem N consultas por comentário).
      - `GET /api/posts/:id` → deve emitir 1 SELECT com includes aninhados (author, comments.author, replies.author).
    - Opcional: compare tempo/respostas antes/depois; verificar ausência do método no modelo `Post`.

“Commit 5 (perf: ajustar pool e logging no Sequelize)”
  - “Antes”:
    ```ts
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
    // Intentional performance issue: missing connection pool optimization
    dialectOptions: {
      // Missing SSL configuration for production
      ...(process.env.NODE_ENV === 'production' && {
        ssl: { require: true, rejectUnauthorized: false }
      })
    }
    ```
  - “Depois”:
    ```ts
    // Log SQL only em desenvolvimento; silencioso em teste/prod
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: { max: 20, min: 5, acquire: 30000, idle: 10000 },
    // SSL apenas em produção (p.ex. RDS/Cloud SQL com SSL obrigatório)
    dialectOptions: {
      ...(process.env.NODE_ENV === 'production' && {
        ssl: { require: true, rejectUnauthorized: false }
      })
    }
    ```
  - “Impacto”: Pool otimizado (menos latência e churn de conexões sob carga), redução de ruído de logs fora de dev, guard de SSL explícito para produção (recomendado futuramente usar CA e `rejectUnauthorized: true`).
  - “Como testar”:
    - Dev: `cd backend && npm run dev` → ver SQL no console; `GET /health`.
    

“Commit 6 (security: exigir JWT_SECRET e padronizar expiração)”
  - “Antes”:
    ```ts
    // utils/jwt.ts
    const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key';
    const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
    // middleware/auth.ts
    jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret')
    ```
  - “Depois”:
    ```ts
    // utils/jwt.ts
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) throw new Error('JWT_SECRET is not set...');
    const ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
    const REFRESH_TOKEN_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';
    export const verifyToken = (t: string) => jwt.verify(t, JWT_SECRET as any) as JWTPayload;
    // middleware/auth.ts
    const decoded = verifyToken(token);
    ```
  - “Impacto”: Segurança reforçada (sem segredos default), validade consistente (15m/30d) alinhada a boas práticas, ponto único de verificação de token (DRY), redução de risco de tokens válidos com segredos fracos/ausentes.
  - “Como testar”:
    - Defina `JWT_SECRET` e suba o backend: `cd backend && npm run dev`.
    - `POST /api/auth/login` com credenciais válidas → receba o access token.
    - `GET /api/auth/profile` com `Authorization: Bearer <token>` → 200 com perfil.
    - Remova/altere `JWT_SECRET` e reinicie → app deve falhar ao iniciar ou tokens devem ser rejeitados (401/403).

