/**
 * YouTube Live Stream Detection API
 */

import express from 'express';

const router = express.Router();

router.get('/', async (req, res) => {
  const channel = req.query.channel as string;
  if (!channel) return res.status(400).json({ error: 'Missing channel parameter' });

  try {
    const channelHandle = channel.startsWith('@') ? channel : `@${channel}`;
    const liveUrl = `https://www.youtube.com/${channelHandle}/live`;

    const response = await fetch(liveUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      redirect: 'follow',
    });

    if (!response.ok) return res.status(200).json({ videoId: null });

    const html = await response.text();
    const videoIdMatch = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
    const isLiveMatch = html.match(/"isLive":\s*true/);

    if (videoIdMatch && isLiveMatch) {
      return res.status(200).set({ 'Cache-Control': 'public, s-maxage=300' }).json({ videoId: videoIdMatch[1], isLive: true });
    }

    return res.status(200).set({ 'Cache-Control': 'public, s-maxage=300' }).json({ videoId: null, isLive: false });
  } catch (error: any) {
    return res.status(200).json({ videoId: null, error: error.message });
  }
});

export { router };
