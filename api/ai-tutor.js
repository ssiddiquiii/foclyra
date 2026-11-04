/**
 * Foclyra AI Lecture Tutor Serverless Endpoint.
 * In-context doubt solving grounded in current video timestamp using Google Gemini.
 */

export default async function handler(request, response) {
  // CORS Headers
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed. Only POST is supported.' });
  }

  try {
    const { 
      message, 
      courseTitle = 'Course Lecture', 
      lessonTitle = 'Current Lesson', 
      description = '', 
      currentTime = 0,
      formattedTime = '00:00',
      history = [],
      customApiKey = '' 
    } = request.body || {};

    if (!message || !message.trim()) {
      return response.status(400).json({ error: 'Message cannot be empty.' });
    }

    // Resolve API Key: user custom key takes priority, otherwise server environment variable
    const apiKey = (customApiKey || process.env.GEMINI_API_KEY || '').trim();

    if (!apiKey) {
      return response.status(503).json({
        error: 'Gemini AI is not configured. Please add GEMINI_API_KEY to your Vercel Project Settings > Environment Variables, or enter your personal Gemini API key in Settings.'
      });
    }

    // System prompt grounding the assistant in the lecture and exact timestamp
    const systemPrompt = `You are Foclyra's In-Context AI Study Tutor. 
You are assisting a student who is currently watching an educational course video inside Foclyra Study Studio.

GROUNDING CONTEXT:
- Course Title: "${courseTitle}"
- Lecture / Video Title: "${lessonTitle}"
- Video Description: "${description.slice(0, 1000)}"
- Current Video Playback Time: ${formattedTime} (approx ${Math.floor(currentTime)} seconds in).

CRITICAL INSTRUCTIONS:
1. Anchor your explanations in what is being taught in this specific course and lesson.
2. Ground your answer around the student's current timestamp [${formattedTime}].
3. Be clear, concise, pedagogical, and encouraging.
4. If the student asks for an explanation or takeaways, use short bullet points or crisp paragraphs.
5. If the student asks for code, provide clean, modern, well-commented code snippets.
6. Keep formatting clean with GitHub-flavored markdown. Avoid fluff or generic intros.`;

    // 1. Gather all raw history turns
    const rawTurns = [];

    if (Array.isArray(history) && history.length > 0) {
      for (const item of history.slice(-8)) { // keep recent turns
        if (item.content && item.role) {
          rawTurns.push({
            role: item.role === 'assistant' || item.role === 'model' ? 'model' : 'user',
            parts: [{ text: String(item.content).trim() }]
          });
        }
      }
    }

    // Add current user prompt
    rawTurns.push({
      role: 'user',
      parts: [{ text: message.trim() }]
    });

    // 2. HIT POINT #1 FIX: Strict Role Alternation (user -> model -> user -> model)
    // Gemini API v1beta rejects any request where consecutive turns have identical roles.
    const contents = [];
    for (const turn of rawTurns) {
      if (!turn.parts[0]?.text) continue;
      const last = contents[contents.length - 1];
      if (last && last.role === turn.role) {
        // Merge consecutive duplicate roles (e.g. user turn after a failed network attempt)
        last.parts[0].text += `\n\n${turn.parts[0].text}`;
      } else {
        contents.push(turn);
      }
    }

    // Ensure the conversation always begins with a 'user' turn
    while (contents.length > 0 && contents[0].role !== 'user') {
      contents.shift();
    }

    // Fallback if contents became empty
    if (contents.length === 0) {
      contents.push({
        role: 'user',
        parts: [{ text: message.trim() }]
      });
    }

    const geminiPayload = {
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      contents,
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 1024,
        topP: 0.95
      }
    };

    // Candidate models in priority order: gemini-2.5-flash -> gemini-3.5-flash -> gemini-2.0-flash
    const candidateModels = ['gemini-2.5-flash', 'gemini-3.5-flash', 'gemini-2.0-flash'];
    let reply = null;
    let lastError = null;

    for (const model of candidateModels) {
      try {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
        const apiRes = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(geminiPayload)
        });

        const data = await apiRes.json();

        if (apiRes.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
          reply = data.candidates[0].content.parts[0].text;
          break; // successfully generated
        } else if (data?.candidates?.[0]?.finishReason === 'SAFETY') {
          reply = "I apologize, but this explanation was blocked by safety filters. Please try rephrasing your question or focusing on specific course concepts.";
          break;
        } else {
          lastError = data?.error?.message || `Failed with model ${model}`;
          console.warn(`Gemini model [${model}] returned error:`, lastError);
        }
      } catch (callErr) {
        lastError = callErr.message;
        console.warn(`Gemini model [${model}] network exception:`, callErr);
      }
    }

    if (!reply) {
      console.error('All Gemini candidate models failed:', lastError);
      return response.status(500).json({ error: lastError || 'AI Tutor was unable to generate a response. Please try again.' });
    }

    return response.status(200).json({
      success: true,
      reply: reply.trim(),
      timestamp: formattedTime
    });

  } catch (error) {
    console.error('AI Tutor handler exception:', error);
    return response.status(500).json({ error: `AI Tutor processing failed: ${error.message}` });
  }
}
