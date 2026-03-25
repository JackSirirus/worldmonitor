/**
 * Service Status API
 * Checks status of major tech services
 */

import express from 'express';

const router = express.Router();

const SERVICES = [
  { id: 'aws', name: 'AWS', statusPage: 'https://health.aws.amazon.com/health/status', customParser: 'aws', category: 'cloud' },
  { id: 'azure', name: 'Azure', statusPage: 'https://azure.status.microsoft/en-us/status/feed/', customParser: 'rss', category: 'cloud' },
  { id: 'gcp', name: 'Google Cloud', statusPage: 'https://status.cloud.google.com/incidents.json', customParser: 'gcp', category: 'cloud' },
  { id: 'cloudflare', name: 'Cloudflare', statusPage: 'https://www.cloudflarestatus.com/api/v2/status.json', category: 'cloud' },
  { id: 'vercel', name: 'Vercel', statusPage: 'https://www.vercel-status.com/api/v2/status.json', category: 'cloud' },
  { id: 'digitalocean', name: 'DigitalOcean', statusPage: 'https://status.digitalocean.com/api/v2/status.json', category: 'cloud' },
  { id: 'railway', name: 'Railway', statusPage: 'https://railway.instatus.com/summary.json', customParser: 'instatus', category: 'cloud' },
  { id: 'github', name: 'GitHub', statusPage: 'https://www.githubstatus.com/api/v2/status.json', category: 'dev' },
  { id: 'gitlab', name: 'GitLab', statusPage: 'https://status.gitlab.com/1.0/status/5b36dc6502d06804c08349f7', customParser: 'statusio', category: 'dev' },
  { id: 'npm', name: 'npm', statusPage: 'https://status.npmjs.org/api/v2/status.json', category: 'dev' },
  { id: 'docker', name: 'Docker Hub', statusPage: 'https://www.dockerstatus.com/1.0/status/533c6539221ae15e3f000031', customParser: 'statusio', category: 'dev' },
  { id: 'slack', name: 'Slack', statusPage: 'https://slack-status.com/api/v2.0.0/current', customParser: 'slack', category: 'comm' },
  { id: 'discord', name: 'Discord', statusPage: 'https://discordstatus.com/api/v2/status.json', category: 'comm' },
  { id: 'zoom', name: 'Zoom', statusPage: 'https://www.zoomstatus.com/api/v2/status.json', category: 'comm' },
  { id: 'notion', name: 'Notion', statusPage: 'https://www.notion-status.com/api/v2/status.json', category: 'comm' },
  { id: 'openai', name: 'OpenAI', statusPage: 'https://status.openai.com/api/v2/status.json', customParser: 'incidentio', category: 'ai' },
  { id: 'anthropic', name: 'Anthropic', statusPage: 'https://status.claude.com/api/v2/status.json', customParser: 'incidentio', category: 'ai' },
  { id: 'stripe', name: 'Stripe', statusPage: 'https://status.stripe.com/current', customParser: 'stripe', category: 'saas' },
  { id: 'twilio', name: 'Twilio', statusPage: 'https://status.twilio.com/api/v2/status.json', category: 'saas' },
  { id: 'supabase', name: 'Supabase', statusPage: 'https://status.supabase.com/api/v2/status.json', category: 'saas' },
];

function normalizeStatus(indicator) {
  if (!indicator) return 'unknown';
  const val = indicator.toLowerCase();
  if (val === 'none' || val === 'operational' || val.includes('all systems operational')) return 'operational';
  if (val === 'minor' || val === 'degraded_performance' || val === 'partial_outage' || val.includes('degraded')) return 'degraded';
  if (val === 'major' || val === 'major_outage' || val === 'critical' || val.includes('outage')) return 'outage';
  return 'unknown';
}

