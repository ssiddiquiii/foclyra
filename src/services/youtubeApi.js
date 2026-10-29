/**
 * Foclyra Resilient YouTube Integration Service.
 * Supports:
 * - Full Playlist URLs & IDs (e.g. https://www.youtube.com/playlist?list=...)
 * - Single Video Crash Courses (e.g. https://www.youtube.com/watch?v=... or https://youtu.be/...)
 * - Serverless API proxy (/api/youtube) with automatic direct client-side fallback
 * - Custom user API keys from Settings / localStorage
 */

// Known expired or revoked keys to automatically purge and ignore
const EXPIRED_KEYS = new Set([
  'AIzaSyAExIAyfPvaaNixl5cz7HZJfNwQdniXP_o'
]);

// Client-side fallback key (optional, server proxy /api/youtube uses secret YOUTUBE_API_KEY)
const DEFAULT_API_KEY = (import.meta.env?.VITE_YOUTUBE_API_KEY && !EXPIRED_KEYS.has(import.meta.env.VITE_YOUTUBE_API_KEY))
  ? import.meta.env.VITE_YOUTUBE_API_KEY
  : '';

export function getActiveApiKey() {
  try {
    const customKey = typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function' 
      ? localStorage.getItem('foclyra_custom_youtube_api_key') 
      : null;
    if (customKey) {
      const trimmed = customKey.trim();
      if (EXPIRED_KEYS.has(trimmed)) {
        // Auto-purge known expired key from browser storage
        localStorage.removeItem('foclyra_custom_youtube_api_key');
        return DEFAULT_API_KEY;
      }
      if (trimmed.length > 10) {
        return trimmed;
      }
    }
  } catch (_) {}
  return DEFAULT_API_KEY;
}

/**
 * Extracts Playlist ID from various YouTube URL formats.
 */
export function extractPlaylistId(inputUrlOrId) {
  if (!inputUrlOrId) return null;
  const trimmed = inputUrlOrId.trim();
  
  // Direct playlist ID format check (starts with PL, RD, UU, etc.)
  if (/^[a-zA-Z0-9_-]{18,}$/.test(trimmed) && !trimmed.includes('http')) {
    return trimmed;
  }

  try {
    const urlObj = new URL(trimmed);
    const listId = urlObj.searchParams.get('list');
    if (listId) return listId;
  } catch (_) {
    const match = trimmed.match(/[&?]list=([a-zA-Z0-9_-]+)/);
    if (match) return match[1];
  }
  return null;
}

/**
 * Extracts Single Video ID from YouTube URL formats.
 */
export function extractVideoId(inputUrlOrId) {
  if (!inputUrlOrId) return null;
  const trimmed = inputUrlOrId.trim();

  // Direct 11-char video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const urlObj = new URL(trimmed);
    if (urlObj.hostname.includes('youtu.be')) {
      const pathId = urlObj.pathname.replace(/^\//, '');
      if (pathId.length >= 11) return pathId.slice(0, 11);
    }
    const vParam = urlObj.searchParams.get('v');
    if (vParam) return vParam;
  } catch (_) {
    const match = trimmed.match(/(?:youtu\.be\/|watch\?v=)([a-zA-Z0-9_-]{11})/);
    if (match) return match[1];
  }
  return null;
}

/**
 * Converts ISO 8601 duration (e.g. PT1H2M34S) to digital string (1:02:34 or 15:20)
 */
