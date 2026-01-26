/**
 * Document Reader Utility
 * 
 * Reads and extracts content from source documents (Markdown, text files).
 * Used to load existing documentation as context for document generation.
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Result of reading a single document
 */
export interface DocumentContent {
  /** Original file path */
  path: string;
  /** File name without directory */
  filename: string;
  /** File content */
  content: string;
  /** File size in bytes */
  size: number;
  /** Whether the file was read successfully */
  success: boolean;
  /** Error message if reading failed */
  error?: string;
}

/**
 * Result of reading multiple documents
 */
export interface ReadDocumentsResult {
  /** Successfully read documents */
  documents: DocumentContent[];
  /** Files that failed to read */
  errors: DocumentContent[];
  /** Combined content of all documents (formatted) */
  combinedContent: string;
  /** Total character count of combined content */
  totalCharacters: number;
}

/**
 * Read a single document file
 * 
 * @param filePath - Path to the document (relative or absolute)
 * @param basePath - Base path for resolving relative paths (default: cwd)
 * @returns Document content with metadata
 */
export function readDocument(filePath: string, basePath?: string): DocumentContent {
  const resolvedPath = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(basePath ?? process.cwd(), filePath);

  const filename = path.basename(resolvedPath);

  try {
    if (!fs.existsSync(resolvedPath)) {
      return {
        path: filePath,
        filename,
        content: '',
        size: 0,
        success: false,
        error: `File not found: ${resolvedPath}`,
      };
    }

    const stats = fs.statSync(resolvedPath);
    
    if (!stats.isFile()) {
      return {
        path: filePath,
        filename,
        content: '',
        size: 0,
        success: false,
        error: `Not a file: ${resolvedPath}`,
      };
    }

    // Warn if file is very large (> 500KB)
    if (stats.size > 500 * 1024) {
      console.warn(`Warning: Large file (${Math.round(stats.size / 1024)}KB): ${filename}`);
    }

    const content = fs.readFileSync(resolvedPath, 'utf-8');

    return {
      path: filePath,
      filename,
      content,
      size: stats.size,
      success: true,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      path: filePath,
      filename,
      content: '',
      size: 0,
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Read multiple source documents and combine their content
 * 
 * @param paths - Array of file paths to read
 * @param basePath - Base path for resolving relative paths
 * @returns Combined result with all documents
 * 
 * @example
 * ```typescript
 * const result = await readSourceDocuments([
 *   'docs/existing-prd.md',
 *   'notes/architecture.md'
 * ]);
 * 
 * console.log(result.combinedContent);
 * // Output:
 * // ---
 * // ## Source: existing-prd.md
 * // [content of existing-prd.md]
 * // 
 * // ---
 * // ## Source: architecture.md
 * // [content of architecture.md]
 * ```
 */
export function readSourceDocuments(
  paths: string[],
  basePath?: string
): ReadDocumentsResult {
  const documents: DocumentContent[] = [];
  const errors: DocumentContent[] = [];

  for (const filePath of paths) {
    const result = readDocument(filePath, basePath);
    
    if (result.success) {
      documents.push(result);
    } else {
      errors.push(result);
    }
  }

  // Build combined content with clear section markers
  let combinedContent = '';
  
  for (const doc of documents) {
    combinedContent += `\n\n---\n`;
    combinedContent += `## Source: ${doc.filename}\n\n`;
    combinedContent += doc.content.trim();
    combinedContent += '\n';
  }

  // Log errors if any
  if (errors.length > 0) {
    console.warn(`Failed to read ${errors.length} document(s):`);
    for (const err of errors) {
      console.warn(`  - ${err.path}: ${err.error}`);
    }
  }

  return {
    documents,
    errors,
    combinedContent: combinedContent.trim(),
    totalCharacters: combinedContent.length,
  };
}

/**
 * Extract key sections from a Markdown document
 * 
 * Useful for summarizing existing PRDs/TDRs before using as context.
 * 
 * @param content - Markdown content
 * @param maxLength - Maximum length of extracted content
 * @returns Extracted sections as a string
 */
export function extractKeySections(content: string, maxLength: number = 4000): string {
  // If content is short enough, return as-is
  if (content.length <= maxLength) {
    return content;
  }

  const sections: string[] = [];
  let currentLength = 0;

  // Priority sections to extract (in order)
  const prioritySections = [
    /^#\s+.*$/m,                           // Main title
    /^##\s+(Executive Summary|Overview|Summary)[\s\S]*?(?=^##|\Z)/im,
    /^##\s+(Problem|Problem Statement)[\s\S]*?(?=^##|\Z)/im,
    /^##\s+(Goals|Objectives|Success Metrics)[\s\S]*?(?=^##|\Z)/im,
    /^##\s+(Requirements|Features)[\s\S]*?(?=^##|\Z)/im,
    /^##\s+(Architecture|System Design)[\s\S]*?(?=^##|\Z)/im,
    /^##\s+(Tech Stack|Technology)[\s\S]*?(?=^##|\Z)/im,
  ];

  for (const pattern of prioritySections) {
    const match = content.match(pattern);
    if (match) {
      const section = match[0].trim();
      if (currentLength + section.length < maxLength) {
        sections.push(section);
        currentLength += section.length;
      }
    }
  }

  // If we didn't find priority sections, just truncate
  if (sections.length === 0) {
    return content.slice(0, maxLength) + '\n\n...[truncated]';
  }

  return sections.join('\n\n');
}

/**
 * Check if a file path is a supported document type
 * 
 * @param filePath - Path to check
 * @returns Whether the file type is supported
 */
export function isSupportedDocumentType(filePath: string): boolean {
  const supportedExtensions = ['.md', '.markdown', '.txt', '.text'];
  const ext = path.extname(filePath).toLowerCase();
  return supportedExtensions.includes(ext);
}

/**
 * Find all Markdown documents in a directory
 * 
 * @param dirPath - Directory to search
 * @param recursive - Whether to search subdirectories
 * @returns Array of file paths
 */
export function findDocuments(dirPath: string, recursive: boolean = false): string[] {
  const results: string[] = [];
  const resolvedDir = path.resolve(dirPath);

  if (!fs.existsSync(resolvedDir)) {
    return results;
  }

  const entries = fs.readdirSync(resolvedDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(resolvedDir, entry.name);

    if (entry.isFile() && isSupportedDocumentType(entry.name)) {
      results.push(fullPath);
    } else if (entry.isDirectory() && recursive) {
      results.push(...findDocuments(fullPath, true));
    }
  }

  return results;
}
