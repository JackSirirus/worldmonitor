#!/usr/bin/env node
/**
 * Batch i18n migration script
 * Replaces hardcoded strings with t() function calls
 */

const fs = require('fs');
const path = require('path');

// Component files to update
const COMPONENT_FILES = [
  'src/components/Panel.ts',
  'src/components/NewsPanel.ts',
  'src/components/StatusPanel.ts',
  'src/components/PlaybackControl.ts',
  'src/components/SearchModal.ts',
  'src/components/SignalModal.ts',
  'src/components/StoryModal.ts',
  'src/components/CountryIntelModal.ts',
  'src/components/MobileWarningModal.ts',
  'src/components/CIIPanel.ts',
  'src/components/CascadePanel.ts',
  'src/components/PredictionPanel.ts',
  src/components/MonitorPanel.ts',
  'src/components/StrategicRiskPanel.ts',
  'src/components/StrategicPosturePanel.ts',
  'src/components/InsightsPanel.ts',
  'src/components/GdeltIntelPanel.ts',
  'src/components/LiveNewsPanel.ts',
  'src/components/TechEventsPanel.ts',
  src/components/ServiceStatusPanel.ts',
  'src/components/TechHubsPanel.ts',
  'src/components/TechReadinessPanel.ts',
  'src/components/MacroSignalsPanel.ts',
  'src/components/ETFFlowsPanel.ts',
  'src/components/StablecoinPanel.ts',
  'src/components/SatelliteFiresPanel.ts',
];

// String replacement patterns
const REPLACEMENTS = [
  // Common strings
  { pattern: /"Loading"/g, replacement: 'ui.loading()' },
  { pattern: /'Failed to load data'/g, replacement: 'ui.failed()' },
  { pattern: /'No data available'/g, replacement: 'ui.noData()' },
  { pattern: /'No news available'/g, replacement: 'ui.noData()' },
  { pattern: /'LIVE'/g, replacement: 'ui.live()' },

  // Panel strings
  { pattern: /"Drag to resize \(double-click to reset\)"/g, replacement: 'panel.resizeTooltip()' },
  { pattern: /'Show methodology info'/g, replacement: 'panel.showMethodology()' },

  // Status strings
  { pattern: /"System Status"/g, replacement: 'status.systemStatus()' },
  { pattern: /"System Health"/g, replacement: 'status.systemHealth()' },
  { pattern: /"Data Feeds"/g, replacement: 'status.dataFeeds()' },
  { pattern: /"API Status"/g, replacement: 'status.apiStatus()' },
  { pattern: /"Storage"/g, replacement: 'status.storage()' },
  { pattern: /"Updated just now"/g, replacement: 'status.updatedJustNow()' },

  // Playback strings
  { pattern: /"Toggle Playback Mode"/g, replacement: 'playback.toggleMode()' },
  { pattern: /"Historical Playback"/g, replacement: 'playback.historicalPlayback()' },

  // Search strings
  { pattern: /"Search\.\.\."/g, replacement: 'ui.searchPlaceholder()' },
  { pattern: /'No results found'/g, replacement: 'ui.noResults()' },

  // Modal strings
  { pattern: /"Close"/g, replacement: 'ui.close()' },
  { pattern: /'Cancel"/g, replacement: 'ui.cancel()' },
  { pattern: /'Save"/g, replacement: 'ui.save()' },

  // News-specific strings
  { pattern: /'No news available'/g, replacement: 'news.noData()' },
  { pattern: /'Failed to cluster news'/g, replacement: 'news.failedToCluster()' },
  { pattern: /'Summarize this panel'/g, replacement: 'panel.summarize()' },
  { pattern: /'Generating summary\.\.\."/g, replacement: 'panel.generating()' },
];

function replaceInFile(filePath, replacements) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    replacements.forEach(({ pattern, replacement }) => {
      const regex = new RegExp(pattern, 'g');
      if (regex.test(content)) {
        content = content.replace(regex, replacement);
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

function migrateComponent(componentFile) {
  console.log(`Processing: ${componentFile}`);
  const content = fs.readFileSync(componentFile, 'utf8');

  // Check if already imports i18n
  if (!content.includes("from '@/i18n")) {
    // Add i18n import at top
    content = "import { ui } from '@/i18n';\n" + content;
  }

  // Add i18n-helper helper import
  if (!content.includes("from '@/i18n-helper'")) {
    content = "import { t } from '@/i18n-helper';\n" + content;
  }

  fs.writeFileSync(componentFile, content, 'utf8');
  console.log(`  ✓ Updated ${componentFile}`);
}

function main() {
  console.log('Starting i18n batch migration...');

  let successCount = 0;
  let failureCount = 0;

  COMPONENT_FILES.forEach(file => {
    const updated = replaceInFile(file, REPLACEMENTS);
    if (updated) {
      successCount++;
    } else {
      failureCount++;
    }
  });

  console.log(`\nSummary:`);
  console.log(`  ✓ Successfully updated: ${successCount} files`);
  console.log(`  `Failed: ${failureCount} files`);
}

main();
