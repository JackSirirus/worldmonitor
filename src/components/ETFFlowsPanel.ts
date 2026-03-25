import { Panel } from './Panel';
import { escapeHtml } from '@/utils/sanitize';
import { t } from '@/i18n';

interface ETFData {
  ticker: string;
  issuer: string;
  price: number;
  change: number;
  volume: number;
  flow: 'inflow' | 'outflow' | 'unknown' | 'neutral';
}

interface ETFFlowsResult {
  timestamp: string;
  summary: {
    etfCount: number;
    totalVolume: number;
    totalEstFlow: number;
    netDirection: string;
    inflowCount: number;
    outflowCount: number;
  };
  etfs: ETFData[];
}

function formatVolume(v: number | null | undefined): string {
  if (v === null || v === undefined || isNaN(v)) return 'N/A';
  if (Math.abs(v) >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
  if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (Math.abs(v) >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return v.toLocaleString();
}

function flowClass(direction: string): string {
  if (direction === 'inflow') return 'flow-inflow';
  if (direction === 'outflow') return 'flow-outflow';
  if (direction === 'unknown') return 'flow-neutral';
  return 'flow-neutral';
}

function changeClass(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return 'change-neutral';
  if (val > 0.1) return 'change-positive';
  if (val < -0.1) return 'change-negative';
  return 'change-neutral';
}

export class ETFFlowsPanel extends Panel {
  private data: ETFFlowsResult | null = null;
  private loading = true;
  private error: string | null = null;
  private refreshInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    super({ id: 'etf-flows', title: t('panels.btcEtfTracker'), titleKey: 'panels.btcEtfTracker', showCount: false });
    void this.fetchData();
    this.refreshInterval = setInterval(() => this.fetchData(), 60000);
  }

  public destroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  private async fetchData(): Promise<void> {
    try {
      const res = await fetch('/api/etf-flows');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this.data = await res.json();
      this.error = null;
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to fetch';
    } finally {
      this.loading = false;
      this.renderPanel();
    }
  }

  private renderPanel(): void {
    if (this.loading) {
      this.showLoading(t('etfFlows.loadingData'));
      return;
    }

    if (this.error || !this.data) {
      this.showError(this.error || t('etfFlows.noData'));
      return;
    }

    const d = this.data;
    const s = d.summary;
    const dirClass = s.netDirection.includes('INFLOW') ? 'flow-inflow' : s.netDirection.includes('OUTFLOW') ? 'flow-outflow' : 'flow-neutral';

    const rows = d.etfs.map(etf => `
      <tr class="etf-row ${flowClass(etf.flow)}">
        <td class="etf-ticker">${escapeHtml(etf.ticker)}</td>
        <td class="etf-issuer">${escapeHtml(etf.issuer)}</td>
        <td class="etf-flow ${flowClass(etf.flow)}">${etf.flow === 'inflow' ? '+' : etf.flow === 'outflow' ? '-' : ''}${formatVolume(Math.abs(etf.change * etf.volume / 100))}</td>
        <td class="etf-volume">${formatVolume(etf.volume)}</td>
        <td class="etf-change ${changeClass(etf.change)}">${etf.change > 0 ? '+' : ''}${etf.change?.toFixed(2) ?? '0.00'}%</td>
      </tr>
    `).join('');

    const html = `
      <div class="etf-flows-container">
        <div class="etf-summary ${dirClass}">
          <div class="etf-summary-item">
            <span class="etf-summary-label">${t('etfFlows.netFlow')}</span>
            <span class="etf-summary-value ${dirClass}">${escapeHtml(s.netDirection)}</span>
          </div>
          <div class="etf-summary-item">
            <span class="etf-summary-label">${t('etfFlows.estFlow')}</span>
            <span class="etf-summary-value">$${formatVolume(Math.abs(s.totalEstFlow))}</span>
          </div>
          <div class="etf-summary-item">
            <span class="etf-summary-label">${t('etfFlows.totalVol')}</span>
            <span class="etf-summary-value">${formatVolume(s.totalVolume)}</span>
          </div>
          <div class="etf-summary-item">
            <span class="etf-summary-label">${t('etfFlows.etfs')}</span>
            <span class="etf-summary-value">${s.inflowCount}↑ ${s.outflowCount}↓</span>
          </div>
        </div>
        <div class="etf-table-wrap">
          <table class="etf-table">
            <thead>
              <tr>
                <th>${t('etfFlows.ticker')}</th>
                <th>${t('etfFlows.issuer')}</th>
                <th>${t('etfFlows.estFlow')}</th>
                <th>${t('etfFlows.volume')}</th>
                <th>${t('etfFlows.change')}</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    `;

    this.setContent(html);
  }
}
