/**
 * Content Ideas Agents - Barrel Export
 */

// Types
export * from './types';

// Wave 1 Agents
export { createProductDetailsExpert, ProductDetailsExpertAgent } from './productDetailsExpert';
export { createFunFactsExpert, FunFactsExpertAgent } from './funFactsExpert';

// Wave 2 Agents
export { createViralityManager, ViralityManagerAgent } from './viralityManager';

// Wave 3 Agents
export { createTikTokSpecialist, TikTokSpecialistAgent } from './tiktokSpecialist';
export { createReelsSpecialist, ReelsSpecialistAgent } from './reelsSpecialist';
export { createShortsSpecialist, ShortsSpecialistAgent } from './shortsSpecialist';
export { createBagQAAgent, BagQAAgentClass } from './bagQAAgent';

// Orchestration
export { runTeamGeneration, type OrchestratorConfig, type OrchestratorResult, type BagData } from './orchestrator';
export { mergeOutputs, calculateQualityScore, extractHighlights } from './merger';
