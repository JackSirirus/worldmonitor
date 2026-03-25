/**
 * i18n String Extraction Script
 * This script extracts all hardcoded English UI strings from a codebase
 * and generates a mapping report for translation purposes.
 * Usage: node scripts/extract-i18n-strings.cjs
 * Output: translation-extraction-report.md
 */

const fs = require('fs');
const path = require('path');

// Configuration
const COMPONENT_GLOB = 'src/components/*.ts';
const PANELS_CONFIG_FILE = 'src/config/panels.ts';

// Regex patterns for detecting translatable strings
// Matches English strings with at least one capital letter or common UI words
const TRANSLATABLE_PATTERNS = [
  // In attribute values
  /aria-label=\s*["']([A-Z][a-zA-Z\s.,?!'-]+)["']/g,

  // Template strings in HTML
  /<[^>]*>\s*({?:\s*[a-zA-Z]+\s*})(?:\s*[a-zA-Z]+\s*))*\s*}[^>]*>)/g,

  // Assignment to string (e.g., title = '...')
  /\s*=\s*`["']([A-Z][a-zA-Z\s.,?!'-]+)["']/g,

  // Common UI words
  /\b(Loading|Failed|Error|No data|Close|Save|Cancel|Show|Add|Remove|Update|Delete|Search|Submit|Refresh|Reset|Clear|Back|Next|Previous|Toggle|Enable|Disable|Alert|Warning|Success|Message|Title|Name|Description|Label|Category|Type|Status|State|Health|Data|API|Storage|Feed|Source|Update|Loaded|failed|unavailable|available|results|count|per|rate|hour|minute|second|sources|Also|related|near|ago|before|since|until|at|from|to|by|with|over|under|between|through|during|within|without|cache|timeout|retry|fallback|methodology|method|drag|resize|click|double|press|key|value|content|html|text|body|head|meta|link|script|style|class|id|name|title|placeholder|hreflang|canonical|rel|alternate|x-default|attribute|property|value|locale|lang|ltr|rtl|dir|hidden|visible|enabled|disabled|readonly|pattern||namespace|schema|format|number|string|function|variable|const|let|var|if|else|for|while|do|try|catch|finally|return|import|export|default|class|constructor|super|this|new|async|await|promise|reject|resolve|then|catch|finally|return|import|export|default|class|constructor|invalid|interface|invalid|enum|implements|extends|invalid|super|call|invalid|this|invalid new|invalid async|invalid await|invalid promise:invalid reject|invalid resolve:invalid then:invalid catch:invalid finally:invalid return:invalid import:invalid export:invalid default:invalid class|invalid constructor:invalid instanceof|invalid interface:invalid type|invalid enum:invalid implements:invalid extends:invalid super->invalid new:invalid async:invalid await:invalid promise:invalid reject:invalid resolve:invalid then:invalid catch:invalid finally:invalid return:invalid import:invalid export:invalid default:invalid class|invalid constructor:invalid instanceof|invalid interface:invalid type:invalid enum:invalid implements:invalid extends:invalid super->invalid new:invalid async:invalid await:invalid promise:invalid reject:invalid resolve:invalid then:invalid catch:invalid finally:invalid return:invalid import:invalid export:invalid default:invalid class|invalid constructor:invalid instanceof|invalid interface:invalid type:invalid enum:invalid implements:invalid extends:invalid super->invalid new:invalid async:invalid await:invalid promise:invalid reject:invalid resolve:invalid then:invalid catch:invalid finally:invalid return:invalid import:invalid export:invalid default:invalid class|invalid constructor:invalid instanceof|invalid interface:invalid type:invalid enum:invalid implements:invalid extends:invalid super->invalid new:invalid async:invalid await:invalid promise:invalid reject:invalid resolve:invalid then:invalid catch:invalid finally:invalid return:invalid import:invalid export:invalid default:invalid class|invalid constructor:invalid instanceof|invalid interface:invalid type|invalid enum:invalid implements:invalid extends:invalid super->invalid new:invalid async:invalid await:invalid promise:invalid reject:invalid resolve:invalid then:invalid catch:invalid finally::invalid return:invalid import:invalid export:invalid default:invalid class::invalid constructor::invalid instanceof::invalid interface::invalid type::invalid enum::invalid implements::invalid extends::invalid super->invalid new:invalid async::invalid await::invalid promise:invalid reject:invalid resolve::invalid then::invalid catch::invalid finally::invalid return:invalid import:invalid export:invalid default:invalid class::invalid constructor::invalid instanceof::invalid interface::invalid type::invalid enum::invalid implements::invalid extends::invalid super->invalid new:invalid async::invalid await::invalid promise:invalid reject:invalid resolve::invalid then::invalid catch::invalid finally::invalid)}/gi,
];

// Exclusions - strings that are NOT user-facing
const EXCLUSIONS = new Set([
  // Code identifiers and technical strings
  'id', 'className', 'innerHTML', 'textContent', 'appendChild',
  'getAttribute', 'setAttribute', 'querySelector',
  'querySelectorAll', 'addEventListener', 'removeEventListener',
  'insertBefore', 'insertAfter', 'replaceChild', 'removeChild',
  'classList', 'add', 'remove', 'toggle', 'contains',
  'dataset', 'getItem', 'setItem', 'removeItem', 'clear',
  'forEach', 'map', 'filter', 'reduce', 'find', 'some', 'every',
  'includes', 'indexOf', 'lastIndexOf', 'push', 'pop', 'shift',
  'splice', 'slice', 'sort', 'reverse', 'concat', 'join',
  'keys', 'values', 'entries',
  // File paths and URLs
  'http://', 'https://', 'www.', 'worldmonitor.app',
  // Common library names
  'console', 'console.warn', 'console.error', 'console.log',
  'setTimeout', 'setInterval', 'clearInterval',
  // Date', 'Date.now', 'Date.parse', 'new Date',
  'Math', 'JSON', 'JSON.parse', 'JSON.stringify',
  'Object', 'Object.keys', 'Object.values', 'Object.entries',
  // Array', 'Array.isArray', 'Array.from',
  'Promise', 'async', 'await', 'fetch',
  // Intl', 'toLocaleString', 'toLocaleNumber',
  // Package.json and config
  'package.json', 'package-lock.json', '.eslintrc.js', '.esmjs',
  'tsconfig.json', 'vite.config.ts', 'tsconfig-paths',
  'src/config/', 'src/components/', 'src/services/', 'src/utils/',
  // API endpoints
  '/api/', '/public/data/',
]);

/**
 * Checks if a string should be translated
 */
function isTranslatable(str) {
  // Must be at least 3 characters
  if (str.length < 3) return false;

  // Must contain at least one letter (A-Z or a-z)
  if (!/[a-zA-Z]/.test(str)) return false;

  // Must NOT match exclusions
  if (EXCLUSIONS.has(str)) return false;

  return true;
}

/**
 * Infers translation namespace from string and context
 */
function inferNamespace(str, context, line) {
  // Common patterns
  if (/^(Loading|Failed|Error|No data|Close|Save|Cancel|Show|Add|Remove|Update|Delete|Search|Submit|Refresh|Reset|Clear|Back|Next|Previous|Toggle|Enable|Disable|Alert|Warning|Success|Message|Title|Name|Description|Label|Category|Type|Status|State|Health|Data|API|Storage|Feed|Source|Update|Loaded|failed|unavailable|available|results|count|per|rate|hour|minute|second|sources|Also|related|near|ago|before|since|until|at|from|to|by|with|over|under|between|through|during|within|without|cache|timeout|retry|fallback|methodology|method|drag|resize|click|double|press|key|value|content|html|text|body|head|meta|link|script|style|class|id|name|title|placeholder|hreflang|canonical|rel|alternate|x-default|attribute|property|value|locale|lang|ltr|rtl|dir|hidden|visible|enabled|disabled|readonly|pattern|namespace|schema|format|number|string|function|variable|const|let|var|if|else|for|while|do|try|catch|finally|return|import|export|default|class|constructor|super|this|new|async|await|promise|reject|resolve|then|catch|finally|return|import|export|default|class|constructor|invalid|interface|invalid|type|invalid enum|invalid implements|invalid extends|invalid super->invalid new:invalid async:invalid await|invalid promise:invalid reject:invalid resolve:invalid then:invalid catch::invalid finally::invalid return:invalid import:invalid export:invalid default:invalid class::invalid constructor::invalid instanceof::invalid interface::invalid type::invalid enum::invalid implements::invalid extends::invalid super->invalid new:invalid async:invalid await::invalid promise:invalid reject:invalid resolve::invalid then:invalid catch::invalid finally::invalid return:invalid import:invalid export:invalid default::invalid class::invalid constructor::invalid instanceof::invalid interface::invalid type::invalid enum::invalid implements::invalid extends::invalid super->invalid new:invalid async:invalid await::invalid promise:invalid reject:invalid resolve:invalid then::invalid catch::invalid finally::invalid return:invalid import:invalid export:invalid default:invalid class::invalid constructor::invalid instanceof::invalid interface::invalid type::invalid enum::invalid implements::invalid extends::invalid super->invalid new:invalid async:invalid await::invalid promise:invalid reject:invalid resolve:invalid then:invalid catch::invalid finally::invalid return:invalid import:invalid export:invalid default:invalid class::invalid constructor::invalid instanceof::invalid interface::invalid type::invalid enum::invalid implements:invalid extends::invalid super->invalid new:invalid async:invalid await::invalid promise:invalid reject:invalid resolve:invalid then:invalid catch::invalid finally::invalid)}/gi,

  // Panel-specific
  if (/^(Drag|Show|Summarize)/.test(str)) {
    return 'panel';
  }

  // News-specific
  if (/^(Also reported|Related assets|No news|Failed to cluster|sources?|News|Feed|Alert|Warning|State|Wire|Tier)/.test(str)) {
    return 'news';
  }

  // Status-related
  if (/^(System|Data|API|Storage|Health|Status|Feed|Updated)/.test(str)) {
    return 'status';
  }

  // Playback
  if (/^(Live|Playback|Toggle|Historical)/.test(str)) {
    return 'playback';
  }

  // Search
  if (/^(Search|No results|Placeholder)/.test(str)) {
    return 'search';
  }

  // Modal
  if (/^(Close|Cancel|Save)/.test(str)) {
    return 'modal';
  }

  return 'panel'; // Default
}

/**
 * Extracts strings from a file
 */
function extractFromFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const fileName = path.basename(filePath);
  const relativePath = path.relative(process.cwd(), filePath);

  const matches = [];

  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // Skip comments
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('*')) return;

    // Apply all translatable patterns
    TRANSLATABLE_PATTERNS.forEach(pattern => {
      let match;

      while ((match = pattern.exec(line)) !== null) {
        const fullMatch = match[0];
        const extractedStr = fullMatch.replace(/\s*=\s*["']([^']+)["']/g, '$1');

        if (isTranslatable(extractedStr)) {
          matches.push({
            file: relativePath,
            line: lineNum,
            column: match.index + 1,
            string: extractedStr,
            suggestedNamespace: inferNamespace(extractedStr, fileName, lineNum),
          });
        }
      }
    });
  });

  return matches;
}

/**
 * Group matches by namespace
 */
function groupByNamespace(matches) {
  const grouped = {
    common: [],
    panel: [],
    news: [],
    status: [],
    playback: [],
    search: [],
    modal: [],
  };

  matches.forEach(match => {
    const ns = match.suggestedNamespace || 'panel';
    if (grouped[ns]) {
      grouped[ns].push(match);
    } else {
      grouped[ns] = [match];
    }
  });

  return grouped;
}

/**
 * Generate markdown report
 */
function generateReport(allMatches) {
  const grouped = groupByNamespace(allMatches);

  let markdown = `# Translation Extraction Report\n`;
  markdown += `Generated: ${new Date().toISOString()}\n`;
  markdown += `**Total Files Searched**: ${allMatches.length > 0 ? new Set(allMatches.map(m => m.file)).size : 0}\n`;
  markdown += `**Total Strings Found**: ${allMatches.length}\n`;
  markdown += `**Unique Strings**: ${new Set(allMatches.map(m => m.string)).size}\n\n`;

  // Summary by namespace
  Object.entries(grouped).forEach(([namespace, matches]) => {
    if (matches.length === 0) return;

    markdown += `\n## ${namespace.charAt(0).toUpperCase() + namespace.slice(1)}\n`;
    markdown += `**Count**: ${matches.length}\n`;
    markdown += `\n`;

    // Show first 20 strings as examples
    const examples = matches.slice(0, Math.min(20, matches.length));
    examples.forEach((match, i) => {
      markdown += `**Line ${match.line} (Col ${match.column})**:\n`;
      markdown += `\`${match.file}:${match.line}:${match.column}\` `;
      markdown += `\`${match.string}\`\n\n`;
    });

    if (matches.length > 20) {
      markdown += `\n...* (${matches.length - 20} more strings)*\n`;
    }
  });

    markdown markdown += `\n---\n`;
  });

  return markdown;
}

