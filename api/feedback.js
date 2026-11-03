/**
 * Foclyra Production Feedback & Bug Report Serverless Endpoint.
 * Supports:
 * - Resend API (3,000 free emails/month, base64 image attachments)
 * - Web3Forms API (Unlimited free submissions)
 * - Client mailto fallback if API keys are pending
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
    const { name, email, category = 'bug', message, screenshot, telemetry } = request.body || {};

    if (!message || message.trim().length < 5) {
      return response.status(400).json({ error: 'Please provide a descriptive feedback message (at least 5 characters).' });
    }

    const cleanName = (name || 'Anonymous User').trim();
    const cleanEmail = (email || 'noreply@foclyra.com').trim();
    const cleanCategory = category.toUpperCase();
    const recipientEmail = process.env.FEEDBACK_RECIPIENT_EMAIL || 'sameedsiddiqui9@gmail.com';

    const categoryClass = cleanCategory.toLowerCase();
    const badgeColor = categoryClass === 'bug' ? '#fee2e2; color: #991b1b' : categoryClass === 'feature' ? '#fef3c7; color: #92400e' : '#e0f2fe; color: #075985';

    // Formatted Editorial HTML Email Body
    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px; background-color: #f4f4f5;">
        <div style="background-color: #ffffff; border-radius: 24px; border: 1px solid #e4e4e7; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
          <div style="padding: 28px 28px 16px 28px; border-bottom: 1px solid #f4f4f5;">
            <span style="display: inline-block; padding: 4px 12px; border-radius: 100px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; background: ${badgeColor};">
              ${cleanCategory}
            </span>
            <h2 style="margin: 12px 0 4px 0; font-size: 20px; color: #09090b; letter-spacing: -0.02em;">New User Submission</h2>
            <p style="margin: 0; font-size: 13px; color: #71717a;">From: <strong>${cleanName}</strong> (<a href="mailto:${cleanEmail}" style="color: #09090b;">${cleanEmail}</a>)</p>
          </div>

          <div style="padding: 24px 28px 28px 28px;">
            <h3 style="font-size: 11.5px; text-transform: uppercase; color: #71717a; letter-spacing: 0.05em; margin: 0 0 8px 0;">User Message:</h3>
            <div style="background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 16px; padding: 18px; font-size: 14px; line-height: 1.6; color: #18181b; white-space: pre-wrap;">${message.trim()}</div>

            ${screenshot ? `
              <div style="margin-top: 20px;">
                <h3 style="font-size: 11.5px; text-transform: uppercase; color: #71717a; letter-spacing: 0.05em; margin: 0 0 8px 0;">Attached Screenshot:</h3>
                <img src="${screenshot}" alt="User Screenshot" style="max-width: 100%; height: auto; border-radius: 12px; border: 1px solid #cbd5e1;" />
              </div>
            ` : ''}

            ${telemetry ? `
              <h3 style="font-size: 11.5px; text-transform: uppercase; color: #71717a; letter-spacing: 0.05em; margin: 24px 0 8px 0;">Diagnostic Telemetry:</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <tr><td style="padding: 6px 0; border-bottom: 1px solid #f4f4f5; color: #71717a; font-weight: 600; width: 35%;">Page URL</td><td style="padding: 6px 0; border-bottom: 1px solid #f4f4f5; color: #27272a; word-break: break-all;">${telemetry.url || 'N/A'}</td></tr>
                <tr><td style="padding: 6px 0; border-bottom: 1px solid #f4f4f5; color: #71717a; font-weight: 600;">Screen Size</td><td style="padding: 6px 0; border-bottom: 1px solid #f4f4f5; color: #27272a;">${telemetry.screenSize || 'N/A'}</td></tr>
                <tr><td style="padding: 6px 0; border-bottom: 1px solid #f4f4f5; color: #71717a; font-weight: 600;">Browser / OS</td><td style="padding: 6px 0; border-bottom: 1px solid #f4f4f5; color: #27272a; word-break: break-all;">${telemetry.userAgent || 'N/A'}</td></tr>
                <tr><td style="padding: 6px 0; border-bottom: 1px solid #f4f4f5; color: #71717a; font-weight: 600;">Timestamp</td><td style="padding: 6px 0; border-bottom: 1px solid #f4f4f5; color: #27272a;">${telemetry.timestamp || new Date().toISOString()}</td></tr>
              </table>
            ` : ''}

            <div style="text-align: center; margin-top: 28px;">
              <a href="mailto:${cleanEmail}?subject=Re:%20[Foclyra%20${cleanCategory}]%20Your%20Feedback" style="display: inline-block; background-color: #09090b; color: #ffffff !important; font-size: 12.5px; font-weight: 600; text-decoration: none; padding: 11px 26px; border-radius: 100px;">
                Reply to ${cleanName} →
              </a>
            </div>
          </div>

          <div style="border-top: 1px solid #f4f4f5; padding: 16px 28px; text-align: center; font-size: 11px; color: #a1a1aa;">
            Foclyra Telemetry & Feedback Delivery Engine • Delivered to ${recipientEmail}
          </div>
        </div>
      </div>
    `;

    // 1. Primary: Try Resend API (Free 3,000 emails/month)
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      const attachments = [];
      if (screenshot && screenshot.startsWith('data:image/')) {
        const base64Data = screenshot.split(',')[1];
        if (base64Data) {
          attachments.push({
            filename: 'screenshot.png',
            content: base64Data
          });
        }
      }

      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Foclyra Feedback <onboarding@resend.dev>',
          to: [recipientEmail],
          reply_to: cleanEmail !== 'noreply@foclyra.com' ? cleanEmail : undefined,
          subject: `[Foclyra ${cleanCategory}] from ${cleanName}`,
          html: htmlContent,
          attachments: attachments.length > 0 ? attachments : undefined
        })
      });

      if (resendRes.ok) {
        return response.status(200).json({ success: true, provider: 'resend', message: 'Feedback sent successfully.' });
      }
    }

    // 2. Alternative: Try Web3Forms (Unlimited submissions)
    const web3formsKey = process.env.WEB3FORMS_ACCESS_KEY;
    if (web3formsKey) {
      const w3Res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: web3formsKey,
          name: cleanName,
          email: cleanEmail,
          subject: `[Foclyra ${cleanCategory}] from ${cleanName}`,
          message: `${message}\n\n--- Telemetry ---\n${JSON.stringify(telemetry || {}, null, 2)}`,
          from_name: 'Foclyra User'
        })
      });

      if (w3Res.ok) {
        return response.status(200).json({ success: true, provider: 'web3forms', message: 'Feedback sent successfully.' });
      }
    }

    // 3. Fallback: Return successful payload with ready-to-use mailto URL so user is never blocked
    const subject = encodeURIComponent(`[Foclyra ${cleanCategory}] from ${cleanName}`);
    const body = encodeURIComponent(`Name: ${cleanName}\nEmail: ${cleanEmail}\n\nMessage:\n${message}\n\n--- Diagnostic Info ---\nURL: ${telemetry?.url || ''}\nBrowser: ${telemetry?.userAgent || ''}\nScreen: ${telemetry?.screenSize || ''}`);
    const mailtoUrl = `mailto:${recipientEmail}?subject=${subject}&body=${body}`;

    return response.status(200).json({
      success: true,
      provider: 'direct',
      mailtoUrl,
      message: 'Feedback received. Configure RESEND_API_KEY in Vercel to receive automatic email inbox notifications.'
    });

  } catch (error) {
    return response.status(500).json({ error: `Failed to process feedback: ${error.message}` });
  }
}
