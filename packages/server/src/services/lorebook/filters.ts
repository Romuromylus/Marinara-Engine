import type { Lorebook } from "@marinara-engine/shared";

export type LorebookFilters = {
  chatId?: string;
  characterIds?: string[];
  personaId?: string | null;
  activeLorebookIds?: string[];
};

export type LorebookScopeCandidate = Pick<
  Lorebook,
  "id" | "characterId" | "characterIds" | "personaId" | "personaIds" | "chatId"
>;

export type RelevantLorebook = Pick<
  Lorebook,
  | "id"
  | "enabled"
  | "scanDepth"
  | "tokenBudget"
  | "recursiveScanning"
  | "maxRecursionDepth"
  | "characterId"
  | "characterIds"
  | "personaId"
  | "personaIds"
  | "chatId"
>;

export function isLorebookRelevantForFilters(book: LorebookScopeCandidate, filters: LorebookFilters): boolean {
  if (filters.activeLorebookIds?.includes(book.id)) return true;
  const linkedCharacterIds =
    book.characterIds.length > 0 ? book.characterIds : book.characterId ? [book.characterId] : [];
  const linkedPersonaIds = book.personaIds.length > 0 ? book.personaIds : book.personaId ? [book.personaId] : [];
  if (linkedCharacterIds.length === 0 && linkedPersonaIds.length === 0 && !book.chatId) return true;
  if (linkedCharacterIds.some((characterId) => filters.characterIds?.includes(characterId))) return true;
  if (filters.personaId && linkedPersonaIds.includes(filters.personaId)) return true;
  if (book.chatId && book.chatId === filters.chatId) return true;
  return false;
}

export function filterRelevantLorebooks(lorebooks: RelevantLorebook[], filters?: LorebookFilters): RelevantLorebook[] {
  const enabledBooks = lorebooks.filter((book) => book.enabled);
  if (!filters) return enabledBooks;

  return enabledBooks.filter((book) => isLorebookRelevantForFilters(book, filters));
}
