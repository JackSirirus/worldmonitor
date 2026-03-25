/**
 * GitHub Trending API
 * Uses GitHub Search API for trending repositories
 */

import express from 'express';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { language, since } = req.query;

    // Map 'daily'/'weekly' to GitHub search date range
    const sinceMap: Record<string, string> = {
      daily: 'daily',
      weekly: 'weekly',
      monthly: 'monthly',
    };
    const range = sinceMap[since as string] || 'daily';

    // Build GitHub search query for stars
    // Use stars:>100 as minimum to get popular repos
    let query = 'stars:>100 created:>' + getDateRange(range);
    if (language && language !== 'all') {
      query += ` language:${language}`;
    }

    const searchUrl = 'https://api.github.com/search/repositories?' + new URLSearchParams({
      q: query,
      sort: 'stars',
      order: 'desc',
      per_page: '25',
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(searchUrl, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'WorldMonitor/1.0',
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    // Check content type first
    const contentType = response.headers.get('content-type') || '';

    let data;
    try {
      if (!contentType.includes('application/json')) {
        const errorText = await response.text();
        console.error('[GitHubTrending] GitHub API rate limited or error:', response.status, errorText.slice(0, 200));
        // Return empty array as fallback
        return res.status(200)
          .set({ 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=3600' })
          .json([]);
      }
      data = await response.json();
    } catch (parseError: any) {
      console.error('[GitHubTrending] JSON parse error:', parseError.message);
      return res.status(200)
        .set({ 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=3600' })
        .json([]);
    }

    if (!response.ok) {
      console.error('[GitHubTrending] GitHub API error:', response.status, JSON.stringify(data).slice(0, 200));
      return res.status(response.status).json({
        error: 'GitHub API error',
        data,
      });
    }

    // Transform GitHub API response to match expected format
    const trending = (data.items || []).map((repo: any) => ({
      name: repo.full_name,
      description: repo.description,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      language: repo.language,
      url: repo.html_url,
      owner: repo.owner?.login,
      owner_avatar: repo.owner?.avatar_url,
      built_by: repo.contributors_url,
      current_period_stars: repo.stargazers_count, // Approximation
    }));

    res.status(200)
      .set({ 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=3600' })
      .json(trending);
  } catch (error: any) {
    console.error('[GitHubTrending] Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch GitHub trending data', message: error.message });
  }
});

function getDateRange(since: string): string {
  const now = new Date();
  let days = 1;
  if (since === 'weekly') days = 7;
  if (since === 'monthly') days = 30;
  const past = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return past.toISOString().split('T')[0];
}

export { router };
