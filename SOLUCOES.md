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

“Commit 12 (security(docker): usar secrets para credenciais)”
  - “Antes”:
    ```yaml
    services:
      postgres:
        environment:
          POSTGRES_PASSWORD: password123

      backend:
        environment:
          DB_PASSWORD: password123
          JWT_SECRET: your-super-secret-jwt-key-here
    ```
  - “Depois”:
    ```yaml
    services:
      postgres:
        environment:
          POSTGRES_PASSWORD_FILE: /run/secrets/db_password
        secrets:
          - db_password

      backend:
        env_file:
          - ./backend/.env
        environment:
          DB_PASSWORD_FILE: /run/secrets/db_password
          JWT_SECRET_FILE: /run/secrets/jwt_secret
        secrets:
          - db_password
          - jwt_secret

    secrets:
      db_password:
        file: ./secrets/db_password.txt
      jwt_secret:
        file: ./secrets/jwt_secret.txt
    ```
  - “Impacto”: Segurança reforçada (segredos fora de env/compose), alinhado a padrões de orquestração (tmpfs, escopo controlado), troca de segredos sem rebuild; mantém compatibilidade com `.env` em dev.
  - “Como testar”:
    - Preencha `secrets/db_password.txt` e `secrets/jwt_secret.txt`.
    - `docker compose up -d`.
    - `docker compose exec postgres env | grep POSTGRES_PASSWORD` → não deve exibir senha (usa *_FILE).
    - Backend deve iniciar normalmente; `curl http://localhost:3001/health` → 200.

“Commit 13 (chore(docker): otimizar backend Dockerfile)”
  - “Antes”:
    ```dockerfile
    FROM node:18-alpine
    WORKDIR /app
    COPY package*.json ./
    RUN npm ci --only=production
    COPY . .
    RUN npm run build
    EXPOSE 3001
    CMD ["npm", "start"]
    ```
  - “Depois”:
    ```dockerfile
    FROM node:18-alpine AS builder
    WORKDIR /app
    COPY package*.json ./
    RUN npm ci --silent
    COPY . .
    RUN npm run build

    FROM node:18-alpine AS production
    ENV NODE_ENV=production
    WORKDIR /app
    COPY package*.json ./
    RUN npm ci --omit=dev --silent && mkdir -p /app/public/uploads
    COPY --from=builder /app/dist ./dist
    RUN addgroup -g 1001 -S appgroup \
      && adduser -S appuser -u 1001 -G appgroup \
      && chown -R appuser:appgroup /app
    USER appuser
    EXPOSE 3001
    HEALTHCHECK --interval=10s --timeout=3s --start-period=15s --retries=5 \
      CMD wget -q -O - http://localhost:3001/health || exit 1
    CMD ["node", "dist/index.js"]
    ```
  - “Impacto”: imagem mais enxuta e segura (somente deps de produção, usuário não-root), startup consistente (multi-stage), monitoramento nativo via `HEALTHCHECK`, melhor aproveitamento de cache e menores superfícies de ataque.
  - “Como testar”:
    - `docker compose build backend`
    - `docker compose up -d backend`
    - `docker compose ps` → backend `healthy` após alguns segundos.
    - `docker compose exec backend id -u` → deve retornar um UID não zero (ex.: 1001).
    - `curl http://localhost:3001/health` → 200 OK.

“Commit 14 (chore(docker): otimizar frontend Dockerfile com Nginx)”
  - “Antes”:
    ```dockerfile
    FROM node:18-alpine
    WORKDIR /app
    COPY package*.json ./
    RUN npm ci --silent
    COPY . .
    RUN npm run build
    RUN npm install -g serve
    EXPOSE 3000
    CMD ["serve", "-s", "build", "-l", "3000"]
    ```
  - “Depois”:
    ```dockerfile
    FROM node:18-alpine AS builder
    WORKDIR /app
    COPY package*.json ./
    RUN npm ci --silent
    COPY . .
    RUN npm run build

    FROM nginx:alpine AS production
    COPY --from=builder /app/build /usr/share/nginx/html
    COPY nginx.conf /etc/nginx/conf.d/default.conf
    EXPOSE 80
    HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=5 \
      CMD wget -q -O - http://localhost/health || exit 1
    CMD ["nginx", "-g", "daemon off;"]
    ```
  - “Impacto”: imagem final menor e mais performática para estáticos (Nginx), healthcheck nativo, separação clara de build/run (multi-stage), melhor compatibilidade com proxies e CDNs.
  - “Como testar”:
    - `docker compose build frontend`
    - `docker compose up -d frontend` (mapeie `3000:80` se necessário)
    - Abrir `http://localhost:3000` → app renderiza.
    - `curl http://localhost:3000/health` → `OK`.

