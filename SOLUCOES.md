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

“Commit 7 (security: restringir CORS e revisar rate limit)”
  - “Antes”:
    ```ts
    // CORS (permissivo com fallback sempre ativo)
    app.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true
    }));

    // Rate limit (mensagem genérica, sem headers padrão)
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: 'Too many requests from this IP, please try again later.'
    });
    ```
  - “Depois”:
    ```ts
    // Rate limit (configurável por env e com headers padrão)
    const limiter = rateLimit({
      windowMs: parseInt(process.env.RATE_WINDOW_MS || String(15 * 60 * 1000)),
      max: parseInt(process.env.RATE_MAX || '100'),
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'Too many requests', detail: 'Rate limit exceeded. Please try again later.' }
    });

    // CORS: restringe a FRONTEND_URL; fallback só em dev
    const allowedOrigin = process.env.FRONTEND_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : undefined);
    app.use(cors({
      origin: (origin, callback) => {
        if (!allowedOrigin) return callback(new Error('CORS not configured: FRONTEND_URL is required in non-dev environments'));
        if (!origin || origin === allowedOrigin) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
      },
      credentials: true
    }));
    ```
  - “Impacto”: Segurança reforçada (bloqueio de origens não autorizadas em produção), melhor observabilidade (headers de rate limit), limites ajustáveis via env, mensagens de erro padronizadas; reduz superfície para abuso/brute-force.
  - “Como testar”:
    - Defina `FRONTEND_URL` para a origem do frontend (ex.: `http://localhost:3000`).
    - Suba o backend: `cd backend && npm run dev`.
    - Do frontend correto, chame qualquer rota (`GET /health`, `GET /api/posts`). Deve funcionar.
    - De outra origem (ou Postman com `Origin` diferente), requisições devem falhar por CORS.
    - Opcional: defina `RATE_MAX=5` e faça 6+ requisições rápidas a `GET /health` → espere `429` com headers `RateLimit-*`/`X-RateLimit-*` e corpo com `{ error, detail }`.

“Commit 8 (fix: unificar bucket e erros de S3)”
  - “Antes”:
    ```ts
    // utils/s3.ts (buckets divergentes e fallback hardcoded)
    Bucket: process.env.AWS_S3_BUCKET || 'challenge-blog-uploads'
    // ...
    Bucket: process.env.AWS_S3_BUCKET || 'tech-challenge-blog-uploads'

    // uploadController.ts (vazava mensagens detalhadas)
    res.status(500).json({ error: 'Upload failed', message: error instanceof Error ? error.message : 'Unknown error' })
    ```
  - “Depois”:
    ```ts
    // utils/s3.ts (bucket unificado + obrigatório)
    const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET;
    if (!AWS_S3_BUCKET) throw new Error('AWS_S3_BUCKET is not set...');
    Bucket: AWS_S3_BUCKET

    // uploadController.ts (erros genéricos, sem vazar detalhes)
    res.status(500).json({ error: 'Upload failed', detail: 'An error occurred while uploading the file. Please try again later.' })
    ```
  - “Impacto”: DRY e previsibilidade na infra (um único bucket por ambiente), menos risco de má configuração; respostas de erro mais seguras (sem expor detalhes internos), mantendo logs do lado do servidor.
  - “Como testar”:
    - Defina `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET`.
    - `cd backend && npm run dev`.
    - Upload feliz: `POST /api/upload/image` (multipart `image`) com Bearer → 200 com `{ url, key, bucket, etag }`.
    - Forçar erro (bucket inválido ou credenciais) → 500 com `{ error, detail }` genérico; conferir logs do servidor para detalhes.

“Commit 9 (feat: fallback de upload local em dev)”
  - “Antes”:
    ```ts
    // uploadController.ts (sem fallback local)
    // Upload to S3
    const result = await uploadToS3(req.file, 'post-images');

    // index.ts (sem servir /uploads)
    // app.use('/uploads', express.static(...)) // inexistente
    ```
  - “Depois”:
    ```ts
    // uploadController.ts (fallback local quando USE_LOCAL_UPLOAD=true)
    const useLocal = process.env.USE_LOCAL_UPLOAD === 'true';
    if (useLocal) {
      const uploadsRoot = path.resolve(__dirname, '..', '..', 'public', 'uploads');
      const folder = 'post-images';
      const outDir = path.join(uploadsRoot, folder);
      await fs.promises.mkdir(outDir, { recursive: true });
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${req.file.originalname}`;
      const key = `${folder}/${fileName}`;
      await fs.promises.writeFile(path.join(outDir, fileName), req.file.buffer);
      return res.status(200).json({ file: { url: `/uploads/${key}`, key, bucket: 'local' } });
    }

    // index.ts (servir estático /uploads)
    if (process.env.USE_LOCAL_UPLOAD === 'true') {
      const uploadsDir = path.resolve(__dirname, '..', 'public', 'uploads');
      app.use('/uploads', express.static(uploadsDir));
    }
    ```
  - “Impacto”: Melhor DX em desenvolvimento (upload sem AWS, offline-friendly), configurações claras por ambiente, mantém segurança (rotas autenticadas) e não exige `AWS_S3_BUCKET` quando em modo local.
  - “Como testar”:
    - Setar `USE_LOCAL_UPLOAD=true` e iniciar: `cd backend && npm run dev`.
    - Fazer upload: `POST /api/upload/image` (multipart `image` com Bearer) → resposta com `url` iniciando por `/uploads/post-images/`.
    - Abrir a URL retornada no navegador (ex.: `http://localhost:3001/uploads/post-images/...`).
    - Remover arquivo: `DELETE /api/upload/image/:key`.
    - Alternar para S3 removendo `USE_LOCAL_UPLOAD` (ou `false`) e definindo variáveis da AWS; repetir o fluxo.