async function checkStatusPage(service) {
  if (!service.statusPage) return { ...service, status: 'unknown', description: 'No API available' };
  try {
    const headers: Record<string, string> = {
      'Accept': service.customParser === 'rss' ? 'application/xml, text/xml' : 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
    };
    if (service.customParser !== 'incidentio') headers['User-Agent'] = 'Mozilla/5.0 (compatible; WorldMonitor/1.0)';

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(service.statusPage, { headers, signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) return { ...service, status: 'unknown', description: `HTTP ${response.status}` };

    if (service.customParser === 'gcp') {
      const data = await response.json() as any;
      const activeIncidents = Array.isArray(data) ? data.filter((i: any) => !i.end || new Date(i.end) > new Date()) : [];
      if (activeIncidents.length === 0) return { ...service, status: 'operational', description: 'All services operational' };
      return { ...service, status: activeIncidents.some(i => i.severity === 'high') ? 'outage' : 'degraded', description: `${activeIncidents.length} active incident(s)` };
    }
    if (service.customParser === 'aws') return { ...service, status: 'operational', description: 'Status page reachable' };
    if (service.customParser === 'rss') {
      const text = await response.text();
      const hasIncident = text.includes('<item>') && (text.includes('degradation') || text.includes('outage') || text.includes('incident'));
      return { ...service, status: hasIncident ? 'degraded' : 'operational', description: hasIncident ? 'Recent incidents reported' : 'No recent incidents' };
    }
    if (service.customParser === 'instatus') {
      const data = await response.json() as any;
      const pageStatus = data.page?.status;
      if (pageStatus === 'UP') return { ...service, status: 'operational', description: 'All systems operational' };
      if (pageStatus === 'HASISSUES') return { ...service, status: 'degraded', description: 'Some issues reported' };
      return { ...service, status: 'unknown', description: pageStatus || 'Unknown' };
    }
    if (service.customParser === 'statusio') {
      const data = await response.json() as any;
      const statusCode = data.result?.status_overall?.status_code;
      if (statusCode === 100) return { ...service, status: 'operational', description: data.result?.status_overall?.status || 'All systems operational' };
      if (statusCode >= 500) return { ...service, status: 'outage', description: data.result?.status_overall?.status || 'Service disruption' };
      if (statusCode >= 300) return { ...service, status: 'degraded', description: data.result?.status_overall?.status || 'Degraded performance' };
      return { ...service, status: 'unknown', description: data.result?.status_overall?.status || 'Unknown' };
    }
    if (service.customParser === 'slack') {
      const data = await response.json() as any;
      if (data.status === 'ok') return { ...service, status: 'operational', description: 'All systems operational' };
      return { ...service, status: 'degraded', description: `${data.active_incidents?.length || 1} active incident(s)` };
    }
    if (service.customParser === 'stripe') {
      const data = await response.json() as any;
      if (data.largestatus === 'up') return { ...service, status: 'operational', description: data.message || 'All systems operational' };
      if (data.largestatus === 'degraded') return { ...service, status: 'degraded', description: data.message || 'Degraded performance' };
      if (data.largestatus === 'down') return { ...service, status: 'outage', description: data.message || 'Service disruption' };
      return { ...service, status: 'unknown', description: data.message || 'Unknown' };
    }
    if (service.customParser === 'incidentio') {
      const text = await response.text();
      if (text.startsWith('<!') || text.startsWith('<html')) {
        if (/All Systems Operational|fully operational|no issues/i.test(text)) return { ...service, status: 'operational', description: 'All systems operational' };
        if (/degraded|partial outage|experiencing issues/i.test(text)) return { ...service, status: 'degraded', description: 'Some issues reported' };
        return { ...service, status: 'unknown', description: 'Could not parse status' };
      }
      try {
        const data = JSON.parse(text);
        const indicator = data.status?.indicator || '';
        const description = data.status?.description || '';
        if (indicator === 'none' || description.toLowerCase().includes('operational')) return { ...service, status: 'operational', description: description || 'All systems operational' };
        if (indicator === 'minor' || indicator === 'maintenance') return { ...service, status: 'degraded', description: description || 'Minor issues' };
        if (indicator === 'major' || indicator === 'critical') return { ...service, status: 'outage', description: description || 'Major outage' };
        return { ...service, status: 'operational', description: description || 'Status OK' };
      } catch { return { ...service, status: 'unknown', description: 'Invalid response' }; }
    }

    const text = await response.text();
    if (text.startsWith('<!') || text.startsWith('<html')) return { ...service, status: 'unknown', description: 'Blocked by service' };
    let data;
    try { data = JSON.parse(text); } catch { return { ...service, status: 'unknown', description: 'Invalid JSON response' }; }

    let status, description;
    if (data.status?.indicator !== undefined) { status = normalizeStatus(data.status.indicator); description = data.status.description || ''; }
    else if (data.status?.status) { status = data.status.status === 'ok' ? 'operational' : 'degraded'; description = data.status.description || ''; }
    else if (data.page && data.status) { status = normalizeStatus(data.status.indicator || data.status.description); description = data.status.description || 'Status available'; }
    else { status = 'unknown'; description = 'Unknown format'; }
    return { ...service, status, description };
  } catch (error) { return { ...service, status: 'unknown', description: error.message || 'Request failed' }; }
}

router.get('/', async (req, res) => {
  const category = req.query.category as string;
  let servicesToCheck = SERVICES;
  if (category && category !== 'all') servicesToCheck = SERVICES.filter(s => s.category === category);

  const results = await Promise.all(servicesToCheck.map(checkStatusPage));
  const statusOrder: Record<string, number> = { outage: 0, degraded: 1, unknown: 2, operational: 3 };
  results.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

  const summary = { operational: results.filter(r => r.status === 'operational').length, degraded: results.filter(r => r.status === 'degraded').length, outage: results.filter(r => r.status === 'outage').length, unknown: results.filter(r => r.status === 'unknown').length };

  return res.set({ 'Cache-Control': 'public, max-age=60' }).json({
    success: true, timestamp: new Date().toISOString(), summary,
    services: results.map(r => ({ id: r.id, name: r.name, category: r.category, status: r.status, description: r.description })),
  });
});

export { router };
