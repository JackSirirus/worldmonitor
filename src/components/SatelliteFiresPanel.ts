import { Panel } from './Panel';
import type { FireRegionStats } from '@/services/firms-satellite';
import { t } from '@/i18n';

export class SatelliteFiresPanel extends Panel {
  private stats: FireRegionStats[] = [];
  private totalCount = 0;
  private lastUpdated: Date | null = null;

  constructor() {
    super({
      id: 'satellite-fires',
      title: t('panels.fires'),
      titleKey: 'panels.fires',
      showCount: true,
      trackActivity: true,
      infoTooltip: 'NASA FIRMS VIIRS satellite thermal detections across monitored conflict regions. High-intensity = brightness &gt;360K &amp; confidence &gt;80%.',
    });
    this.showLoading(t('satelliteFires.scanningThermal'));
  }

  public update(stats: FireRegionStats[], totalCount: number): void {
    const prevCount = this.totalCount;
    this.stats = stats;
    this.totalCount = totalCount;
    this.lastUpdated = new Date();
    this.setCount(totalCount);

    if (prevCount > 0 && totalCount > prevCount) {
      this.setNewBadge(totalCount - prevCount);
    }

    this.render();
  }

  private render(): void {
    if (this.stats.length === 0) {
      this.setContent(`<div class="panel-empty">${t('satelliteFires.noFireData')}</div>`);
      return;
    }

    const rows = this.stats.map(s => {
      const frpStr = s.totalFrp >= 1000
        ? `${(s.totalFrp / 1000).toFixed(1)}k`
        : Math.round(s.totalFrp).toLocaleString();
      const highClass = s.highIntensityCount > 0 ? ' fires-high' : '';
      return `<tr class="fire-row${highClass}">
        <td class="fire-region">${escapeHtml(s.region)}</td>
        <td class="fire-count">${s.fireCount}</td>
        <td class="fire-hi">${s.highIntensityCount}</td>
        <td class="fire-frp">${frpStr}</td>
      </tr>`;
    }).join('');

    const totalFrp = this.stats.reduce((sum, s) => sum + s.totalFrp, 0);
    const totalHigh = this.stats.reduce((sum, s) => sum + s.highIntensityCount, 0);
    const ago = this.lastUpdated ? timeSince(this.lastUpdated) : 'never';

    this.setContent(`
      <div class="fires-panel-content">
        <table class="fires-table">
          <thead>
            <tr>
              <th>${t('satelliteFires.region')}</th>
              <th>${t('satelliteFires.fires')}</th>
              <th>${t('satelliteFires.high')}</th>
              <th>${t('satelliteFires.frp')}</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
          <tfoot>
            <tr class="fire-totals">
              <td>${t('satelliteFires.total')}</td>
              <td>${this.totalCount}</td>
              <td>${totalHigh}</td>
              <td>${totalFrp >= 1000 ? `${(totalFrp / 1000).toFixed(1)}k` : Math.round(totalFrp).toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
        <div class="fires-footer">
          <span class="fires-source">NASA FIRMS (VIIRS SNPP)</span>
          <span class="fires-updated">${ago}</span>
        </div>
      </div>
      <style>
        .fires-panel-content { font-size: 12px; }
        .fires-table { width: 100%; border-collapse: collapse; }
        .fires-table th { text-align: left; color: #666; font-weight: 600; font-size: 10px; text-transform: uppercase; padding: 4px 8px; border-bottom: 1px solid #222; }
        .fires-table td { padding: 5px 8px; border-bottom: 1px solid #1a1a1a; color: #ccc; }
        .fire-row:hover { background: #1a1a1a; }
        .fire-row.fires-high .fire-region { color: #f97316; }
        .fire-row.fires-high .fire-hi { color: #ef4444; font-weight: 600; }
        .fire-count, .fire-hi, .fire-frp { text-align: right; font-variant-numeric: tabular-nums; }
        .fire-totals { border-top: 1px solid #333; }
        .fire-totals td { color: #fff; font-weight: 600; }
        .fires-footer { display: flex; justify-content: space-between; padding: 8px 8px 0; color: #555; font-size: 10px; }
      </style>
    `);
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function timeSince(date: Date): string {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return t('time.justNow');
  const mins = Math.floor(secs / 60);
  if (mins < 60) return t('time.minutesAgo', { n: mins });
  const hrs = Math.floor(mins / 60);
  return t('time.hoursAgo', { n: hrs });
}
