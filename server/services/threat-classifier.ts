/**
 * Threat Classification Service (Backend)
 * Keyword-based classification without AI API calls
 * Classifies news into threat level and category
 */

export type ThreatLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type EventCategory =
  | 'conflict' | 'protest' | 'disaster' | 'diplomatic' | 'economic'
  | 'terrorism' | 'cyber' | 'health' | 'environmental' | 'military'
  | 'crime' | 'infrastructure' | 'tech' | 'general';

export interface ThreatClassification {
  level: ThreatLevel;
  category: EventCategory;
}

// Keyword mappings
const CRITICAL_KEYWORDS: Record<string, EventCategory> = {
  'nuclear strike': 'military',
  'nuclear attack': 'military',
  'nuclear war': 'military',
  'invasion': 'conflict',
  'declaration of war': 'conflict',
  'martial law': 'military',
  'coup': 'military',
  'coup attempt': 'military',
  'genocide': 'conflict',
  'ethnic cleansing': 'conflict',
  'chemical attack': 'terrorism',
  'biological attack': 'terrorism',
  'dirty bomb': 'terrorism',
  'mass casualty': 'conflict',
  'pandemic declared': 'health',
  'health emergency': 'health',
  'nato article 5': 'military',
  'evacuation order': 'disaster',
  'meltdown': 'disaster',
  'nuclear meltdown': 'disaster',
};

const HIGH_KEYWORDS: Record<string, EventCategory> = {
  'war': 'conflict',
  'armed conflict': 'conflict',
  'airstrike': 'conflict',
  'air strike': 'conflict',
  'drone strike': 'conflict',
  'missile': 'military',
  'missile launch': 'military',
  'troops deployed': 'military',
  'military escalation': 'military',
  'bombing': 'conflict',
  'casualties': 'conflict',
  'hostage': 'terrorism',
  'terrorist': 'terrorism',
  'terror attack': 'terrorism',
  'assassination': 'crime',
  'cyber attack': 'cyber',
  'ransomware': 'cyber',
  'data breach': 'cyber',
  'sanctions': 'economic',
  'embargo': 'economic',
  'earthquake': 'disaster',
  'tsunami': 'disaster',
  'hurricane': 'disaster',
  'typhoon': 'disaster',
};

const MEDIUM_KEYWORDS: Record<string, EventCategory> = {
  'protest': 'protest',
  'protests': 'protest',
  'riot': 'protest',
  'riots': 'protest',
  'unrest': 'protest',
  'demonstration': 'protest',
  'strike action': 'protest',
  'military exercise': 'military',
  'naval exercise': 'military',
  'arms deal': 'military',
  'weapons sale': 'military',
  'diplomatic crisis': 'diplomatic',
  'ambassador recalled': 'diplomatic',
  'expel diplomats': 'diplomatic',
  'trade war': 'economic',
  'tariff': 'economic',
  'recession': 'economic',
  'inflation': 'economic',
  'market crash': 'economic',
  'flood': 'disaster',
  'flooding': 'disaster',
  'wildfire': 'disaster',
  'volcano': 'disaster',
  'eruption': 'disaster',
  'outbreak': 'health',
  'epidemic': 'health',
  'infection spread': 'health',
  'oil spill': 'environmental',
  'pipeline explosion': 'infrastructure',
  'blackout': 'infrastructure',
  'power outage': 'infrastructure',
  'internet outage': 'infrastructure',
  'derailment': 'infrastructure',
};

const LOW_KEYWORDS: Record<string, EventCategory> = {
  'election': 'diplomatic',
  'vote': 'diplomatic',
  'referendum': 'diplomatic',
  'summit': 'diplomatic',
  'treaty': 'diplomatic',
  'agreement': 'diplomatic',
  'negotiation': 'diplomatic',
  'talks': 'diplomatic',
  'peacekeeping': 'diplomatic',
  'humanitarian aid': 'diplomatic',
  'ceasefire': 'diplomatic',
  'peace treaty': 'diplomatic',
  'climate change': 'environmental',
  'emissions': 'environmental',
  'pollution': 'environmental',
  'deforestation': 'environmental',
  'drought': 'environmental',
  'vaccine': 'health',
  'vaccination': 'health',
  'disease': 'health',
  'virus': 'health',
  'public health': 'health',
  'covid': 'health',
  'coronavirus': 'health',
};

// Exclusion keywords - classify as 'info'
const EXCLUSIONS = [
  'advertisement', 'sponsored', 'promoted',
  'cryptocurrency price', 'bitcoin price', 'stock price',
  'weather forecast', 'sports score', 'entertainment',
  'celebrity', 'gossip', 'horoscope',
];

/**
 * Classify news headline using keyword matching (no AI needed)
 */
export function classifyByKeyword(title: string): ThreatClassification {
  const lower = title.toLowerCase();

  // Check exclusions
  if (EXCLUSIONS.some(ex => lower.includes(ex))) {
    return { level: 'info', category: 'general' };
  }

  // Priority cascade: critical → high → medium → low → info
  for (const [kw, cat] of Object.entries(CRITICAL_KEYWORDS)) {
    if (lower.includes(kw)) {
      return { level: 'critical', category: cat };
    }
  }

  for (const [kw, cat] of Object.entries(HIGH_KEYWORDS)) {
    if (lower.includes(kw)) {
      return { level: 'high', category: cat };
    }
  }

  for (const [kw, cat] of Object.entries(MEDIUM_KEYWORDS)) {
    if (lower.includes(kw)) {
      return { level: 'medium', category: cat };
    }
  }

  for (const [kw, cat] of Object.entries(LOW_KEYWORDS)) {
    if (lower.includes(kw)) {
      return { level: 'low', category: cat };
    }
  }

  // Default: info / general
  return { level: 'info', category: 'general' };
}

export default { classifyByKeyword };
