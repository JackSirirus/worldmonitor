/**
 * WorldMonitor MCP Server
 *
 * Model Context Protocol server for natural language news querying.
 * Allows Claude Desktop and other MCP clients to query WorldMonitor news data.
 *
 * Usage:
 *   tsx server/mcp/index.ts
 *
 * Claude Desktop Configuration (~/.claude/settings.json):
 * {
 *   "mcpServers": {
 *     "worldmonitor": {
 *       "command": "tsx",
 *       "args": ["server/mcp/index.ts"],
 *       "cwd": "/path/to/worldmonitor"
 *     }
 *   }
 * }
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

// Import tools
import {
  getLatestNews,
  searchNews,
  getNewsClusters,
  getRecentReports,
  getNewsSources,
  getNewsCategories,
  getNewsByIdTool,
} from './tools/news-tools.js';

import {
  analyzeTrends,
  getSentimentBreakdown,
  comparePeriods,
  getThreatOverview,
} from './tools/analysis-tools.js';

import {
  generateReport,
  getReportContent,
  listReports,
} from './tools/report-tools.js';

// Initialize database connection for the MCP server
// The MCP server runs as a separate process, so we need to initialize DB connection
import { checkConnection } from '../database/connection.js';
import { initializeSchema } from '../database/schema.js';

// Initialize database on startup
async function initializeDatabase(): Promise<void> {
  try {
    await initializeSchema();
    console.error('[MCP] Database initialized');
  } catch (err) {
    console.error('[MCP] Database initialization failed:', err);
  }
}

// Define Phase 1 tools (available immediately)
const phase1Tools: Tool[] = [
  {
    name: 'get_latest_news',
    description: 'Get the latest news items with optional filters by category or source. Returns paginated news with titles, descriptions, publication dates, threat levels, and sentiment scores.',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Filter by news category (e.g., "geopolitics", "technology", "business")',
        },
        source: {
          type: 'string',
          description: 'Filter by source URL',
        },
        limit: {
          type: 'number',
          description: 'Number of items to return (default: 50, max: 100)',
          default: 50,
        },
        page: {
          type: 'number',
          description: 'Page number for pagination (default: 1)',
          default: 1,
        },
      },
    },
  },
  {
    name: 'search_news',
    description: 'Search news by query string. Searches through titles and descriptions. Returns matching news items with pagination.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query string',
        },
        category: {
          type: 'string',
          description: 'Filter by news category',
        },
        source: {
          type: 'string',
          description: 'Filter by source URL',
        },
        limit: {
          type: 'number',
          description: 'Number of items to return (default: 50, max: 100)',
          default: 50,
        },
        page: {
          type: 'number',
          description: 'Page number for pagination (default: 1)',
          default: 1,
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_news_clusters',
    description: 'Get news clusters - groups of related news items about the same topic. Clusters are generated using keyword similarity and include velocity metrics (how fast news is spreading).',
    inputSchema: {
      type: 'object',
      properties: {
        minItems: {
          type: 'number',
          description: 'Minimum number of items in a cluster (default: 2)',
          default: 2,
        },
      },
    },
  },
  {
    name: 'get_recent_reports',
    description: 'Get recent AI-generated reports. Reports are daily/weekly summaries of news trends and insights.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Number of reports to return (default: 20, max: 100)',
          default: 20,
        },
        offset: {
          type: 'number',
          description: 'Offset for pagination (default: 0)',
          default: 0,
        },
        category: {
          type: 'string',
          description: 'Filter by report category (tech, world, daily, weekly)',
        },
      },
    },
  },
  {
    name: 'get_news_sources',
    description: 'Get list of available news sources. Returns source URLs and names.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_news_categories',
    description: 'Get list of available news categories.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_news_by_id',
    description: 'Get a specific news item by its ID.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'News item ID',
        },
      },
      required: ['id'],
    },
  },
];

// Define Phase 2 tools (AI-powered analysis)
const phase2Tools: Tool[] = [
  {
    name: 'analyze_trends',
    description: 'AI-powered analysis of trends for a specific topic. Uses Groq/LLM to analyze recent news and identify patterns. Returns key themes, sentiment, and implications.',
    inputSchema: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          description: 'Topic to analyze',
        },
        period: {
          type: 'string',
          description: 'Time period (e.g., "24h", "7d", "30d")',
          default: '7d',
        },
      },
      required: ['topic'],
    },
  },
  {
    name: 'get_sentiment_breakdown',
    description: 'Get sentiment distribution statistics across news. Returns positive/negative/neutral counts and percentages, plus average sentiment score.',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Filter by category',
        },
        period: {
          type: 'string',
          description: 'Time period (e.g., "24h", "7d")',
          default: '24h',
        },
      },
    },
  },
  {
    name: 'compare_periods',
    description: 'Compare news between two different time periods. Returns volume changes, source distribution, category changes, and AI-generated comparison analysis.',
    inputSchema: {
      type: 'object',
      properties: {
        period1: {
          type: 'string',
          description: 'First/later period (e.g., "7d" for last 7 days)',
        },
        period2: {
          type: 'string',
          description: 'Second/earlier period (e.g., "7d" for previous 7 days)',
        },
        category: {
          type: 'string',
          description: 'Filter by category',
        },
      },
      required: ['period1', 'period2'],
    },
  },
  {
    name: 'get_threat_overview',
    description: 'Get overview of threat levels across all news. Returns threat distribution by level (critical/high/medium/low/info), top threat categories, and top threats.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'generate_report',
    description: 'Generate a new AI report. Triggers report generation for the specified category (tech, world, daily, weekly).',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Report category (tech, world, daily, weekly)',
          enum: ['tech', 'world', 'daily', 'weekly'],
        },
        period: {
          type: 'string',
          description: 'Report period',
        },
      },
      required: ['category'],
    },
  },
  {
    name: 'get_report_content',
    description: 'Get full content of a report by ID. Returns the complete report including title, content, category, and timestamps.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'Report ID',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'list_reports',
    description: 'List reports with pagination and optional category filter. Returns report summaries without full content.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Number of reports to return (default: 20, max: 100)',
          default: 20,
        },
        offset: {
          type: 'number',
          description: 'Offset for pagination (default: 0)',
          default: 0,
        },
        category: {
          type: 'string',
          description: 'Filter by category (tech, world, daily, weekly)',
        },
      },
    },
  },
];

// All tools combined
const allTools = [...phase1Tools, ...phase2Tools];

// Create MCP Server
const server = new Server(
  {
    name: 'worldmonitor',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool handler mapping
type ToolHandler = (args: Record<string, unknown>) => Promise<{
  success: boolean;
  data?: unknown;
  error?: string;
}>;

const toolHandlers: Record<string, ToolHandler> = {
  get_latest_news: getLatestNews as ToolHandler,
  search_news: searchNews as ToolHandler,
  get_news_clusters: getNewsClusters as ToolHandler,
  get_recent_reports: getRecentReports as ToolHandler,
  get_news_sources: getNewsSources as ToolHandler,
  get_news_categories: getNewsCategories as ToolHandler,
  get_news_by_id: getNewsByIdTool as ToolHandler,
  // Phase 2 handlers
  analyze_trends: analyzeTrends as ToolHandler,
  get_sentiment_breakdown: getSentimentBreakdown as ToolHandler,
  compare_periods: comparePeriods as ToolHandler,
  get_threat_overview: getThreatOverview as ToolHandler,
  generate_report: generateReport as ToolHandler,
  get_report_content: getReportContent as ToolHandler,
  list_reports: listReports as ToolHandler,
};

// Register tool list handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: allTools,
  };
});

// Register tool call handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  // Check if tool exists
  if (!toolHandlers[name]) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: `Unknown tool: ${name}`,
          }),
        },
      ],
      isError: true,
    };
  }

  try {
    // Call the tool handler
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (toolHandlers as any)[name](args);

    // Format response
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
      isError: !result.success,
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          }),
        },
      ],
      isError: true,
    };
  }
});

// Main function to start the server
async function main(): Promise<void> {
  console.error('[MCP] WorldMonitor MCP Server starting...');

  // Initialize database
  await initializeDatabase();

  // Check database connection
  const dbCheck = await checkConnection();
  if (!dbCheck.healthy) {
    console.error('[MCP] Database connection unhealthy:', dbCheck.error);
    console.error('[MCP] Server will start but some tools may not work');
  } else {
    console.error('[MCP] Database connection OK');
  }

  // Create transport
  const transport = new StdioServerTransport();

  // Connect and run
  console.error('[MCP] Server ready on stdio');

  await server.connect(transport);
}

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('[MCP] Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[MCP] Unhandled rejection:', reason);
  process.exit(1);
});

// Start the server
main().catch((error) => {
  console.error('[MCP] Failed to start:', error);
  process.exit(1);
});
