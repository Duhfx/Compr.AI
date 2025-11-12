// src/services/api.ts
// API client for Vercel Functions

interface SuggestedItem {
  name: string;
  quantity: number;
  unit: string;
  category?: string;
}

interface SuggestionResponse {
  items: SuggestedItem[];
}

interface NormalizeResponse {
  normalized: string;
  category?: string;
  suggestedUnit?: string;
}

/**
 * Get AI-powered item suggestions based on user prompt and history
 */
export const suggestItems = async (
  deviceId: string,
  prompt?: string,
  listType?: string,
  maxResults = 10
): Promise<SuggestionResponse> => {
  const response = await fetch('/api/suggest-items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId, prompt, listType, maxResults })
  });

  if (!response.ok) {
    throw new Error('Failed to get suggestions');
  }

  return response.json();
};

/**
 * Normalize product name using AI
 */
export const normalizeItemName = async (rawName: string): Promise<NormalizeResponse> => {
  const response = await fetch('/api/normalize-item', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rawName })
  });

  if (!response.ok) {
    throw new Error('Failed to normalize item name');
  }

  return response.json();
};

/**
 * Normalize multiple items in batch (with caching)
 */
const normalizationCache = new Map<string, NormalizeResponse>();

export const normalizeItemNameCached = async (rawName: string): Promise<NormalizeResponse> => {
  const key = rawName.toLowerCase().trim();

  // Check cache first
  if (normalizationCache.has(key)) {
    return normalizationCache.get(key)!;
  }

  // Call API
  const result = await normalizeItemName(rawName);

  // Cache result
  normalizationCache.set(key, result);

  // Limit cache size to 100 items
  if (normalizationCache.size > 100) {
    const firstKey = normalizationCache.keys().next().value;
    if (firstKey !== undefined) {
      normalizationCache.delete(firstKey);
    }
  }

  return result;
};