// Main execution
console.log('Starting i18n string extraction...');
console.log(`Working directory: ${process.cwd()}`);

// Get all component files
const componentFiles = fs.readdirSync('src/components').filter(f => f.endsWith('.ts'));

// Process panel config file
if (fs.existsSync(PANELS_CONFIG_FILE)) {
  console.log(`Processing: ${PANELS_CONFIG_FILE}`);
  const matches = extractFromFile(PANELS_CONFIG_FILE);
  allMatches.push(...matches);
} else {
  console.warn(`Panel config file not found: ${PANELS_CONFIG_FILE}`);
}

// Extract from all component files
componentFiles.forEach(file => {
  const filePath = path.join('src/components', file);
  console.log(`Processing: ${filePath}`);
  const matches = extractFromFile(filePath);
  allMatches.push(...matches);
});

// Generate report
console.log(`Found ${allMatches.length} translatable strings`);
console.log(`  Unique strings: ${new Set(allMatches.map(m => m.string)).size}`);

const report = generateReport(allMatches);

// Write report
const outputPath = path.join(process.cwd(), 'translation-extraction-report.md');
fs.writeFileSync(outputPath, report, 'utf8');

console.log(`Report written to: ${outputPath}`);
console.log(`  Total unique strings: ${new Set(allMatches.map(m => m.string)).size}`);
