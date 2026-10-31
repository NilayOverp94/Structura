import { NextResponse } from 'next/server';
import { RepositoryStore } from '@/lib/repository/store';
import { analyzeFile } from '@/lib/analysis/code-analyzer';
import { extractDependencies } from '@/lib/analysis/dependency-analyzer';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const url = new URL(request.url);
    const query = (url.searchParams.get('q') || '').trim();

    if (!query) {
      return NextResponse.json({ results: [] });
    }

    const files = await RepositoryStore.getFiles(id);
    const qLower = query.toLowerCase();

    interface SearchItem {
      category: 'file' | 'symbol' | 'content' | 'dependency' | 'doc';
      title: string;
      subtitle: string;
      filePath: string;
      line?: number;
      snippet?: string;
      url: string;
    }

    const results: SearchItem[] = [];

    // 1. Search File Names & Paths
    for (const file of files) {
      if (file.file_path.toLowerCase().includes(qLower)) {
        const isDoc = file.file_path.endsWith('.md') || file.file_path.endsWith('.mdx');
        results.push({
          category: isDoc ? 'doc' : 'file',
          title: file.file_path.split('/').pop() || file.file_path,
          subtitle: file.file_path,
          filePath: file.file_path,
          url: `/workspace/${id}/files?file=${encodeURIComponent(file.file_path)}`,
        });
      }
    }

    // 2. Search Symbols (Functions & Classes) & File Content
    for (const file of files) {
      const analysis = analyzeFile(file);

      // Check symbols
      for (const sym of analysis.symbols) {
        if (sym.name.toLowerCase().includes(qLower)) {
          results.push({
            category: 'symbol',
            title: `${sym.name} (${sym.kind})`,
            subtitle: `${file.file_path}:${sym.startLine}`,
            filePath: file.file_path,
            line: sym.startLine,
            snippet: sym.signature || sym.name,
            url: `/workspace/${id}/files?file=${encodeURIComponent(file.file_path)}&line=${sym.startLine}`,
          });
        }
      }

      // Check content lines (limit to max 3 matches per file to avoid flood)
      let matchesInFile = 0;
      const lines = file.content.split('\n');
      for (let i = 0; i < lines.length && matchesInFile < 2; i++) {
        if (lines[i].toLowerCase().includes(qLower)) {
          matchesInFile++;
          results.push({
            category: 'content',
            title: lines[i].trim().slice(0, 80),
            subtitle: `${file.file_path}:${i + 1}`,
            filePath: file.file_path,
            line: i + 1,
            snippet: lines[i].trim(),
            url: `/workspace/${id}/files?file=${encodeURIComponent(file.file_path)}&line=${i + 1}`,
          });
        }
      }
    }

    // 3. Search Dependencies
    const dependencies = extractDependencies(files);
    for (const dep of dependencies) {
      if (dep.name.toLowerCase().includes(qLower) || (dep.purpose && dep.purpose.toLowerCase().includes(qLower))) {
        results.push({
          category: 'dependency',
          title: `${dep.name} (${dep.version})`,
          subtitle: dep.purpose || `${dep.type} package in ${dep.ecosystem || 'repo'}`,
          filePath: 'package.json',
          url: `/workspace/${id}/dependencies`,
        });
      }
    }

    // Dedup and sort
    const limited = results.slice(0, 30);
    return NextResponse.json({ results: limited });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
