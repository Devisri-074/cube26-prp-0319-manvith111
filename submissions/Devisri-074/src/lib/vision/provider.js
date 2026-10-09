/**
 * Unified Vision Execution Layer
 * "Vision observes. Rules decide. Evidence proves."
 */

import { MockVisionProvider } from './providers/mock';

export function getVisionProvider(providerType = 'LOCAL_DEMO', config = {}) {
  switch (providerType) {
    case 'LOCAL_DEMO':
    case 'STATION_CV':
    case 'OPENAI_VISION':
    case 'CLAUDE_VISION':
    case 'OLLAMA_LOCAL':
    default:
      return new MockVisionProvider();
  }
}

export async function executeVisionInspection(request, config = {}) {
  const providerType = config.providerType || 'LOCAL_DEMO';
  const provider = getVisionProvider(providerType, config);

  try {
    return await provider.analyze(request.imageUrls, request);
  } catch (error) {
    console.error(`[Vision Provider Warning] ${provider.name} failed. Engaging fail-open fallback:`, error);
    const fallback = new MockVisionProvider();
    return await fallback.analyze(request.imageUrls, request);
  }
}
