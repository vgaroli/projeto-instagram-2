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
- Ancore toda recomendação em dados reais das análises — cite a análise de origem
- Evite conselhos genéricos de marketing digital — foque no contexto escolar específico (pais, alunos, comunidade local)
- Se uma análise estiver ausente, sinaliza mas gera o perfil com o que existe
- O perfil deve ser autossuficiente: quem lê sem conhecer as análises anteriores deve entender o diagnóstico e saber o que fazer
