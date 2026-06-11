// Cliente para a API pública (web) do Instagram, sem autenticação.
// Coleta TODOS os tipos de post (imagem, vídeo, carrossel) com suporte a
// filtro por data (últimos N dias) e retorna contagem de seguidores do perfil.
//
// Mesma estratégia do MCP instagram-videos:
//  1. GET /api/v1/users/web_profile_info/ → id, seguidores, total de mídias
//  2. POST /graphql/query com PolarisProfilePostsTabContentQuery (primário)
//  3. Auto-cura do doc_id via scraping de bundles JS
//  4. Fallback: /api/v1/feed/user/<id>/ (legado)

const WEB_APP_ID = "936619743392459";
const PAGE_SIZE = 12;

const DEFAULT_POSTS_DOC_ID =
  process.env.IG_POSTS_DOC_ID || "27964987773089789";

const POSTS_FRIENDLY_NAME =
  "PolarisProfilePostsTabContentQuery_connection_" +
  "xdt_api__v1__feed__user_timeline_graphql_connection";

const PROVIDER_FLAGS = [
  "__relay_internal__pv__PolarisCannesGuardianExperienceEnabledrelayprovider",
  "__relay_internal__pv__PolarisCASB976ProfileEnabledrelayprovider",
  "__relay_internal__pv__PolarisWebSchoolsEnabledrelayprovider",
  "__relay_internal__pv__PolarisRepostsConsumptionEnabledrelayprovider",
  "__relay_internal__pv__PolarisImmersiveFeedChainingEnabledrelayprovider",
  "__relay_internal__pv__PolarisAIGMAccountLabelEnabledrelayprovider",
];

const DEFAULT_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "*/*",
  "Accept-Language": "en-US,en;q=0.9",
  "x-ig-app-id": WEB_APP_ID,
  "X-Requested-With": "XMLHttpRequest",
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url, { referer, retries = 2 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          ...DEFAULT_HEADERS,
          ...(referer ? { Referer: referer } : {}),
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch {
        throw new Error("Resposta não é JSON (possível bloqueio/login wall).");
      }
    } catch (err) {
      lastErr = err;
      if (attempt < retries) await sleep(800 * (attempt + 1));
    }
  }
  throw lastErr;
}

// media_type: 1=imagem, 2=vídeo, 8=carrossel
function postType(item) {
  if (item?.media_type === 8) return "carousel";
  if (
    item?.media_type === 2 ||
    item?.product_type === "clips" ||
    item?.product_type === "igtv"
  )
    return "video";
  return "image";
}

function itemToPost(item, username) {
  const shortcode = item.code || "";
  const timestamp = item.taken_at || 0;
  const caption = item.caption?.text ?? "";
  const type = postType(item);

  const likes = item.like_count ?? null;
  const comments = item.comment_count ?? null;
  const views =
    type === "video"
      ? (item.play_count ?? item.ig_play_count ?? item.view_count ?? null)
      : null;

  const isReel =
    item.product_type === "clips" || item.product_type === "igtv";
  const urlPath = isReel ? "reel" : "p";
  const thumbnail =
    item.image_versions2?.candidates?.[0]?.url || item.display_uri || "";

  return {
    shortcode,
    url: shortcode ? `https://www.instagram.com/${urlPath}/${shortcode}/` : "",
    type,
    taken_at: timestamp ? new Date(timestamp * 1000).toISOString() : "",
    timestamp,
    likes,
    comments,
    views,
    engagement_rate: null, // calculado depois com followerCount
    caption,
    thumbnail,
  };
}

// Resolve perfil público: id, seguidores, total de mídias, nome, bio.
async function fetchProfile(username) {
  const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(
    username
  )}`;
  const json = await fetchJson(url, {
    referer: `https://www.instagram.com/${username}/`,
  });
  const user = json?.data?.user;
  if (!user || !user.id) {
    throw new Error("Perfil não encontrado ou bloqueado pela API pública.");
  }
  return {
    id: user.id,
    followerCount:
      user.edge_followed_by?.count ?? user.follower_count ?? null,
    followingCount:
      user.edge_follow?.count ?? user.following_count ?? null,
    totalMedia: user.edge_owner_to_timeline_media?.count ?? null,
    fullName: user.full_name || "",
    biography: user.biography || "",
    isPrivate: user.is_private === true,
  };
}