export function parseISODuration(durationISO) {
  if (!durationISO) return '0:00';
  const match = durationISO.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '0:00';

  const hours = parseInt(match[1] || 0, 10);
  const minutes = parseInt(match[2] || 0, 10);
  const seconds = parseInt(match[3] || 0, 10);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Direct client-side fetch for YouTube Playlist using YouTube Data API v3.
 */
async function executePlaylistDirectClient(playlistId, apiKey) {
  // 1. Fetch Playlist Info
  const playlistUrl = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${encodeURIComponent(playlistId)}&key=${apiKey}`;
  const playlistRes = await fetch(playlistUrl, { signal: AbortSignal.timeout(10000) });

  if (!playlistRes.ok) {
    if (playlistRes.status === 403 || playlistRes.status === 429) {
      throw new Error('YouTube API quota reached. You can add your personal API key in Settings.');
    }
    if (playlistRes.status === 404) {
      throw new Error('Playlist not found. Please verify the URL or ensure the playlist is Public or Unlisted.');
    }
    throw new Error(`YouTube API request failed with status ${playlistRes.status}`);
  }

  const playlistData = await playlistRes.json();
  if (!playlistData.items || playlistData.items.length === 0) {
    throw new Error('Playlist not found or contains no videos.');
  }

  const snippet = playlistData.items[0].snippet;
  const course = {
    id: playlistId,
    title: snippet.title || 'Untitled Playlist',
    description: snippet.description || 'YouTube Playlist Course',
    thumbnailUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || '',
    channelName: snippet.channelTitle || 'YouTube Creator',
    type: 'youtube',
    udemyUrl: ''
  };

  // 2. Fetch Playlist Items
  let rawLessons = [];
  let nextPageToken = '';
  let hasNextPage = true;
  let index = 1;
  const MAX_ITEMS = 500;

  while (hasNextPage) {
    const itemsUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${encodeURIComponent(playlistId)}&key=${apiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
    const itemsRes = await fetch(itemsUrl, { signal: AbortSignal.timeout(10000) });
    if (!itemsRes.ok) {
      break;
    }
    const itemsData = await itemsRes.json();

    if (itemsData.items) {
      for (const item of itemsData.items) {
        const title = item.snippet?.title || '';
        if (title !== 'Private video' && title !== 'Deleted video') {
          const videoId = item.contentDetails?.videoId || item.snippet?.resourceId?.videoId;
          if (videoId) {
            rawLessons.push({
              id: videoId,
              courseId: playlistId,
              title: title || `Lecture ${index}`,
              description: item.snippet?.description || '',
              thumbnailUrl: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || '',
              duration: '0:00',
              index: index++,
              type: 'youtube'
            });
          }
        }
      }
    }

    if (rawLessons.length >= MAX_ITEMS) break;
    nextPageToken = itemsData.nextPageToken;
    hasNextPage = !!nextPageToken;
  }

  if (rawLessons.length === 0) {
    throw new Error('No public videos found in this playlist.');
  }

  // 3. Batch fetch durations
  const videoIds = rawLessons.map(l => l.id).filter(Boolean);
  const durationMap = {};

  for (let i = 0; i < videoIds.length; i += 50) {
    const batchIds = videoIds.slice(i, i + 50).join(',');
    const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${batchIds}&key=${apiKey}`;
    try {
      const videosRes = await fetch(videosUrl, { signal: AbortSignal.timeout(10000) });
      if (videosRes.ok) {
        const videosData = await videosRes.json();
        if (videosData.items) {
          videosData.items.forEach(v => {
            durationMap[v.id] = parseISODuration(v.contentDetails?.duration);
          });
        }
      }
    } catch (_) {}
  }

  const lessons = rawLessons.map(lesson => ({
    ...lesson,
    duration: durationMap[lesson.id] || '0:00'
  }));

  return { course, lessons };
}

async function fetchPlaylistDirectClient(playlistId, apiKey) {
  const primaryKey = apiKey || DEFAULT_API_KEY;
  try {
    return await executePlaylistDirectClient(playlistId, primaryKey);
  } catch (err) {
    if (primaryKey !== DEFAULT_API_KEY) {
      console.warn(`Primary YouTube API key failed (${err.message}). Retrying with verified fallback key...`);
      return await executePlaylistDirectClient(playlistId, DEFAULT_API_KEY);
    }
    throw err;
  }
}

/**
 * Direct client-side fetch for a single YouTube video tutorial/crash course.
 */
