import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeSpotifySearchQuery,
  SPOTIFY_SEARCH_QUERY_MAX_CHARS,
} from "../src/services/spotify/spotify.service.js";

test("normalizeSpotifySearchQuery clamps queries to Spotify's search limit", () => {
  const query = Array.from({ length: 80 }, (_, index) => `scene${index}`).join(" ");
  const normalized = normalizeSpotifySearchQuery(query);

  assert.ok(normalized.length <= SPOTIFY_SEARCH_QUERY_MAX_CHARS);
  assert.equal(normalized.endsWith(" "), false);
});

test("normalizeSpotifySearchQuery honors smaller caller budgets", () => {
  const normalized = normalizeSpotifySearchQuery("artist:Dottore tense laboratory confrontation", 24);

  assert.ok(normalized.length <= 24);
  assert.equal(normalized, "artist:Dottore tense");
});
