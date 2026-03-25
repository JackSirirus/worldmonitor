/**
 * Fact Checking Agent
 * Verifies claims against multiple sources
 */

import { Agent } from './agent-base.js';
import { query } from '../database/connection.js';
import { webSearch } from './web-search.js';

export interface FactCheckResult {
  claim: string;
  verdict: 'true' | 'false' | 'unverified' | 'partially_true';
  confidence: number;
  sources: Array<{
    title: string;
    url: string;
    supports: boolean;
  }>;
  explanation: string;
}

/**
 * Fact Checking Agent
 */
export class FactCheckAgent extends Agent {
  constructor() {
    super({
      name: 'fact-check',
      description: 'Verifies claims against multiple sources',
      timeout: 180000,
    });
  }

  protected async execute(input?: unknown): Promise<unknown> {
    if (!input || typeof input !== 'object' || !('claim' in input)) {
      throw new Error('Claim is required');
    }

    const claim = (input as { claim: string }).claim;
    this.reportProgress(10, `Checking claim: ${claim}`);

    // Search for supporting/opposing sources
    this.reportProgress(30, 'Searching for sources...');
    const sources = await this.findSources(claim);
    this.reportProgress(60, `Found ${sources.length} sources`);

    // Analyze and make verdict
    this.reportProgress(80, 'Analyzing sources...');
    const result = await this.analyzeClaim(claim, sources);

    this.reportProgress(100, 'Fact check complete');

    return result;
  }

  /**
   * Find sources that support or oppose the claim
   */
  private async findSources(claim: string): Promise<Array<{
    title: string;
    url: string;
    snippet: string;
  }>> {
    // Extract key terms from claim
    const terms = this.extractKeyTerms(claim);

    // Search local database
    const localResults = await this.searchLocal(terms);

    // Search web
    const webResults = await webSearch(claim, 10);

    return [...localResults, ...webResults];
  }

  /**
   * Extract key terms from claim
   */
  private extractKeyTerms(claim: string): string[] {
    const stopWords = new Set([
      'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on',
      'at', 'to', 'for', 'of', 'with', 'by', 'from', 'that',
      'this', 'these', 'those', 'it', 'its', 'they', 'their'
    ]);

    return claim
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word))
      .slice(0, 10);
  }

  /**
   * Search local database
   */
  private async searchLocal(terms: string[]): Promise<Array<{
    title: string;
    url: string;
    snippet: string;
  }>> {
    if (terms.length === 0) return [];

    const conditions = terms.map((_, i) => `title ILIKE $${i + 1}`).join(' OR ');
    const params = terms.map(t => `%${t}%`);

    const result = await query<{
      title: string;
      link: string;
      description: string | null;
    }>(`
      SELECT title, link, description
      FROM rss_items
      WHERE ${conditions}
      AND pub_date > NOW() - INTERVAL '90 days'
      ORDER BY pub_date DESC
      LIMIT 10
    `, params);

    return result.rows.map(row => ({
      title: row.title,
      url: row.link,
      snippet: row.description || row.title,
    }));
  }

  /**
   * Analyze claim and make verdict
   */
  private async analyzeClaim(
    claim: string,
    sources: Array<{ title: string; url: string; snippet: string }>
  ): Promise<FactCheckResult> {
    const sourceTexts = sources.map(s => `- ${s.title}: ${s.snippet}`).join('\n');

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: `You are a fact-checker. Analyze the claim and sources, then provide:
1. Verdict: "true", "false", "partially_true", or "unverified"
2. Confidence: 0-100
3. Brief explanation

Respond in JSON format:
{"verdict": "...", "confidence": ..., "explanation": "..."}`
            },
            {
              role: 'user',
              content: `Claim: "${claim}"\n\nSources:\n${sourceTexts}`
            }
          ],
          temperature: 0.2,
        }),
      });

      const data = await response.json();
      const analysisText = data.choices?.[0]?.message?.content || '{}';

      let analysis;
      try {
        analysis = JSON.parse(analysisText);
      } catch {
        analysis = { verdict: 'unverified', confidence: 50, explanation: analysisText };
      }

      return {
        claim,
        verdict: analysis.verdict || 'unverified',
        confidence: analysis.confidence || 50,
        explanation: analysis.explanation || 'Unable to verify',
        sources: sources.slice(0, 5).map(s => ({
          title: s.title,
          url: s.url,
          supports: true, // Simplified
        })),
      };
    } catch (error) {
      console.error('[FactCheck] Error:', error);
      return {
        claim,
        verdict: 'unverified',
        confidence: 0,
        explanation: 'Fact check failed',
        sources: [],
      };
    }
  }
}

export default FactCheckAgent;
