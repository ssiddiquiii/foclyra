/**
 * Foclyra Educational Content Classification Engine.
 * 
 * CORE POLICY:
 * Foclyra is an education-focused learning platform.
 * Only content created primarily for teaching, learning, skill development,
 * knowledge acquisition, or practical instruction is eligible.
 * 
 * ALLOWED CONTENT:
 * - Programming, software engineering, and technology tutorials.
 * - Academic subjects, mathematics, science, and research lessons.
 * - Language learning and communication skills.
 * - History, geography, and educational lectures.
 * - Cooking tutorials, recipes, and practical demonstrations.
 * - Professional development and career skills.
 * - Educational podcasts and structured learning sessions.
 * - DIY, technical, and practical instructional tutorials.
 * 
 * STRICTLY PROHIBITED:
 * - Music, songs, albums, music videos, and audio playlists.
 * - Movies, films, cinema, and web series.
 * - Documentaries, regardless of their educational subject.
 * - News broadcasts and current-affairs playlists.
 * - Entertainment, comedy, reaction videos, and celebrity content.
 * - General lifestyle vlogs and personal daily-life videos.
 * - Gaming entertainment and gameplay compilations.
 * - Promotional and advertising-only content.
 * - Any content primarily intended for entertainment rather than learning.
 */

// Strict Prohibited Patterns with contextual regular expressions
const PROHIBITED_PATTERNS = [
  {
    category: 'Music & Audio',
    regex: /\b(official\s*(music\s*)?video|official\s*audio|lyric\s*video|full\s*album|remix|vevo|feat\.|ft\.|choreography|dance\s*cover|tracklist|audio\s*track|slowed\s*(\+|and)\s*reverb|bass\s*boosted|karaoke|sing-along|discography|lofi\s*hip\s*hop|lo-fi\s*beats|music\s*compilation|soundtrack|ost)\b/i,
    channelRegex: /\b(vevo|records|music|sounds|beats|audio)\b/i
  },
  {
    category: 'Documentaries',
    // Rule 6: Documentaries, movies, and films must always be rejected, even when they contain educational information.
    regex: /\b(documentary|full\s*documentary|docuseries|investigative\s*documentary|crime\s*documentary|nature\s*documentary|historical\s*documentary|bbc\s*documentary|netflix\s*documentary|discovery\s*channel|national\s*geographic)\b/i
  },
  {
    category: 'Movies & Web Series',
    regex: /\b(full\s*movie|short\s*film|feature\s*film|official\s*trailer|teaser\s*trailer|web\s*series|episode\s*\d+\s*(season|\b)|season\s*\d+\s*(episode|\b)|cinema|box\s*office|action\s*movie|scene\s*clip|movie\s*scene|film\s*climax)\b/i
  },
  {
    category: 'News & Current Affairs',
    regex: /\b(breaking\s*news|live\s*news|news\s*broadcast|daily\s*news|news\s*bulletin|press\s*conference|prime\s*time\s*debate|geopolitics\s*debate|headline\s*news)\b/i
  },
  {
    category: 'Entertainment & Comedy',
    regex: /\b(reaction\s*to|reacting\s*to|try\s*not\s*to\s*laugh|prank|comedy\s*sketch|standup\s*comedy|stand-up|funny\s*moments|roast|drama\s*explained|celebrity\s*gossip|skit|parody|meme\s*compilation|fails\s*compilation)\b/i
  },
  {
    category: 'Vlogs & Lifestyle',
    regex: /\b(daily\s*vlog|vlog\s*#?\d+|morning\s*routine|night\s*routine|what\s*i\s*eat\s*in\s*a\s*day|day\s*in\s*the\s*life|room\s*tour|house\s*tour|lifestyle\s*vlog|travel\s*vlog|my\s*haul|grwm|get\s*ready\s*with\s*me)\b/i
  },
  {
    category: 'Gaming Entertainment',
    regex: /\b(gameplay\s*walkthrough|let's\s*play|gaming\s*moments|stream\s*highlights|twitch\s*highlights|esports|minecraft\s*survival|fortnite|gta\s*(v|5|online)|roblox|call\s*of\s*duty|valorant\s*montage)\b/i
  },
  {
    category: 'Promotional & Advertising',
    regex: /\b(product\s*launch|unboxing|sponsored\s*review|commercial|advertisement|buy\s*now|brand\s*deal)\b/i
  }
];

// Legitimate Educational Patterns
const EDUCATIONAL_PATTERNS = [
  {
    category: 'Programming & Technology',
    regex: /\b(programming|coding|software\s*engineering|web\s*development|python|javascript|typescript|react|next\.?js|node\.?js|html|css|c\+\+|java|rust|golang|sql|database|docker|kubernetes|git|algorithms|data\s*structures|system\s*design|devops|machine\s*learning|artificial\s*intelligence|deep\s*learning|data\s*science|cybersecurity|frontend|backend|api)\b/i
  },
  {
    category: 'Academic & Science',
    regex: /\b(mathematics|calculus|linear\s*algebra|algebra|geometry|trigonometry|physics|quantum|chemistry|organic\s*chemistry|biology|genetics|astronomy|statistics|probability|economics|microeconomics|macroeconomics|academic\s*lecture|research\s*methodology|theorem|proof)\b/i
  },
  {
    category: 'Language Learning',
    regex: /\b(language\s*learning|learn\s*english|learn\s*spanish|learn\s*french|learn\s*german|learn\s*japanese|learn\s*arabic|grammar|vocabulary|pronunciation|ielts|toefl|spoken\s*english|language\s*course)\b/i
  },
  {
    category: 'History & Educational Lectures',
    regex: /\b(history\s*lecture|world\s*history\s*course|ancient\s*history\s*course|geography\s*lecture|educational\s*lecture|university\s*lecture|philosophy\s*lecture)\b/i
  },
  {
    category: 'Cooking & Recipes',
    // Rule 4: A recipe or cooking tutorial qualifies as educational content.
    regex: /\b(cooking\s*tutorial|recipe|how\s*to\s*cook|how\s*to\s*bake|baking\s*tutorial|culinary\s*technique|culinary\s*skills|knife\s*skills|pastry\s*making|step-by-step\s*recipe)\b/i
  },
  {
    category: 'Professional Skills',
    regex: /\b(accounting|financial\s*modeling|project\s*management|public\s*speaking|excel\s*tutorial|figma\s*tutorial|graphic\s*design\s*course|business\s*strategy|marketing\s*strategy|leadership\s*training)\b/i
  },
  {
    category: 'DIY & Practical Tutorials',
    regex: /\b(diy\s*tutorial|woodworking\s*tutorial|electronics\s*tutorial|arduino|raspberry\s*pi|soldering\s*guide|mechanics\s*tutorial|home\s*repair\s*guide|how\s*to\s*repair|instructional\s*tutorial)\b/i
  },
  {
    category: 'Educational Podcasts & Lectures',
    regex: /\b(educational\s*podcast|huberman\s*lab|lex\s*fridman|science\s*podcast|history\s*podcast|tech\s*podcast|learning\s*session|study\s*session|academic\s*talk)\b/i
  },
  {
    category: 'General Instruction',
    regex: /\b(tutorial|course|lecture|full\s*course|crash\s*course|masterclass|bootcamp|step-by-step\s*guide|how\s*to|learn\s+|lesson\s*\d+|syllabus)\b/i
  }
];

/**
 * Classifies a YouTube playlist or single video course against Foclyra's Educational Policy.
 * Analyzes playlist title, description, channel context, and every individual video independently.
 * 
 * @param {{
 *   course: { title?: string, description?: string, channelName?: string, id?: string },
 *   lessons: Array<{ title?: string, description?: string, id?: string, index?: number }>
 * }} param0
 * @returns {{
 *   decision: 'ALLOW' | 'REJECT' | 'REVIEW',
 *   is_educational: boolean,
 *   confidence: number,
 *   playlist_purpose: string,
 *   total_videos: number,
 *   approved_videos: number,
 *   rejected_videos: number,
 *   categories: string[],
 *   violations: string[],
 *   reason: string
 * }}
 */
export function classifyEducationalContent({ course = {}, lessons = [] }) {
  const totalVideos = Array.isArray(lessons) ? lessons.length : 0;
  const violations = [];
  const identifiedCategories = new Set();

  const playlistTitle = (course.title || '').trim();
  const playlistDesc = (course.description || '').trim();
  const channelName = (course.channelName || '').trim();

  // Combine untrusted metadata for playlist level check
  const playlistText = `${playlistTitle} ${playlistDesc}`;

  // Check 1: Playlist Level Prohibited Check
  for (const rule of PROHIBITED_PATTERNS) {
    if (rule.regex.test(playlistText) || (rule.channelRegex && rule.channelRegex.test(channelName))) {
      violations.push(`Playlist metadata matches prohibited content: ${rule.category}`);
    }
  }

  // Check 2: Video Level Independent Analysis (Rule 8: Analyze every video independently)
  let approvedVideos = 0;
  let rejectedVideos = 0;
  let educationalVideosCount = 0;

  for (let i = 0; i < totalVideos; i++) {
    const video = lessons[i] || {};
    const videoTitle = (video.title || '').trim();
    const videoDesc = (video.description || '').trim();
    const videoText = `${videoTitle} ${videoDesc}`;
    const videoIdx = video.index || i + 1;

    let videoViolated = false;

    // Check prohibited patterns for this video
    for (const rule of PROHIBITED_PATTERNS) {
      if (rule.regex.test(videoText)) {
        violations.push(`Lesson ${videoIdx} ("${videoTitle.slice(0, 40)}"): Prohibited ${rule.category} content detected.`);
        videoViolated = true;
        break;
      }
    }

    if (videoViolated) {
      rejectedVideos++;
    } else {
      // Check if video satisfies educational patterns
      let isVideoEducational = false;
      for (const eduRule of EDUCATIONAL_PATTERNS) {
        if (eduRule.regex.test(videoText) || eduRule.regex.test(playlistText)) {
          identifiedCategories.add(eduRule.category);
          isVideoEducational = true;
        }
      }

      if (isVideoEducational) {
        educationalVideosCount++;
        approvedVideos++;
      } else {
        // Neutral or uninformative title (e.g. "Part 1")
        approvedVideos++;
      }
    }
  }

  // Decision Logic per Policy
  const categoriesList = Array.from(identifiedCategories);

  // RULE 9: If any video violates the prohibited-content policy, reject the entire playlist.
  if (violations.length > 0) {
    return {
      decision: 'REJECT',
      is_educational: false,
      confidence: 0.95,
      playlist_purpose: violations[0] || 'Contains non-educational or prohibited entertainment content.',
      total_videos: totalVideos,
      approved_videos: approvedVideos,
      rejected_videos: rejectedVideos,
      categories: categoriesList,
      violations,
      reason: `Playlist rejected: ${violations.slice(0, 3).join('; ')}`
    };
  }

  // RULE 10: If metadata is insufficient or classification is ambiguous, return REVIEW.
  // Never assume that uncertain content is educational.
  const hasEducationalPlaylistMarker = EDUCATIONAL_PATTERNS.some(r => r.regex.test(playlistText));
  
  if (totalVideos === 0 || (!hasEducationalPlaylistMarker && educationalVideosCount === 0)) {
    return {
      decision: 'REVIEW',
      is_educational: false,
      confidence: 0.35,
      playlist_purpose: 'Ambiguous or insufficient educational metadata.',
      total_videos: totalVideos,
      approved_videos: approvedVideos,
      rejected_videos: rejectedVideos,
      categories: categoriesList,
      violations: ['Insufficient metadata to confirm educational intent.'],
      reason: 'Content cannot be verified as an instructional course, tutorial, or educational lecture. Foclyra only imports verified learning content.'
    };
  }

  // RULE ALLOW: Only when the playlist and every video satisfy the educational policy.
  return {
    decision: 'ALLOW',
    is_educational: true,
    confidence: 0.95,
    playlist_purpose: categoriesList[0] || 'Structured educational course or tutorial',
    total_videos: totalVideos,
    approved_videos: approvedVideos,
    rejected_videos: 0,
    categories: categoriesList,
    violations: [],
    reason: 'Content strictly satisfies Foclyra educational policy as verified instructional or skill-development content.'
  };
}