async function executeSingleVideoDirectClient(videoId, apiKey) {
  const fetchOptions = { signal: AbortSignal.timeout(15000) };
  const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${encodeURIComponent(videoId)}&key=${apiKey}`;
  const res = await fetch(videosUrl, fetchOptions);

  if (!res.ok) {
    throw new Error('Failed to fetch video details from YouTube.');
  }

  const data = await res.json();
  if (!data.items || data.items.length === 0) {
    throw new Error('Video not found or is set to private.');
  }

  const item = data.items[0];
  const snippet = item.snippet;
  const duration = parseISODuration(item.contentDetails?.duration);

  const course = {
    id: videoId,
    title: snippet.title || 'YouTube Crash Course',
    description: snippet.description || '',
    thumbnailUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || '',
    channelName: snippet.channelTitle || 'YouTube Creator',
    type: 'youtube',
    udemyUrl: ''
  };

  const lessons = [{
    id: videoId,
    courseId: videoId,
    title: snippet.title || 'Full Tutorial',
    description: snippet.description || '',
    thumbnailUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || '',
    duration: duration || '0:00',
    index: 1,
    type: 'youtube'
  }];

  return { course, lessons };
}

async function fetchSingleVideoDirectClient(videoId, apiKey) {
  const primaryKey = apiKey || DEFAULT_API_KEY;
  try {
    return await executeSingleVideoDirectClient(videoId, primaryKey);
  } catch (err) {
    if (primaryKey !== DEFAULT_API_KEY) {
      console.warn(`Primary key failed (${err.message}). Retrying with verified fallback key...`);
      return await executeSingleVideoDirectClient(videoId, DEFAULT_API_KEY);
    }
    throw err;
  }
}

/**
 * Zero-Key Client Fallback: Fetches single video details via public YouTube oEmbed.
 */
async function fetchZeroKeyVideoClient(videoId) {
  const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}&format=json`;
  const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error('Public oEmbed unavailable.');

  const data = await res.json();
  const course = {
    id: videoId,
    title: data.title || 'YouTube Crash Course',
    description: `Full Tutorial by ${data.author_name || 'YouTube Creator'}. Study with notes, progress tracking, and zero ads.`,
    thumbnailUrl: data.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    channelName: data.author_name || 'YouTube Creator',
    type: 'youtube',
    udemyUrl: ''
  };

  const lessons = [
    {
      id: videoId,
      courseId: videoId,
      title: data.title || 'Full Crash Course',
      description: 'Comprehensive single-video tutorial with notes and progress tracking.',
      thumbnailUrl: data.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      duration: '0:00',
      index: 1,
      type: 'youtube'
    }
  ];

  return { course, lessons };
}

/**
 * Zero-Key Client Fallback: Fetches playlist videos via public YouTube Atom/RSS feed.
 */
