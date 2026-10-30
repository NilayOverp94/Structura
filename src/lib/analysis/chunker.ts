import { GEMINI_CONFIG } from '@/config/constants';

export interface CodeChunkData {
  content: string;
  startLine: number;
  endLine: number;
  metadata: {
    file_path: string;
    language: string | null;
    functions?: string[];
    classes?: string[];
    imports?: string[];
  };
}

export function chunkFileContent(
  content: string,
  filePath: string,
  language: string | null
): CodeChunkData[] {
  const lines = content.split('\n');
  const chunks: CodeChunkData[] = [];
  
  if (lines.length === 0 || !content.trim()) return chunks;

  const chunkSize = GEMINI_CONFIG.chunkSize;
  const overlap = GEMINI_CONFIG.chunkOverlap;

  if (content.length <= chunkSize) {
    chunks.push({
      content: content,
      startLine: 1,
      endLine: lines.length,
      metadata: {
        file_path: filePath,
        language,
        ...extractMetadata(content, language),
      },
    });
    return chunks;
  }

  let currentChunk = '';
  let startLine = 1;
  let currentLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const potentialChunk = currentChunk + (currentChunk ? '\n' : '') + line;

    if (potentialChunk.length > chunkSize && currentChunk.length > 0) {
      chunks.push({
        content: currentChunk,
        startLine,
        endLine: currentLine + 1,
        metadata: {
          file_path: filePath,
          language,
          ...extractMetadata(currentChunk, language),
        },
      });

      const overlapLines = Math.max(0, currentLine - Math.floor(overlap / 40));
      startLine = overlapLines + 1;
      currentChunk = lines.slice(overlapLines, i + 1).join('\n');
      currentLine = i;
    } else {
      currentChunk = potentialChunk;
      currentLine = i;
    }
  }

  if (currentChunk.trim()) {
    chunks.push({
      content: currentChunk,
      startLine,
      endLine: lines.length,
      metadata: {
        file_path: filePath,
        language,
        ...extractMetadata(currentChunk, language),
      },
    });
  }

  return chunks;
}

function extractMetadata(content: string, language: string | null): {
  functions?: string[];
  classes?: string[];
  imports?: string[];
} {
  const result: { functions?: string[]; classes?: string[]; imports?: string[] } = {};
  if (!language) return result;

  const functionPatterns = [
    /(?:function|def|func|fn)\s+([a-zA-Z0-9_]+)/g,
    /(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*(?:async\s+)?(?:\([^)]*\)|[^=])\s*=>/g,
    /([a-zA-Z0-9_]+)\s*\([^)]*\)\s*[:{]/g,
  ];

  const functions: string[] = [];
  for (const pattern of functionPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const name = match[1];
      if (name && !['if', 'else', 'for', 'while', 'switch', 'catch', 'return', 'new', 'import', 'from', 'require'].includes(name)) {
        functions.push(name);
      }
    }
  }
  if (functions.length > 0) result.functions = Array.from(new Set(functions)).slice(0, 15);

  const classPattern = /(?:class|interface|struct|enum|type)\s+([a-zA-Z0-9_]+)/g;
  const classes: string[] = [];
  let match;
  while ((match = classPattern.exec(content)) !== null) {
    if (match[1]) classes.push(match[1]);
  }
  if (classes.length > 0) result.classes = Array.from(new Set(classes)).slice(0, 10);

  const importPatterns = [
    /import\s+.*?from\s+['"]([^'"]+)['"]/g,
    /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /from\s+([a-zA-Z0-9_.]+)\s+import/g,
  ];

  const imports: string[] = [];
  for (const pattern of importPatterns) {
    let m;
    while ((m = pattern.exec(content)) !== null) {
      if (m[1]) imports.push(m[1]);
    }
  }
  if (imports.length > 0) result.imports = Array.from(new Set(imports)).slice(0, 20);

  return result;
}
