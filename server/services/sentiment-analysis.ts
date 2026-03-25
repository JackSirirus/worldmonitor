/**
 * Sentiment Analysis Service
 * Analyzes news sentiment based on keyword matching
 */

const NEGATIVE_WORDS = new Set([
  'war', 'attack', 'killed', 'death', 'dead', 'crisis', 'crash', 'collapse',
  'threat', 'danger', 'escalate', 'escalation', 'conflict', 'strike', 'bomb',
  'explosion', 'casualties', 'disaster', 'emergency', 'catastrophe', 'fail',
  'failure', 'reject', 'rejected', 'sanctions', 'invasion', 'missile', 'nuclear',
  'terror', 'terrorist', 'hostage', 'assassination', 'coup', 'protest', 'riot',
  'warns', 'warning', 'fears', 'concern', 'worried', 'plunge', 'plummet', 'surge',
  'flee', 'evacuate', 'shutdown', 'layoff', 'layoffs', 'cuts', 'slump', 'recession',
]);

const POSITIVE_WORDS = new Set([
  'peace', 'deal', 'agreement', 'breakthrough', 'success', 'win', 'gains',
  'recovery', 'growth', 'rise', 'boost', 'rally', 'soar', 'jump',
  'ceasefire', 'treaty', 'alliance', 'partnership', 'cooperation', 'progress',
  'release', 'released', 'freed', 'rescue', 'saved', 'approved', 'passes',
  'record', 'milestone', 'historic', 'landmark', 'celebrates', 'victory',
]);

export type SentimentLabel = 'negative' | 'neutral' | 'positive';

export interface SentimentResult {
  sentiment: SentimentLabel;
  score: number;
}

/**
 * Analyze sentiment of text
 */
export function analyzeSentiment(text: string): SentimentResult {
  const words = text.toLowerCase().split(/\W+/);
  let score = 0;

  for (const word of words) {
    if (NEGATIVE_WORDS.has(word)) score -= 1;
    if (POSITIVE_WORDS.has(word)) score += 1;
  }

  const sentiment: SentimentLabel = score < -1 ? 'negative' : score > 1 ? 'positive' : 'neutral';
  return { sentiment, score };
}

export default { analyzeSentiment };
