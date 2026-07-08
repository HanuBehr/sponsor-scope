import { getTwitchEnv } from "@/lib/env";

const TWITCH_AUTH_URL = "https://id.twitch.tv/oauth2/token";
const TWITCH_API_URL = "https://api.twitch.tv/helix";

type TwitchToken = {
  access_token: string;
  expires_in: number;
  token_type: string;
};

type TwitchResponse<T> = {
  data: T[];
  pagination?: {
    cursor?: string;
  };
};

export type TwitchCategory = {
  id: string;
  name: string;
  box_art_url: string;
};

export type TwitchStream = {
  id: string;
  user_id: string;
  user_login: string;
  user_name: string;
  game_id: string;
  game_name: string;
  title: string;
  viewer_count: number;
  started_at: string;
  language: string;
};

export type TwitchVideo = {
  id: string;
  user_id: string;
  user_name: string;
  title: string;
  description: string;
  created_at: string;
  published_at: string;
  url: string;
  thumbnail_url: string;
  viewable: string;
  view_count: number;
  language: string;
  type: string;
  duration: string;
};

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

export async function getTwitchAppAccessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.accessToken;
  }

  const twitchEnv = getTwitchEnv();
  const params = new URLSearchParams({
    client_id: twitchEnv.TWITCH_CLIENT_ID,
    client_secret: twitchEnv.TWITCH_CLIENT_SECRET,
    grant_type: "client_credentials",
  });

  const response = await fetch(`${TWITCH_AUTH_URL}?${params.toString()}`, { method: "POST" });

  if (!response.ok) {
    throw new Error(`Twitch token request failed with status ${response.status}`);
  }

  const token = (await response.json()) as TwitchToken;
  cachedToken = {
    accessToken: token.access_token,
    expiresAt: Date.now() + token.expires_in * 1000,
  };

  return cachedToken.accessToken;
}

export async function twitchHelixFetch<T>(path: string, params?: Record<string, string | number | undefined>) {
  const twitchEnv = getTwitchEnv();
  const accessToken = await getTwitchAppAccessToken();
  const url = new URL(`${TWITCH_API_URL}${path}`);

  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Client-Id": twitchEnv.TWITCH_CLIENT_ID,
    },
  });

  if (!response.ok) {
    throw new Error(`Twitch Helix request failed with status ${response.status}`);
  }

  return (await response.json()) as TwitchResponse<T>;
}

export async function searchTwitchCategories(query: string) {
  return twitchHelixFetch<TwitchCategory>("/search/categories", { query, first: 20 });
}

export async function getStreamsByGameId(gameId: string) {
  const data: TwitchStream[] = [];
  let after: string | undefined;
  const maxPages = 5;

  for (let page = 0; page < maxPages; page += 1) {
    const response = await twitchHelixFetch<TwitchStream>("/streams", { game_id: gameId, first: 100, after });
    data.push(...response.data);
    after = response.pagination?.cursor;

    if (!after) {
      break;
    }
  }

  return { data };
}

export async function getVideosByUserId(userId: string) {
  return twitchHelixFetch<TwitchVideo>("/videos", { user_id: userId, first: 5, type: "archive" });
}