“Commit 10 (feat: validações adicionais com Joi)”
  - “Antes”:
    ```ts
    // comments.ts (sem validação de params/body em update/delete)
    router.put('/:id', authenticateToken, updateComment);
    router.delete('/:id', authenticateToken, deleteComment);

    // posts.ts (sem validação de params em get/delete)
    router.get('/:id', optionalAuth, getPostById);
    router.put('/:id', authenticateToken, validateRequest(updatePostSchema), updatePost);
    router.delete('/:id', authenticateToken, deletePost);

    // validation.ts (sem validateParams/updateCommentSchema)
    ```
  - “Depois”:
    ```ts
    // validation.ts
    export const validateParams = (schema: Joi.ObjectSchema) => (req, res, next) => { /* ... */ };
    export const updateCommentSchema = Joi.object({ content: Joi.string().min(1).max(5000).required() });
    export const idParamSchema = Joi.object({ id: Joi.number().integer().positive().required() });
    export const postIdParamSchema = Joi.object({ postId: Joi.number().integer().positive().required() });

    // comments.ts
    router.get('/post/:postId', optionalAuth, validateParams(postIdParamSchema), getComments);
    router.put('/:id', authenticateToken, validateParams(idParamSchema), validateRequest(updateCommentSchema), updateComment);
    router.delete('/:id', authenticateToken, validateParams(idParamSchema), deleteComment);

    // posts.ts
    router.get('/:id', optionalAuth, validateParams(idParamSchema), getPostById);
    router.put('/:id', authenticateToken, validateParams(idParamSchema), validateRequest(updatePostSchema), updatePost);
    router.delete('/:id', authenticateToken, validateParams(idParamSchema), deletePost);
    ```
  - “Impacto”: Segurança e robustez reforçadas (early return 400 para params/payload inválidos), respostas consistentes de validação, prevenção de acessos/updates com identificadores inválidos; melhora DX com mensagens claras.
  - “Como testar”:
    - `GET /api/posts/abc` → 400 (param inválido).
    - `PUT /api/posts/1` com `tags: "not-array"` → 400.
    - `GET /api/comments/post/notnumber` → 400.
    - `PUT /api/comments/1` com `{ content: '' }` → 400.
    - `DELETE /api/comments/NaN` → 400.
    - Casos válidos continuam 2xx.

“Commit 11 (chore(docker): healthchecks e restart; ajustar API URL)”
  - “Antes”:
    ```yaml
    # docker-compose.yml (sem restart/healthchecks)
    services:
      backend:
        # ...
        depends_on:
          - postgres
      frontend:
        environment:
          REACT_APP_API_URL: http://localhost:3001
        depends_on:
          - backend
    ```
  - “Depois”:
    ```yaml
    services:
      postgres:
        restart: unless-stopped
        healthcheck:
          test: ["CMD-SHELL", "pg_isready -U admin -d tech_challenge_blog -h localhost"]
          interval: 10s
          timeout: 5s
          retries: 5
          start_period: 10s

      backend:
        restart: unless-stopped
        env_file:
          - ./backend/.env
        depends_on:
          postgres:
            condition: service_healthy
        healthcheck:
          test: ["CMD-SHELL", "wget -q -O - http://localhost:3001/health || exit 1"]
          interval: 10s
          timeout: 3s
          retries: 5
          start_period: 15s

      frontend:
        restart: unless-stopped
        environment:
          REACT_APP_API_URL: http://backend:3001/api
        depends_on:
          backend:
            condition: service_healthy
        healthcheck:
          test: ["CMD-SHELL", "wget -q -O - http://localhost:3000/ || exit 1"]
          interval: 10s
          timeout: 3s
          retries: 5
          start_period: 15s
    ```
  - “Impacto”: Inicialização ordenada e resiliente (menos condições de corrida), auto-recuperação com restart, frontend aponta para o backend na rede do Docker (evita CORS/host errado), DX/operabilidade melhores.
  - “Como testar”:
    - `docker compose up -d`
    - `docker compose ps` → aguardar `healthy` em postgres/backend/frontend.
    - `curl http://localhost:3001/health` → 200 OK.
    - Abrir `http://localhost:3000` e verificar chamadas à API usando `http://backend:3001/api` (Network do navegador).

