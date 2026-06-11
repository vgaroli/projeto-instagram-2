# Skill: ig-analise-engajamento

Analisa as MÉTRICAS DE ENGAJAMENTO de uma conta de escola no Instagram a partir do CSV de posts e do perfil.json coletados pelo MCP `instagram-posts`.

Produz um relatório Markdown com análise quantitativa (engajamento por post, por tipo, por dia/horário) e qualitativa (temas das legendas cruzados com desempenho), gerando insights e recomendações para a escola.

---

## Quando usar

Use quando o usuário pedir análise de engajamento, desempenho das postagens, métricas, taxa de engajamento, quais posts performaram melhor/pior, ou quais temas geram mais engajamento para a escola.

---

## Inputs aceitos

- **Pasta de análise** (preferido): caminho para a pasta que contém `lista.csv` e `perfil.json` — leia ambos os arquivos.
- **Dados colados diretamente**: o usuário pode colar o conteúdo do CSV e/ou perfil.json na conversa.

---

## O que analisar

### 1. Visão geral do perfil

Leia `perfil.json` e extraia:
- Nome da conta, número de seguidores, data da coleta
- Total de posts no período analisado

### 2. Métricas por post

Para cada post em `lista.csv`, calcule ou confirme:
- **Taxa de engajamento** = (curtidas + comentários) / seguidores × 100
  - Se a coluna `engagement_rate` já existir no CSV, use esse valor
  - Se faltar, calcule com o `followerCount` do `perfil.json`
- Liste os 5 posts com maior e menor engajamento (shortcode, data, tipo, taxa, trecho da legenda)

### 3. Análise por tipo de conteúdo

Agrupe os posts por `type` (image, video, carousel) e calcule para cada grupo:
- Quantidade de posts
- Engajamento médio (%)
- Engajamento mediano (%)
- Post de melhor desempenho do grupo

### 4. Análise temporal

Agrupe por dia da semana e por faixa horária (coluna `taken_at`):
- Qual dia da semana tem mais posts? Qual tem maior engajamento médio?
- Qual faixa horária (manhã 6-12h / tarde 12-18h / noite 18-24h) tem maior engajamento?
- Identifique consistência vs. irregularidade no ritmo de postagem

### 5. Análise de temas das legendas

Para cada post com legenda, classifique em uma das categorias e na respectiva **função**:

| Categoria | Função | Exemplos |
|---|---|---|
| **Evento** | Ambos | festa junina, formatura, olimpíada, feira de ciências, excursão |
| **Conquista** | Atração | premiação, aprovação vestibular, resultado de olimpíada, campeão |
| **Pedagógico** | Atração | projeto de sala, metodologia, atividade didática |
| **Vida estudantil** | Retenção | recreio, amizade, dia a dia, esportes, clubes |
| **Institucional** | Retenção | comunicado, calendário, matrícula, reunião de pais |
| **Homenagem** | Retenção | professores, funcionários, datas comemorativas (Dia das Mães, etc.) |
| **Sem legenda / inconclusivo** | — | posts sem texto ou texto muito curto |

A coluna **Função** indica o papel do conteúdo na "venda" da escola:
- **Atração**: serve de vitrine para quem ainda não conhece a escola — diferenciais, resultados, metodologia, conquistas. É o tipo de post que convenceria um pai/mãe de fora a considerar matricular o filho.
- **Retenção**: fortalece o vínculo com quem já está na comunidade (alunos, famílias atuais) — mostra que a escola valoriza quem já é de dentro.
- **Ambos**: pode cumprir as duas funções dependendo do enquadramento da legenda (ex: um evento pode ser só registro interno ou pode destacar algo que diferencia a escola).

Calcule o engajamento médio por categoria **e** por função (Atração / Retenção / Ambos).

### 6. Correlação qualidade vs. engajamento

Identifique padrões:
- Posts com legenda mais longa tendem a engajar mais ou menos?
- Posts com emoji na legenda têm padrão diferente?
- Posts com chamada para ação (perguntas, "marque um amigo", "comente abaixo") performam diferente?

### 7. Crescimento de seguidores (se houver histórico)

Se existir o arquivo `historico-seguidores.csv` na pasta (gerado pelo MCP `instagram-posts` a cada coleta, com colunas `data,seguidores,seguindo,total_media,posts_no_arquivo`):
- Compare o primeiro e o último registro: variação absoluta e percentual de seguidores no período
- Se houver 3+ registros, indique a tendência (crescimento constante, estagnado, oscilante)
- Tente cruzar picos/quedas de crescimento com o volume e o tipo de conteúdo postado no mesmo período (ex: mais posts de "Conquista" no mês com maior crescimento)
- Se houver apenas 1 registro, informe que ainda não há dados suficientes para análise de tendência e que o histórico será construído nas próximas coletas

---

## Formato do output

Gere um arquivo Markdown com as seções:

```
# Análise de Engajamento — @{conta}
> Período: {data início} a {data fim} | {N} posts | {seguidores} seguidores

## Resumo executivo
[3-4 bullets com os achados mais importantes]

## Desempenho por tipo de conteúdo
[Tabela: tipo | qtd posts | eng. médio % | eng. mediano % | melhor post]

## Melhores e piores posts
[Top 5 e bottom 5 com shortcode, data, tipo, taxa, trecho da legenda]

## Padrões temporais
[Melhores dias e horários, análise do ritmo de postagem]

## Desempenho por tema
[Tabela: tema | função (atração/retenção/ambos) | qtd posts | eng. médio % | exemplo de melhor post]

## Atração vs. retenção
[Comparativo de engajamento médio entre conteúdo de Atração, Retenção e Ambos; o que isso sugere sobre o equilíbrio atual da conta]

## Correlações de legenda
[Achados sobre legendas longas vs. curtas, CTAs, emojis]

## Crescimento de seguidores
[Evolução de seguidores com base no historico-seguidores.csv, se disponível; ou nota de que o histórico está sendo iniciado]

## Recomendações
[5-7 recomendações específicas e acionáveis para a escola, indicando para cada uma se o foco é atração de novos alunos ou retenção/vínculo com a comunidade atual]
```

---

## Critérios de qualidade

- Toda afirmação deve estar ancorada em dados do CSV — não especule
- Use valores concretos (nunca "posts com bom engajamento" — diga "posts com engajamento acima de 2,5%")
- Se uma categoria tiver menos de 3 posts, não generalize — sinalize que a amostra é pequena
- As recomendações devem ser específicas para o contexto escolar (não genéricas de marketing)
- Se `engagement_rate` estiver zerado para todos os posts (followerCount ausente), informe e calcule manualmente usando o `followerCount` de `perfil.json`
- Crescimento de seguidores é um sinal indireto de atração (sofre influência de fatores externos à conta) — trate como indício, não como prova isolada, e sempre cruze com o conteúdo publicado no período