async function bootstrapWebSession(username) {
  const res = await fetch(`https://www.instagram.com/${username}/`, {
    headers: { ...DEFAULT_HEADERS, Accept: "text/html,application/xhtml+xml" },
  });
  const html = await res.text();
  const setCookie = res.headers.get("set-cookie") || "";
  const csrf =
    setCookie.match(/csrftoken=([^;]+)/)?.[1] ||
    html.match(/"csrf_token":"([^"]+)"/)?.[1] ||
    null;
  const lsd =
    html.match(/"LSD",\[\],\{"token":"([^"]+)"/)?.[1] ||
    html.match(/"lsd":"([^"]+)"/)?.[1] ||
    null;
  return { csrf, lsd, html };
}

async function scrapePostsDocId(html) {
  const bundles = [
    ...new Set(
      [...html.matchAll(/(https:\/\/[^"]+?\.js)"/g)].map((m) => m[1])
    ),
  ];
  bundles.sort(
    (a, b) =>
      (/Profile|Posts|Consumer/i.test(b) ? 1 : 0) -
      (/Profile|Posts|Consumer/i.test(a) ? 1 : 0)
  );
  for (const url of bundles.slice(0, 12)) {
    try {
      const txt = await (
        await fetch(url, {
          headers: { "User-Agent": DEFAULT_HEADERS["User-Agent"] },
        })
      ).text();
      if (!txt.includes("ProfilePostsTabContentQuery")) continue;
      const m = txt.match(
        /PolarisProfilePostsTabContentQuery_connection[\s\S]{0,4000}?"(\d{15,})"/
      );
      if (m) return m[1];
    } catch {
      // ignora bundle inacessível
    }
  }
  return null;
}

function buildPostsBody({ username, after, docId, lsd }) {
  const variables = {
    after: after || null,
    before: null,
    data: { count: PAGE_SIZE },
    first: PAGE_SIZE,
    last: null,
    username,
  };
  for (const f of PROVIDER_FLAGS) variables[f] = false;

  const body = new URLSearchParams();
  body.set("av", "0");
  body.set("__comet_req", "7");
  body.set("lsd", lsd || "");
  body.set("doc_id", docId);
  body.set("fb_api_caller_class", "RelayModern");
  body.set("fb_api_req_friendly_name", POSTS_FRIENDLY_NAME);
  body.set("variables", JSON.stringify(variables));
  body.set("server_timestamps", "true");
  return body.toString();
}

async function fetchPostsPage({ username, after, docId, session }) {
  const res = await fetch("https://www.instagram.com/graphql/query", {
    method: "POST",
    headers: {
      ...DEFAULT_HEADERS,
      "Content-Type": "application/x-www-form-urlencoded",
      "x-csrftoken": session.csrf || "",
      "x-fb-lsd": session.lsd || "",
      "x-fb-friendly-name": POSTS_FRIENDLY_NAME,
      Referer: `https://www.instagram.com/${username}/`,
      Cookie: session.csrf ? `csrftoken=${session.csrf}` : "",
    },
    body: buildPostsBody({ username, after, docId, lsd: session.lsd }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  const json = JSON.parse(await res.text());
  const conn =
    json?.data?.xdt_api__v1__feed__user_timeline_graphql_connection;
  if (!conn) {
    const msg = JSON.stringify(
      json?.errors || json?.error || "sem connection"
    );
    throw new Error(`GraphQL sem dados: ${msg.slice(0, 120)}`);
  }
  return conn;
}

// cutoff: timestamp unix mínimo (posts mais antigos são ignorados)
async function collectViaGraphql({
  username,
  maxPages,
  cutoff,
  onLog,
}) {
  const session = await bootstrapWebSession(username);
  if (!session.csrf || !session.lsd) {
    throw new Error("Não foi possível obter tokens (csrf/lsd) do HTML.");
  }

  let docId = DEFAULT_POSTS_DOC_ID;
  let after = null;
  let more = true;
  let pagesFetched = 0;
  let reachedCutoff = false;
  const posts = [];
  const seen = new Set();

  // O Instagram permite fixar (pin) até 3 posts no topo do perfil, fora de
  // ordem cronológica — eles aparecem antes dos demais na 1ª página. Sem
  // tratamento, um post fixado antigo dispara o corte de data antes mesmo de
  // processar os posts recentes que vêm depois dele.
  const MAX_PINNED = 3;
  let pinnedSkipped = 0;
  let sawInRangePost = false;

  while (more && pagesFetched < maxPages && !reachedCutoff) {
    if (pagesFetched > 0) await sleep(1200);
    let conn;
    try {
      conn = await fetchPostsPage({ username, after, docId, session });
    } catch (err) {
      if (pagesFetched === 0) {
        const fresh = await scrapePostsDocId(session.html);
        if (fresh && fresh !== docId) {
          onLog(`doc_id ${docId} falhou; usando doc_id raspado ${fresh}.`);
          docId = fresh;
          conn = await fetchPostsPage({ username, after, docId, session });
        } else {
          throw err;
        }
      } else {
        throw err;
      }
    }

    pagesFetched++;
    let pagePosts = 0;
    for (const edge of conn.edges || []) {
      const node = edge.node;
      // posts vêm do mais novo ao mais antigo — para quando atingir o corte
      if (cutoff && node.taken_at && node.taken_at < cutoff) {
        // Na 1ª página, antes de qualquer post dentro do período, um post
        // antigo provavelmente é fixado (pinned): pula em vez de cortar.
        if (pagesFetched === 1 && !sawInRangePost && pinnedSkipped < MAX_PINNED) {
          pinnedSkipped++;
          continue;
        }
        reachedCutoff = true;
        break;
      }
      sawInRangePost = true;
      const post = itemToPost(node, username);
      if (post.shortcode && !seen.has(post.shortcode)) {
        seen.add(post.shortcode);
        posts.push(post);
        pagePosts++;
      }
    }
    onLog(
      `[graphql] Página ${pagesFetched}: ${(conn.edges || []).length} mídias, ` +
        `+${pagePosts} posts coletados (total: ${posts.length})` +
        (reachedCutoff ? " — corte de data atingido." : ".")
    );
    more =
      !reachedCutoff &&
      conn.page_info?.has_next_page === true &&
      !!conn.page_info?.end_cursor;
    after = conn.page_info?.end_cursor || null;
  }

  return { posts, pagesFetched };
}

async function fetchFeedPage(userId, maxId, username) {
  let url = `https://www.instagram.com/api/v1/feed/user/${userId}/?count=33`;
  if (maxId) url += `&max_id=${encodeURIComponent(maxId)}`;
  const json = await fetchJson(url, {
    referer: `https://www.instagram.com/${username}/`,
  });
  return {
    items: json?.items || [],
    moreAvailable: json?.more_available === true,
    nextMaxId: json?.next_max_id || null,
  };
}

async function collectViaFeedV1({
  userId,
  username,
  maxPages,
  cutoff,
  onLog,
  seen,
  posts,
}) {
  let maxId = null;
  let more = true;
  let pagesFetched = 0;
  let reachedCutoff = false;

  // Mesmo tratamento de posts fixados (pinned) usado no caminho GraphQL.
  const MAX_PINNED = 3;
  let pinnedSkipped = 0;
  let sawInRangePost = false;

  while (more && pagesFetched < maxPages && !reachedCutoff) {
    if (pagesFetched > 0) await sleep(1200);
    const page = await fetchFeedPage(userId, maxId, username);
    pagesFetched++;
    let pagePosts = 0;
    for (const item of page.items) {
      if (cutoff && item.taken_at && item.taken_at < cutoff) {
        if (pagesFetched === 1 && !sawInRangePost && pinnedSkipped < MAX_PINNED) {
          pinnedSkipped++;
          continue;
        }
        reachedCutoff = true;
        break;
      }
      sawInRangePost = true;
      const post = itemToPost(item, username);
      if (post.shortcode && !seen.has(post.shortcode)) {
        seen.add(post.shortcode);
        posts.push(post);
        pagePosts++;
      }
    }
    onLog(
      `[feed-v1] Página ${pagesFetched}: ${page.items.length} mídias, ` +
        `+${pagePosts} posts (total: ${posts.length})` +
        (reachedCutoff ? " — corte de data atingido." : ".")
    );
    more = !reachedCutoff && page.moreAvailable && !!page.nextMaxId;
    maxId = page.nextMaxId;
  }
  return pagesFetched;
}

function calcEngagementRate(likes, comments, followerCount) {
  if (!followerCount || followerCount === 0) return null;
  const rate =
    ((Number(likes || 0) + Number(comments || 0)) / followerCount) * 100;
  return Math.round(rate * 10000) / 10000; // 4 casas decimais
}

/**
 * Coleta todos os posts (imagem, vídeo, carrossel) de uma conta pública.
 *
 * @param {string} username
 * @param {object} [opts]
 * @param {number} [opts.daysBack=30] quantos dias para trás coletar
 * @param {number} [opts.maxPages=Infinity] limite de páginas
 * @param {(msg:string)=>void} [opts.onLog]
 */
export async function fetchAccountPosts(username, opts = {}) {
  const { daysBack = 30, maxPages = Infinity, onLog = () => {} } = opts;

  const cutoff =
    daysBack > 0
      ? Math.floor(Date.now() / 1000) - daysBack * 86400
      : null;

  const errors = [];
  let posts = [];
  const seen = new Set();

  const profile = await fetchProfile(username);
  onLog(
    `Perfil @${username} (id=${profile.id}) — seguidores: ${
      profile.followerCount ?? "?"
    }, total de mídias: ${profile.totalMedia ?? "?"}${
      profile.isPrivate ? " [PRIVADO]" : ""
    }${cutoff ? `, coletando posts desde ${new Date(cutoff * 1000).toISOString().slice(0, 10)}` : ""}.`
  );

  if (profile.isPrivate) {
    errors.push("Conta privada: a API pública não expõe as mídias.");
  }

  let pagesFetched = 0;

  try {
    const r = await collectViaGraphql({
      username,
      maxPages,
      cutoff,
      onLog,
    });
    for (const p of r.posts) {
      if (p.shortcode && !seen.has(p.shortcode)) {
        seen.add(p.shortcode);
        posts.push(p);
      }
    }
    pagesFetched += r.pagesFetched;
  } catch (err) {
    errors.push(`GraphQL web: ${err.message}`);
    onLog(`Caminho GraphQL falhou (${err.message}). Tentando fallback v1...`);
  }

  if (posts.length === 0) {
    try {
      const fb = await collectViaFeedV1({
        userId: profile.id,
        username,
        maxPages,
        cutoff,
        onLog,
        seen,
        posts,
      });
      pagesFetched += fb;
    } catch (err) {
      errors.push(`Feed v1: ${err.message}`);
      onLog(`Fallback v1 também falhou (${err.message}).`);
    }
  }

  // Calcula engagement_rate com o followerCount obtido
  if (profile.followerCount) {
    posts = posts.map((p) => ({
      ...p,
      engagement_rate: calcEngagementRate(
        p.likes,
        p.comments,
        profile.followerCount
      ),
    }));
  }

  posts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  return {
    username,
    userId: profile.id,
    followerCount: profile.followerCount,
    followingCount: profile.followingCount,
    fullName: profile.fullName,
    biography: profile.biography,
    totalMedia: profile.totalMedia,
    isPrivate: profile.isPrivate,
    posts,
    pagesFetched,
    errors,
  };
}
