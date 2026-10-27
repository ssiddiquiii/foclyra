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

    // Formatted HTML Email Body
    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="border-bottom: 2px solid #6366f1; padding-bottom: 12px; margin-bottom: 20px;">
          <h2 style="margin: 0; color: #1e293b; font-size: 20px;">[${cleanCategory}] Foclyra Feedback</h2>
          <p style="margin: 4px 0 0 0; color: #64748b; font-size: 13px;">Submitted by ${cleanName} (${cleanEmail})</p>
        </div>

        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 14px; text-transform: uppercase; color: #64748b; margin-bottom: 8px;">User Message:</h3>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; font-size: 14px; line-height: 1.6; color: #334155; white-space: pre-wrap;">${message.trim()}</div>
        </div>

        ${telemetry ? `
          <div style="background-color: #f1f5f9; border-radius: 8px; padding: 14px; margin-bottom: 20px; font-size: 12px; color: #475569;">
            <strong style="display: block; margin-bottom: 6px; color: #1e293b;">Diagnostic Telemetry:</strong>
            <div><strong>Page URL:</strong> ${telemetry.url || 'N/A'}</div>
            <div><strong>Browser / OS:</strong> ${telemetry.userAgent || 'N/A'}</div>
            <div><strong>Screen Size:</strong> ${telemetry.screenSize || 'N/A'}</div>
            <div><strong>Timestamp:</strong> ${telemetry.timestamp || new Date().toISOString()}</div>
          </div>
        ` : ''}

        ${screenshot ? `
          <div style="margin-top: 16px;">
            <strong style="font-size: 13px; color: #1e293b; display: block; margin-bottom: 8px;">Attached Screenshot:</strong>
            <img src="${screenshot}" alt="User Screenshot" style="max-width: 100%; height: auto; border-radius: 8px; border: 1px solid #cbd5e1;" />
          </div>
        ` : ''}

        <div style="margin-top: 30px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center;">
          Sent via Foclyra Automated Feedback Telemetry
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
