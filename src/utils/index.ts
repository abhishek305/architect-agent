/**
 * Utility exports for Document Architect
 */

// Document reader utilities
export {
  readDocument,
  readSourceDocuments,
  extractKeySections,
  isSupportedDocumentType,
  findDocuments,
  type DocumentContent,
  type ReadDocumentsResult,
} from './document-reader';

// Context builder utilities
export {
  buildPromptContext,
  buildPRDPrompt,
  buildTDRPrompt,
  buildFrontendTDRPrompt,
  buildStoriesPrompt,
  buildInteractiveContext,
  formatKey,
  type ContextBuilderOptions,
  type BuiltContext,
} from './context-builder';
