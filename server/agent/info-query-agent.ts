/**
 * Information Query Agent
 * Answers questions by searching news database
 */

import { Agent } from './agent-base.js';
import { query } from '../database/connection.js';
import { webSearch } from './web-search.js';

export interface QueryResult {
  answer: string;
  sources: Array<{
    title: string;
    url: string;
    pub_date: Date | null;
    relevance: number;
  }>;
}

/**
 * Information Query Agent
 */
export class InfoQueryAgent extends Agent {
  constructor() {
    super({
      name: 'info-query',
      description: 'Answers questions by searching news database',
      timeout: 120000,
    });
  }

  protected async execute(input?: unknown): Promise<unknown> {
    if (!input || typeof input !== 'object' || !('question' in input)) {
      throw new Error('Question is required');
    }

    const question = (input as { question: string }).question;
    this.reportProgress(10, `Processing question: ${question}`);

    // Search local database
    this.reportProgress(30, 'Searching local database...');
    const localResults = await this.searchDatabase(question);
    this.reportProgress(50, `Found ${localResults.length} local results`);

    // If not enough results, search web
    let webResults: Array<{ title: string; url: string; snippet: string }> = [];
    if (localResults.length < 3) {
      this.reportProgress(60, 'Searching web for more information...');
      webResults = await webSearch(question, 5);
    }

    // Generate answer
    this.reportProgress(80, 'Generating answer...');
    const answer = await this.generateAnswer(question, localResults, webResults);

    this.reportProgress(100, 'Answer generated');

    return {
      question,
      answer,
      sources: localResults.map(r => ({
        title: r.title,
        url: r.link,
        pub_date: r.pub_date,
        relevance: r.relevance,
      })),
    };
  }

  /**
   * Search local database
   */
  private async searchDatabase(question: string): Promise<Array<{
    title: string;
    link: string;
    pub_date: Date | null;
    relevance: number;
  }>> {
    // Extract keywords from question
    const keywords = this.extractKeywords(question);

    if (keywords.length === 0) {
      return [];
    }

    // Build search query
    const conditions = keywords.map((_, i) => `(title ILIKE $${i + 1} OR description ILIKE $${i + 1})`).join(' OR ');
    const params = keywords.map(k => `%${k}%`);

    const result = await query<{
      title: string;
      link: string;
      pub_date: Date | null;
    }>(`
      SELECT title, link, pub_date
      FROM rss_items
      WHERE ${conditions}
      AND pub_date > NOW() - INTERVAL '30 days'
      ORDER BY pub_date DESC
      LIMIT 10
    `, params);

    return result.rows.map((row, index) => ({
      title: row.title,
      link: row.link,
      pub_date: row.pub_date,
      relevance: 1 - (index * 0.1), // Decreasing relevance
    }));
  }

  /**
   * Extract keywords from question
   */
  private extractKeywords(question: string): string[] {
    const stopWords = new Set([
      'what', 'who', 'where', 'when', 'why', 'how',
      'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will',
      'would', 'could', 'should', 'may', 'might', 'must',
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on',
      'at', 'to', 'for', 'of', 'with', 'by', 'from',
      'about', 'can', 'tell', 'give', 'show', 'find'
    ]);

    return question
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .slice(0, 5);
  }

  /**
   * Generate answer using AI
   */
  private async generateAnswer(
    question: string,
    localResults: Array<{ title: string; link: string }>,
    webResults: Array<{ title: string; url: string; snippet: string }>
  ): Promise<string> {
    const context = [
      ...localResults.map(r => `- ${r.title}`),
      ...webResults.map(r => `- ${r.title}: ${r.snippet}`),
    ].join('\n');

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
              content: 'You are a helpful assistant that answers questions based on provided context. Be concise and informative.'
            },
            {
              role: 'user',
              content: `Question: ${question}\n\nContext:\n${context}\n\nPlease provide a clear and informative answer based on the context above.`
            }
          ],
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error('AI API error');
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || 'Unable to generate answer';
    } catch (error) {
      console.error('[InfoQuery] AI error:', error);
      return `Found ${localResults.length} related articles. Please check sources for details.`;
    }
  }
}

export default InfoQueryAgent;
