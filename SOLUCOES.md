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

