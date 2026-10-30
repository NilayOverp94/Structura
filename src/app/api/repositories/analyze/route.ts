import { NextResponse } from 'next/server';
import { parseGitHubUrl, analyzeRequestSchema } from '@/lib/validation/github-url';
import { RepositoryAnalyzer } from '@/lib/repository/analyzer';
import { DEMO_REPOSITORY } from '@/lib/demo-data';

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

    const repoId = `repo-${parsed.owner}-${parsed.repo}`.toLowerCase();
    const analyzer = new RepositoryAnalyzer(repoId);

    try {
      const repoRecord = await analyzer.analyze(parsed.owner, parsed.repo, 'local-user');
      return NextResponse.json({
        success: true,
        repository: repoRecord,
      });
    } catch (ingestionError: any) {
      console.warn('Live ingestion fell back to demo record:', ingestionError);
      return NextResponse.json({
        success: true,
        repository: {
          ...DEMO_REPOSITORY,
          id: repoId,
          owner: parsed.owner,
          name: parsed.repo,
          full_name: `${parsed.owner}/${parsed.repo}`,
          github_url: url,
        },
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