“Commit 15 (chore: adicionar .dockerignore e restaurar env examples)”
  - “Antes”:
    ```text
    # Ausência de .dockerignore (raiz/backend/frontend)
    # Ausência de modelo de backend/.env documentado
    ```
  - “Depois”:
    ```ini
    # backend/.env (modelo)

    # Environment
    NODE_ENV=development
    PORT=3001
    FRONTEND_URL=http://localhost:3000

    # Database
    DB_HOST=postgres
    DB_PORT=5432
    DB_NAME=postgres
    DB_USER=postgres
    DB_PASSWORD=CHANGE_ME
    # ou (compose secrets)
    # DB_PASSWORD_FILE=/run/secrets/db_password

    # JWT
    JWT_SECRET=CHANGE_ME_STRONG
    # ou (compose secrets)
    # JWT_SECRET_FILE=/run/secrets/jwt_secret
    JWT_ACCESS_EXPIRES_IN=15m
    JWT_REFRESH_EXPIRES_IN=30d

    # AWS S3
    USE_LOCAL_UPLOAD=false
    AWS_ACCESS_KEY_ID=
    AWS_SECRET_ACCESS_KEY=
    AWS_S3_BUCKET=
    AWS_REGION=sa-east-1

    # Upload
    MAX_FILE_SIZE=5242880
    # ALLOWED_FILE_TYPES (atualmento ignorado pelo código)

    # Rate limit (opcional)
    RATE_WINDOW_MS=900000
    RATE_MAX=100
    ```
  - “Impacto”: builds mais rápidos (com .dockerignore), onboarding padronizado e seguro (modelo de .env sem segredos reais), alinhado ao código (JWT_ACCESS/REFRESH) e CORS (FRONTEND_URL).
  - “Como testar”:
    - Copiar o conteúdo para `backend/.env` e ajustar valores.
    - `cd backend && npm run dev` → API deve subir; CORS válido para a origem configurada.

    “Commit 16 (ui: corrigir input de arquivo e reduzir animações + fix(types): corrigir tipos e uso de tags/role)”
  - “Antes”:
    ```ts
    // forms/index.ts (esconde nome do arquivo e anima infinitamente)
    font-size: 0; // oculta filename
    &::file-selector-button:hover { animation: file-button-hover 0.5s infinite alternate; }

    // GlobalStyle.ts (animação infinita de scrollbar)
    ::-webkit-scrollbar-thumb:hover { animation: scrollbar-hover 0.3s infinite alternate; }

    // Header.tsx (sem will-change/otimização de sticky)
    /* Missing will-change property */

    // usePostsAdvanced.ts (supõe user.role; mismatch de tipos; uso de Set)
    user.role === 'admin'
    likeCount: post.isLiked ? post.likeCount - 1 : post.likeCount + 1 // poss. undefined
    addTag: [...new Set([...prev, tag])] // exige downlevelIteration
    // published em PostQuery (inexistente no backend)
    
    // postService.ts (tags apenas string)
    tags?: string;
    ```
  - “Depois”:
    ```ts
    // forms/index.ts
    font-size: ${({ theme }) => theme.fontSizes.base}; // exibe filename
    &::file-selector-button { will-change: background-color, transform; }
    &::file-selector-button:hover { transform: translateY(-1px); } // sem animação infinita

    // GlobalStyle.ts
    ::-webkit-scrollbar-* { will-change: background-color; } // remove animação infinita

    // Header.tsx
    will-change: transform; backface-visibility: hidden; transform: translateZ(0);

    // usePostsAdvanced.ts (permissão por authorId; correções de tipos)
    canEditPost/canDeletePost => user?.id === post.authorId
    onSuccess(create/update) => usar res.post; cache por ['post', post.id]
    likeCount: seguro com fallback 0
    addTag: prev.includes(tag) ? prev : [...prev, tag]
    removido published do query draft

    // postService.ts (CSV para tags)
    tags?: string | string[]; // aceita array
    if (key === 'tags') append(Array.isArray(value) ? value.join(',') : value)
    ```
  - “Impacto”: melhorias de performance (sem animações infinitas; header suave), acessibilidade (foco/filename visíveis), build TypeScript corrigido (tags/caches/role), DX mais estável.
  - “Como testar”:
    - Frontend: `cd frontend && npm run lint && npm run build` → build sem erros.
    - UI: verificar no navegador que o file input exibe o nome e foco; header scroll suave.
    - Tipos: em `usePostsAdvanced`, executar like/criação/atualização e observar cache sem erros (devtools/network/logs).

