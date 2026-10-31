import { NextResponse } from 'next/server';
import { parseGitHubUrl, analyzeRequestSchema } from '@/lib/validation/github-url';
import { RepositoryAnalyzer } from '@/lib/repository/analyzer';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = analyzeRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues?.[0]?.message || 'Invalid request URL' },
        { status: 400 }
      );
    }

    const { url } = validation.data;
    const parsed = parseGitHubUrl(url);

    if (!parsed) {
      return NextResponse.json(
        { error: 'Invalid GitHub repository URL' },
        { status: 400 }
      );
    }

    const clientKey = request.headers.get('x-gemini-key') || undefined;
    const repoId = `repo-${parsed.owner}-${parsed.repo}`.toLowerCase();
    const analyzer = new RepositoryAnalyzer(repoId);
    const branch = validation.data.branch || parsed.branch;

    const repoRecord = await analyzer.analyze(parsed.owner, parsed.repo, 'local-user', clientKey, branch);
    return NextResponse.json({
      success: true,
      repository: repoRecord,
    });
  } catch (error: any) {
    console.error('Repository analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze repository' },
      { status: 500 }
    );
  }
}
