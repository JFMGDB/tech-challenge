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