async function fetchZeroKeyPlaylistClient(playlistId) {
  const rssUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${encodeURIComponent(playlistId)}`;
  let res;
  try {
    res = await fetch(rssUrl, { signal: AbortSignal.timeout(8000) });
  } catch (_) {
    throw new Error('Direct YouTube RSS is restricted by browser CORS security. Please try again or provide an API key in Settings.');
  }

  if (!res || !res.ok) throw new Error('Public RSS feed unavailable.');

  const xml = await res.text();
  const feedTitleMatch = xml.match(/<feed[^>]*>[\s\S]*?<title>([\s\S]*?)<\/title>/);
  const feedAuthorMatch = xml.match(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>/);
  
  const title = feedTitleMatch ? feedTitleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : 'YouTube Playlist';
  const author = feedAuthorMatch ? feedAuthorMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : 'YouTube Creator';

  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;
  const lessons = [];
  let index = 1;

  while ((match = entryRegex.exec(xml)) !== null) {
    const entryXml = match[1];
    const videoIdMatch = entryXml.match(/<yt:videoId>(.*?)<\/yt:videoId>/);
    const videoTitleMatch = entryXml.match(/<title>(.*?)<\/title>/);
    const thumbMatch = entryXml.match(/<media:thumbnail[^>]*url=["'](.*?)["']/);
    const descMatch = entryXml.match(/<media:description>([\s\S]*?)<\/media:description>/);

    if (videoIdMatch) {
      const vId = videoIdMatch[1].trim();
      lessons.push({
        id: vId,
        courseId: playlistId,
        title: videoTitleMatch ? videoTitleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : `Lesson ${index}`,
        description: descMatch ? descMatch[1].trim() : '',
        thumbnailUrl: thumbMatch ? thumbMatch[1] : `https://i.ytimg.com/vi/${vId}/hqdefault.jpg`,
        duration: '0:00',
        index: index++,
        type: 'youtube'
      });
    }
  }

  if (lessons.length === 0) throw new Error('No public videos found in RSS feed.');

  // If an active API key is available, batch fetch durations for RSS lessons
  const activeKey = getActiveApiKey();
  if (activeKey && lessons.length > 0) {
    try {
      const videoIds = lessons.map(l => l.id).filter(Boolean);
      for (let i = 0; i < videoIds.length; i += 50) {
        const batchIds = videoIds.slice(i, i + 50).join(',');
        const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${batchIds}&key=${activeKey}`;
        const videosRes = await fetch(videosUrl, { signal: AbortSignal.timeout(5000) });
        if (videosRes.ok) {
          const videosData = await videosRes.json();
          if (videosData.items) {
            const map = {};
            videosData.items.forEach(v => {
              map[v.id] = parseISODuration(v.contentDetails?.duration);
            });
            lessons.forEach(l => {
              if (map[l.id]) l.duration = map[l.id];
            });
          }
        }
      }
    } catch (_) {}
  }

  const course = {
    id: playlistId,
    title,
    description: `YouTube Playlist Course (${lessons.length} lectures)`,
    thumbnailUrl: lessons[0].thumbnailUrl,
    channelName: author,
    type: 'youtube',
    udemyUrl: ''
  };

  return { course, lessons };
}

/**
 * Primary Unified YouTube Course Fetcher.
 * Accepts:
 * - Playlist URL or Playlist ID
 * - Single Video URL or Video ID
 * Tries serverless proxy first, automatically falls back to direct client API and Zero-Key public feeds.
 * @param {string} inputUrlOrId 
 * @returns {Promise<{ course: object, lessons: Array<object> }>}
 */
export async function fetchYouTubePlaylistData(inputUrlOrId) {
  if (!inputUrlOrId) {
    throw new Error('YouTube URL or ID is required.');
  }

  const apiKey = getActiveApiKey();
  const playlistId = extractPlaylistId(inputUrlOrId);

  // If it is a playlist:
  if (playlistId) {
    // 1. Try serverless proxy first
    try {
      const endpointUrl = `/api/youtube?playlistId=${encodeURIComponent(playlistId)}&apiKey=${encodeURIComponent(apiKey || '')}`;
      const response = await fetch(endpointUrl, { signal: AbortSignal.timeout(25000) });
      const contentType = response.headers.get('content-type') || '';

      if (response.ok && contentType.includes('application/json')) {
        const data = await response.json();
        if (data.course && Array.isArray(data.lessons) && data.lessons.length > 15) {
          return { course: data.course, lessons: data.lessons };
        }
        // If serverless proxy returned 15 or fewer lessons, try direct client to see if more exist
        if (data.course && Array.isArray(data.lessons) && data.lessons.length > 0) {
          try {
            const directResult = await fetchPlaylistDirectClient(playlistId, apiKey);
            if (directResult && directResult.lessons && directResult.lessons.length > data.lessons.length) {
              return directResult;
            }
          } catch (_) {}
          return { course: data.course, lessons: data.lessons };
        }
      }
    } catch (_) {
      // Fallback
    }

    // 2. Client-side API fallback (with automatic key rotation to DEFAULT_API_KEY)
    try {
      return await fetchPlaylistDirectClient(playlistId, apiKey);
    } catch (err) {
      console.warn('Direct client API fetch error:', err.message);
    }

    // 3. Zero-Key Public RSS Fallback (Zero quota, zero key required)
    try {
      return await fetchZeroKeyPlaylistClient(playlistId);
    } catch (_) {
      throw new Error(`Unable to import playlist. Please check your internet connection or verify the playlist is Public or Unlisted.`);
    }
  }

  // If it's a single video tutorial (e.g. 1-hour to 12-hour crash courses)
  const videoId = extractVideoId(inputUrlOrId);
  if (videoId) {
    // 1. Try serverless proxy
    try {
      const endpointUrl = `/api/youtube?videoId=${encodeURIComponent(videoId)}&apiKey=${encodeURIComponent(apiKey || '')}`;
      const response = await fetch(endpointUrl, { signal: AbortSignal.timeout(10000) });
      const contentType = response.headers.get('content-type') || '';

      if (response.ok && contentType.includes('application/json')) {
        const data = await response.json();
        if (data.course && Array.isArray(data.lessons) && data.lessons.length > 0) {
          return { course: data.course, lessons: data.lessons };
        }
      }
    } catch (_) {
      // Fallback
    }

    // 2. Client-side API fallback (with automatic key rotation to DEFAULT_API_KEY)
    try {
      return await fetchSingleVideoDirectClient(videoId, apiKey);
    } catch (err) {
      console.warn('Direct client video fetch error:', err.message);
    }

    // 3. Zero-Key Public oEmbed Fallback (Zero quota, zero key required)
    return await fetchZeroKeyVideoClient(videoId);
  }

  throw new Error('Please enter a valid YouTube playlist URL or video tutorial link.');
}
