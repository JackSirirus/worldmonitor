/**
 * Deep Thinking Agent
 * Performs in-depth analysis on complex topics
 */

import { Agent } from './agent-base.js';
import { query } from '../database/connection.js';

export interface DeepAnalysis {
  topic: string;
  summary: string;
  keyFindings: string[];
  implications: string[];
  relatedTopics: string[];
  confidence: number;
}

/**
 * Deep Thinking Agent
 */
export class DeepThinkingAgent extends Agent {
  constructor() {
    super({
      name: 'deep-thinking',
      description: 'Performs in-depth analysis on complex topics',
      timeout: 600000, // 10 minutes
    });
  }

  protected async execute(input?: unknown): Promise<unknown> {
    if (!input || typeof input !== 'object' || !('topic' in input)) {
      throw new Error('Topic is required');
    }

    const topic = (input as { topic: string }).topic;
    this.reportProgress(10, `Analyzing: ${topic}`);

    // Collect related news
    this.reportProgress(30, 'Collecting related news...');
    const relatedNews = await this.collectRelatedNews(topic);
    this.reportProgress(50, `Found ${relatedNews.length} related articles`);

    // Perform analysis
    this.reportProgress(70, 'Performing deep analysis...');
    const analysis = await this.performAnalysis(topic, relatedNews);

    this.reportProgress(100, 'Analysis complete');

    return analysis;
  }

  /**
   * Collect related news
   */
  private async collectRelatedNews(topic: string): Promise<Array<{
    title: string;
    description: string | null;
    pub_date: Date | null;
    source_url: string;
  }>> {
    const keywords = topic.split(' ').filter(w => w.length > 2).slice(0, 5);

    if (keywords.length === 0) return [];

    const conditions = keywords.map((_, i) => `(title ILIKE $${i + 1} OR description ILIKE $${i + 1})`).join(' OR ');
    const params = keywords.map(k => `%${k}%`);

    const result = await query<{
      title: string;
      description: string | null;
      pub_date: Date | null;
      source_url: string;
    }>(`
      SELECT title, description, pub_date, source_url
      FROM rss_items
      WHERE ${conditions}
      AND pub_date > NOW() - INTERVAL '30 days'
      ORDER BY pub_date DESC
      LIMIT 50
    `, params);

    return result.rows;
  }

  /**
   * Perform deep analysis
   */
  private async performAnalysis(topic: string, news: Array<{ title: string; description: string | null }>): Promise<DeepAnalysis> {
    const content = news.map(n => `${n.title}\n${n.description || ''}`).join('\n\n');

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `You are an expert analyst specializing in geopolitical and strategic analysis.
Analyze the provided news articles about "${topic}" and provide:
1. A brief summary (2-3 sentences)
2. 3-5 key findings
3. 3-5 strategic implications
4. 3-5 related topics to monitor
5. A confidence score (0-100)

Be analytical and focus on strategic implications.`
            },
            {
              role: 'user',
              content: `Analyze these articles about "${topic}":\n\n${content}`
            }
          ],
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error('AI API error');
      }

      const data = await response.json();
      const analysisText = data.choices?.[0]?.message?.content || '';

      return this.parseAnalysis(topic, analysisText);
    } catch (error) {
      console.error('[DeepThinking] Analysis error:', error);
      return {
        topic,
        summary: `Analysis of ${news.length} articles about ${topic}`,
        keyFindings: ['Unable to generate detailed findings'],
        implications: ['Monitor developments closely'],
        relatedTopics: [],
        confidence: 30,
      };
    }
  }

  /**
   * Parse AI response into structured format
   */
  private parseAnalysis(topic: string, text: string): DeepAnalysis {
    const lines = text.split('\n').filter(l => l.trim());

    return {
      topic,
      summary: lines.slice(0, 2).join(' ').slice(0, 200),
      keyFindings: lines.filter(l => l.match(/^[-*•]\s*(key finding|finding)/i)).slice(0, 5).map(l => l.replace(/^[-*•]\s*/, '')),
      implications: lines.filter(l => l.match(/^[-*•]\s*(implication|strategic)/i)).slice(0, 5).map(l => l.replace(/^[-*•]\s*/, '')),
      relatedTopics: lines.filter(l => l.match(/^[-*•]\s*(related|monitor)/i)).slice(0, 5).map(l => l.replace(/^[-*•]\s*/, '')),
      confidence: 75,
    };
  }
}

export default DeepThinkingAgent;