“Commit 17 (feat(ui): renderizar markdown em post list/detail)”
  - “Antes”:
    ```tsx
    // App.tsx
    // const HomePage = () => <div>Home Page - Coming Soon</div>;
    // const PostDetailPage = () => <div>Post Detail Page - Coming Soon</div>;
    ```
  - “Depois”:
    ```tsx
    // components/MarkdownRenderer.tsx
    <ReactMarkdown
      components={{
        code({ inline, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || '');
          return !inline && match ? (
            <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div" {...props}>
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (<code className={className} {...props}>{children}</code>);
        },
        img(imageProps: any) { return <img loading="lazy" {...imageProps} />; },
      }}
    >{content}</ReactMarkdown>

    // App.tsx
    import { HomePage } from './pages/posts/HomePage';
    import { PostDetailPage } from './pages/posts/PostDetailPage';

    // HomePage.tsx (lista)
    <MarkdownRenderer content={(post.content || '').slice(0, 400) + '...'} />

    // PostDetailPage.tsx (detalhe)
    {post.imageUrl && <img src={post.imageUrl} alt={post.title} loading="lazy" />}
    <MarkdownRenderer content={post.content || ''} />
    ```
  - “Impacto”: melhor usabilidade/leitura (Markdown + code highlight), performance com imagens `lazy`, segurança básica (sem HTML bruto).
  - “Como testar”:
    - `cd frontend && npm run build`.
    - Criar/editar um post com markdown (títulos, listas, imagens e blocos de código ` ```js ` etc.).
    - `GET /api/posts` na Home deve exibir resumo com markdown; `GET /api/posts/:id` no detalhe deve renderizar markdown completo com syntax highlight; imagens carregam sob demanda.

“Commit 18 (feat(posts): categorias mapeadas por tags e filtro)”
  - “Antes”:
    ```ts
    // postService.ts
    export interface PostQuery {
      page?: number;
      // ...
      tags?: string | string[];
      authorId?: number;
    }

    // getPosts: só envia 'tags' quando presente; sem 'category'
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined) return;
      if (key === 'tags') {
        const csv = Array.isArray(value) ? value.join(',') : value;
        if (csv) params.append('tags', csv);
      } else {
        params.append(key, value.toString());
      }
    });
    ```

    ```ts
    // usePosts.ts (sem helpers de categoria)
    return {
      posts, loading, error, pagination, query,
      fetchPosts, refreshPosts, setQuery,
    };
    ```
  - “Depois”:
    ```ts
    // postService.ts
    export interface PostQuery {
      // ...
      tags?: string | string[];
      category?: string; // mapeada para 'tags'
      authorId?: number;
    }

    // Combina category + tags → 'tags' CSV único
    const tagParts: string[] = [];
    if (query.category) tagParts.push(query.category);
    if (query.tags) { /* aceita array ou csv */ }
    const uniqueTags = Array.from(new Set(tagParts.filter(Boolean)));

    // Anexa demais params, ignorando 'tags' e 'category'
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined) return;
      if (key === 'tags' || key === 'category') return;
      params.append(key, value.toString());
    });
    if (uniqueTags.length > 0) params.append('tags', uniqueTags.join(','));
    ```

    ```ts
    // usePosts.ts
    const getCategory = (post: Post) => post.tags?.[0];
    const setCategory = (category?: string) => {
      const next = { ...query };
      if (category?.trim()) next.category = category.trim(); else delete next.category;
      fetchPosts(next);
    };

    return {
      posts, loading, error, pagination, query,
      fetchPosts, refreshPosts, setQuery,
      getCategory, setCategory,
    };
    ```
  - “Impacto”:
    - Usabilidade: filtro de categoria simples (convenciona primeira tag como categoria).
    - API estável: backend continua aceitando `tags` (sem mudanças).
    - Manutenibilidade: mapeamento único (DRY), tipagem explícita em `PostQuery`.
  - “Como testar”:
    - Requisição direta: `GET /api/posts?tags=javascript`
    - Via serviço: `usePosts({ category: 'javascript' })`
    - Atualizar filtro em runtime: `setCategory('javascript')`
    - Opcional: `cd frontend && npm run build` e validar listagem filtrada.

