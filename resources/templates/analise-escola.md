# Análise de Redes Sociais — {{NOME_ESCOLA}}

> Template de análise de eficiência do Instagram escolar para maestro4edu.
> Substitua os placeholders antes de usar:
> - `{{NOME_ESCOLA}}`: nome da escola (ex: Escola Municipal João Paulo II)
> - `{{CONTA}}`: @ da conta no Instagram, sem o @ (ex: emjoaopaulo2)
> - `{{SLUG}}`: identificador curto usado em pastas e arquivos (ex: emjoaopaulo2)
> - `{{SCHOOL_ID}}`: ID da escola no maestro4edu

## Informações

- **Escola:** {{NOME_ESCOLA}}
- **Instagram:** @{{CONTA}}
- **School ID:** {{SCHOOL_ID}}
- **Pasta de dados:** `resources/posts/{{SLUG}}/`

---

## Tarefas

### Fase 1: coleta de dados

- [ ] Coletar todos os posts dos últimos 30 dias usando o MCP `resources/mcps/instagram-posts`
  - Conta: `{{CONTA}}`
  - O MCP salva automaticamente `resources/posts/{{SLUG}}/lista.csv` e `perfil.json`
  - Verificar: número de posts coletados, seguidores registrados no `perfil.json`

- [ ] Para os posts do tipo `video`, baixar os arquivos usando o MCP `resources/mcps/instagram-top-videos-download`
  - CSV de entrada: `resources/posts/{{SLUG}}/lista.csv`
  - Baixar apenas os posts com `type=video` (filtrar antes de passar para o MCP)
  - Saída: arquivos `.mp4` em `resources/posts/{{SLUG}}/videos/`

- [ ] Transcrever os vídeos usando o MCP `resources/mcps/video-transcricao`
  - Pasta: `resources/posts/{{SLUG}}/videos/`
  - Saída: arquivos `.txt` ao lado de cada `.mp4`

### Fase 2: análise de engajamento

- [ ] Executar a skill `.claude/skills/ig-analise-engajamento` com a pasta `resources/posts/{{SLUG}}/`
  - Lê `lista.csv` + `perfil.json`
  - Salvar resultado em `resources/posts/{{SLUG}}/ig-analise-engajamento.md`

### Fase 3: análise qualitativa dos textos e transcrições

> Para esta fase, o "conteúdo" de cada post é:
> - Posts de imagem/carrossel: legenda do post (coluna `caption` do CSV)
> - Posts de vídeo: transcrição do arquivo `.txt` (quando disponível); se não houver, use a legenda

- [ ] Executar a skill `.claude/skills/ig-analise-ganchos` com os conteúdos dos posts
  - Salvar em `resources/posts/{{SLUG}}/ig-analise-ganchos.md`

- [ ] Executar a skill `.claude/skills/ig-analise-retencao` com os conteúdos dos posts
  - Salvar em `resources/posts/{{SLUG}}/ig-analise-retencao.md`

- [ ] Executar a skill `.claude/skills/ig-analise-storytelling` com os conteúdos dos posts
  - Salvar em `resources/posts/{{SLUG}}/ig-analise-storytelling.md`

- [ ] Executar a skill `.claude/skills/ig-analise-vocabulario` com os conteúdos dos posts
  - Salvar em `resources/posts/{{SLUG}}/ig-analise-vocabulario.md`

### Fase 4: perfil consolidado

- [ ] Gerar o perfil de eficiência usando a skill `.claude/skills/ig-perfil-escola`
  - Pasta de entrada: `resources/posts/{{SLUG}}/`
  - Salvar em `resources/posts/{{SLUG}}/perfil-escola-{{SLUG}}.md`

### Fase 5: exportação para o Firestore

- [ ] Exportar toda a análise para o Firestore usando o MCP `resources/mcps/firestore-export`
  - `schoolId`: `{{SCHOOL_ID}}`
  - `accountName`: `{{CONTA}}`
  - `pastaAnalise`: caminho absoluto de `resources/posts/{{SLUG}}/`
  - Confirmar: documento criado em `socialMediaAnalyses/{docId}`
