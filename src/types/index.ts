/**
 * Type exports for Document Architect
 */

export type {
  ProjectConfigV2,
  ProjectConfigV1,
  InterviewAnswers,
  TeamContext,
  GenerationMode,
} from './config';

export {
  normalizeConfig,
  validateConfig,
  isV1Config,
} from './config';
