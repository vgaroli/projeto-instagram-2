# Skill: ig-perfil-escola

Consolida as análises de Instagram de uma escola (engajamento, ganchos, retenção, storytelling, vocabulário) em um único **Perfil de Eficiência de Comunicação Escolar** — um relatório prescritivo que diagnostica a presença digital atual e entrega um plano de ação claro para melhorar o engajamento.

---

## Quando usar

Use quando o usuário pedir para "gerar o perfil da escola", "consolidar as análises", "criar o relatório final" ou "o que a escola deve fazer no Instagram".

---

## Inputs aceitos

**Preferido — pasta com análises prontas:**
Caminho para a pasta contendo:
- `ig-analise-engajamento.md` (obrigatório)
- `ig-analise-ganchos.md` (opcional)
- `ig-analise-retencao.md` (opcional)
- `ig-analise-storytelling.md` (opcional)
- `ig-analise-vocabulario.md` (opcional)
- `perfil.json` (opcional — para contexto do perfil)

**Alternativa — transcrições + CSV brutos:**
Se as análises ainda não existirem, gere-as primeiro (leia os arquivos correspondentes da pasta) e depois sintetize.

---

## Estrutura do perfil a gerar

### Seção 1: Diagnóstico atual

Com base na análise de engajamento:
- KPIs do período: total de posts, engajamento médio, alcance estimado por tipo
- Tabela de performance por tipo de conteúdo (image/video/carousel)
- Semáforo editorial: o que está **funcionando** (verde), **neutro** (amarelo), **não funcionando** (vermelho)
- Crescimento de seguidores no período (com base no `historico-seguidores.csv`, se disponível) — ou nota de que o histórico ainda está sendo construído

### Seção 1.1: Atração vs. retenção

A pergunta central deste relatório é: **as postagens ajudam a "vender" a escola?** — tanto para manter as famílias atuais engajadas quanto para atrair novas matrículas.

Com base na seção "Atração vs. retenção" da análise de engajamento:
- Qual a proporção atual de conteúdo de **Atração** (vitrine para quem não conhece a escola: diferenciais, resultados, metodologia, conquistas) vs. **Retenção** (vínculo com quem já está dentro: vida estudantil, comunicados, homenagens)
- Qual grupo engaja mais hoje, e o que isso sugere sobre o que a comunidade quer ver
- Se o crescimento de seguidores estiver disponível, relacione com o volume de conteúdo de Atração no mesmo período
- Avalie se o equilíbrio atual está adequado ao objetivo da escola (se a escola precisa captar novos alunos, conteúdo de Atração insuficiente é um gap prioritário)

### Seção 2: Voz e comunicação

Com base nas análises de vocabulário, storytelling e ganchos:
- Como a escola se comunica hoje (formal? informal? técnica? afetiva?)
- O que a escola faz bem na abertura das postagens
- O que a escola faz bem na construção das legendas
- Gaps: o que está faltando para engajar mais

### Seção 3: Padrões de conteúdo que funcionam

Identifique os **3-5 formatos/temas que geraram mais engajamento** com exemplos reais:
- Descreva o padrão (tema + tipo de mídia + estrutura da legenda)
- Por que esse formato ressoa com a comunidade escolar
- Template replicável para reuso

### Seção 4: Plano de ação

Marque cada item com **[Atração]** ou **[Retenção]**, indicando se a ação visa principalmente atrair novas matrículas ou fortalecer o vínculo com a comunidade atual. Itens que servem aos dois objetivos podem ser marcados **[Ambos]**. Garanta que o plano não fique desbalanceado para um único lado — se o diagnóstico (Seção 1.1) apontou pouco conteúdo de Atração, priorize ações desse tipo.

**Curto prazo (próximas 4 semanas):**
- 3 ajustes simples que podem ser feitos imediatamente (ex: postar vídeos às terças-feiras, sempre incluir uma pergunta na legenda de eventos)

**Médio prazo (próximos 3 meses):**
- 2-3 iniciativas de conteúdo (ex: série semanal de "Conquistas do aluno", reels de bastidores de projetos)

**Guia de tom e voz:**
- Como escrever as legendas (registro, comprimento, emojis, CTAs)
- O que evitar (linguagem burocrática, posts sem contexto, excesso de comunicados)

### Seção 5: Calendário editorial sugerido

Com base nos padrões temporais identificados na análise de engajamento:
- Frequência ideal de posts por semana
- Melhores dias/horários por tipo de conteúdo
- Mix de conteúdo recomendado (% por categoria temática)

### Seção 6: Checklist de publicação

Uma lista de verificação que a equipe escolar usa antes de publicar cada post:
- [ ] A abertura da legenda prende atenção nos primeiros 2 segundos?
- [ ] O tipo de mídia é o mais adequado para este conteúdo?
- [ ] Há um CTA (pergunta, convite, marcação)?
- [ ] O horário de publicação é adequado para o conteúdo?
- [ ] A legenda tem identidade da escola (não é genérica)?

---

## Nome do arquivo de saída

Salve como `perfil-escola-{slug}.md` na mesma pasta das análises.

---

## Critérios de qualidade

- Seja **prescritivo**: use imperativos ("Publique vídeos de conquistas de alunos às terças") em vez de descritivos ("A escola tende a postar mais nos dias úteis")
- Toda recomendação do plano de ação deve indicar seu objetivo — **[Atração]**, **[Retenção]** ou **[Ambos]** — para deixar claro como ela contribui para "vender" a escola
- Ancore toda recomendação em dados reais das análises — cite a análise de origem
- Evite conselhos genéricos de marketing digital — foque no contexto escolar específico (pais, alunos, comunidade local)
- Se uma análise estiver ausente, sinaliza mas gera o perfil com o que existe
- O perfil deve ser autossuficiente: quem lê sem conhecer as análises anteriores deve entender o diagnóstico e saber o que fazer
