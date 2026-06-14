// ──────────────────────────────────────────────
// Routes: YouTube DJ (Data API v3 search)
// ──────────────────────────────────────────────
// The YouTube DJ agent returns a search query; the client plays the result in
// an embedded YouTube IFrame player. These routes (a) store the user's free
// YouTube Data API key encrypted at rest and (b) resolve a query → video on the
// server so the key never reaches the browser. No OAuth, no playback control.
import type { FastifyInstance } from "fastify";
import { createAgentsStorage } from "../services/storage/agents.storage.js";
import { decryptApiKey, encryptApiKey } from "../utils/crypto.js";
import { logger } from "../lib/logger.js";

function parseSettings(agent: { settings?: unknown } | null): Record<string, unknown> {
  if (!agent?.settings) return {};
  if (typeof agent.settings === "string") {
    try {
      return JSON.parse(agent.settings) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return agent.settings as Record<string, unknown>;
}

function readApiKey(settings: Record<string, unknown>): string {
  const value = settings.youtubeApiKey;
  if (typeof value !== "string" || !value) return "";
  // Stored encrypted; tolerate a plaintext value too (decryptApiKey returns "" on non-ciphertext).
  return decryptApiKey(value) || value;
}

const HTML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&quot;": '"',
  "&#39;": "'",
  "&lt;": "<",
  "&gt;": ">",
};

function decodeEntities(str: string): string {
  return str.replace(/&amp;|&quot;|&#39;|&lt;|&gt;/g, (m) => HTML_ENTITIES[m] ?? m);
}

export async function youtubeRoutes(app: FastifyInstance) {
  const storage = createAgentsStorage(app.db);

  /** Resolve the target agent: explicit id, else the latest "youtube" built-in config. */
  async function resolveAgent(agentId?: string) {
    if (agentId) return storage.getById(agentId);
    return storage.getByType("youtube");
  }

  /**
   * POST /api/youtube/save-key
   * Body: { agentId, apiKey }
   * Encrypts and stores the YouTube Data API key in the agent's settings.
   */
  app.post<{ Body: { agentId?: string; apiKey?: string } }>("/save-key", async (req, reply) => {
    const { agentId, apiKey } = req.body ?? {};
    if (!agentId) return reply.status(400).send({ error: "agentId is required" });
    const trimmed = typeof apiKey === "string" ? apiKey.trim() : "";
    if (!trimmed) return reply.status(400).send({ error: "apiKey is required" });

    const agent = await storage.getById(agentId);
    if (!agent) return reply.status(404).send({ error: "Agent not found" });

    const settings = parseSettings(agent);
    await storage.update(agentId, {
      settings: { ...settings, youtubeApiKey: encryptApiKey(trimmed) },
    });
    return { success: true };
  });

  /**
   * GET /api/youtube/status?agentId=xxx
   * Returns whether a YouTube Data API key is configured.
   */
  app.get<{ Querystring: { agentId?: string } }>("/status", async (req, reply) => {
    const agent = await resolveAgent(req.query.agentId);
    if (!agent) return { configured: false };
    return { configured: !!readApiKey(parseSettings(agent)) };
  });

  /**
   * POST /api/youtube/disconnect
   * Body: { agentId }
   * Removes the stored API key.
   */
  app.post<{ Body: { agentId?: string } }>("/disconnect", async (req, reply) => {
    const { agentId } = req.body ?? {};
    if (!agentId) return reply.status(400).send({ error: "agentId is required" });
    const agent = await storage.getById(agentId);
    if (!agent) return reply.status(404).send({ error: "Agent not found" });

    const { youtubeApiKey, ...rest } = parseSettings(agent);
    await storage.update(agentId, { settings: rest });
    return { success: true };
  });

  /**
   * GET /api/youtube/search?q=...&agentId=...&limit=...
   * Resolves a query to embeddable YouTube videos. The client plays the first.
   */
  app.get<{ Querystring: { q?: string; agentId?: string; limit?: string } }>("/search", async (req, reply) => {
    const q = (req.query.q ?? "").trim().slice(0, 200);
    if (!q) return reply.status(400).send({ error: "q is required" });

    const agent = await resolveAgent(req.query.agentId);
    const apiKey = agent ? readApiKey(parseSettings(agent)) : "";
    if (!apiKey) {
      return reply
        .status(400)
        .send({ error: "YouTube not configured. Add a YouTube Data API key in the YouTube DJ agent settings." });
    }

    const limit = Math.max(1, Math.min(10, Number(req.query.limit ?? 5) || 5));

    try {
      const url = `https://www.googleapis.com/youtube/v3/search?${new URLSearchParams({
        part: "snippet",
        type: "video",
        videoEmbeddable: "true",
        maxResults: String(limit),
        q,
        key: apiKey,
      })}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
      if (!res.ok) {
        const body = await res.text();
        return reply.status(res.status).send({ error: `YouTube API error (${res.status}): ${body.slice(0, 200)}` });
      }
      const data = (await res.json()) as {
        items?: Array<{
          id?: { videoId?: string };
          snippet?: { title?: string; channelTitle?: string; thumbnails?: { medium?: { url?: string } } };
        }>;
      };
      const results = (data.items ?? [])
        .filter((item) => item.id?.videoId)
        .map((item) => ({
          videoId: item.id!.videoId!,
          title: decodeEntities(item.snippet?.title ?? ""),
          channel: decodeEntities(item.snippet?.channelTitle ?? ""),
          thumbnail: item.snippet?.thumbnails?.medium?.url ?? null,
        }));
      return { query: q, results, count: results.length };
    } catch (err) {
      logger.error(err, "YouTube search failed");
      return reply.status(500).send({ error: err instanceof Error ? err.message : "YouTube search failed" });
    }
  });
}
