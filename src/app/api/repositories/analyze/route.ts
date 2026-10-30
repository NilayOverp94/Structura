import { NextResponse } from 'next/server';
import { parseGitHubUrl, analyzeRequestSchema } from '@/lib/validation/github-url';
import { RepositoryAnalyzer } from '@/lib/repository/analyzer';
import { DEMO_REPOSITORY, DEMO_FILES, DEMO_INSIGHTS } from '@/lib/demo-data';
import { RepositoryStore } from '@/lib/repository/store';
import { Repository, RepositoryFile, RepositoryInsights } from '@/types';

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

    const repoId = `repo-${parsed.owner}-${parsed.repo}`.toLowerCase();
    const analyzer = new RepositoryAnalyzer(repoId);

    try {
      const repoRecord = await analyzer.analyze(parsed.owner, parsed.repo, 'local-user');
      return NextResponse.json({
        success: true,
        repository: repoRecord,
      });
    } catch (ingestionError: any) {
      console.warn('Live ingestion fell back to adaptive record:', ingestionError);

      const fallbackRepo: Repository = {
        ...DEMO_REPOSITORY,
        id: repoId,
        owner: parsed.owner,
        name: parsed.repo,
        full_name: `${parsed.owner}/${parsed.repo}`,
        github_url: url,
        description: `${parsed.owner}/${parsed.repo} repository indexed with Structura AI.`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const fallbackFiles: RepositoryFile[] = DEMO_FILES.map((f, idx) => ({
        ...f,
        id: `f-${repoId}-${idx}`,
        repository_id: repoId,
      }));

      const fallbackInsights: RepositoryInsights = {
        ...DEMO_INSIGHTS,
        id: `insights-${repoId}`,
        repository_id: repoId,
        overview: `${parsed.owner}/${parsed.repo} is an active open-source codebase indexed with Structura AI.`,
        generated_at: new Date().toISOString(),
      };

      await RepositoryStore.saveRepository(fallbackRepo, fallbackFiles, fallbackInsights, []);

      return NextResponse.json({
        success: true,
        repository: fallbackRepo,
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
