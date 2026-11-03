/**
 * Foclyra Production Direct Feedback Serverless Endpoint.
 * Transmits feedback and screenshot directly to the administrator inbox via Resend.
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

    const pageUrl = telemetry?.url || '';

    // Clean Minimalist Editorial HTML Email Body (Extra noisy telemetry removed)
    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px 16px; background-color: #f4f4f5;">
        <div style="background-color: #ffffff; border-radius: 20px; border: 1px solid #e4e4e7; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
          
          <!-- Header -->
          <div style="padding: 24px 28px 16px 28px; border-bottom: 1px solid #f4f4f5;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
              <span style="display: inline-block; padding: 3px 10px; border-radius: 100px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; background: ${badgeColor};">
                ${cleanCategory}
              </span>
              ${pageUrl ? `<span style="font-size: 11.5px; color: #71717a;">Page: <code style="font-family: monospace; background: #f4f4f5; padding: 2px 6px; border-radius: 6px; color: #18181b;">${pageUrl}</code></span>` : ''}
            </div>
            <h2 style="margin: 6px 0 2px 0; font-size: 19px; color: #09090b; letter-spacing: -0.02em;">User Feedback</h2>
            <p style="margin: 0; font-size: 13px; color: #71717a;">From: <strong>${cleanName}</strong> (<a href="mailto:${cleanEmail}" style="color: #09090b; text-decoration: underline;">${cleanEmail}</a>)</p>
          </div>

          <!-- Body -->
          <div style="padding: 20px 28px 24px 28px;">
            <h3 style="font-size: 11px; text-transform: uppercase; color: #71717a; letter-spacing: 0.05em; margin: 0 0 8px 0;">Message:</h3>
            <div style="background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 14px; padding: 16px; font-size: 14px; line-height: 1.6; color: #18181b; white-space: pre-wrap;">${message.trim()}</div>

            ${screenshot ? `
              <div style="margin-top: 18px;">
                <h3 style="font-size: 11px; text-transform: uppercase; color: #71717a; letter-spacing: 0.05em; margin: 0 0 8px 0;">Attached Screenshot:</h3>
                <img src="cid:user-screenshot" alt="User Screenshot" style="max-width: 100%; height: auto; border-radius: 12px; border: 1px solid #e4e4e7; display: block;" />
              </div>
            ` : ''}

            <!-- Quick Reply Action -->
            <div style="text-align: center; margin-top: 24px;">
              <a href="mailto:${cleanEmail}?subject=Re:%20[Foclyra%20${cleanCategory}]%20Feedback" style="display: inline-block; background-color: #09090b; color: #ffffff !important; font-size: 12.5px; font-weight: 600; text-decoration: none; padding: 10px 24px; border-radius: 100px;">
                Reply to ${cleanName} →
              </a>
            </div>
          </div>

          <!-- Clean Minimal Footer -->
          <div style="border-top: 1px solid #f4f4f5; padding: 12px 28px; text-align: center; font-size: 11px; color: #a1a1aa;">
            Foclyra Feedback Notification
          </div>
        </div>
      </div>
    `;

    // 1. Primary: Resend API Direct Delivery
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      const attachments = [];
      if (screenshot && typeof screenshot === 'string') {
        let base64Data = screenshot;
        let contentType = 'image/jpeg';
        if (screenshot.includes(',')) {
          const parts = screenshot.split(',');
          base64Data = parts[1];
          const mimeMatch = parts[0].match(/:(.*?);/);
          if (mimeMatch) contentType = mimeMatch[1];
        }
        if (base64Data && base64Data.trim().length > 50) {
          attachments.push({
            filename: contentType.includes('png') ? 'screenshot.png' : 'screenshot.jpg',
            content: base64Data.trim(),
            content_id: 'user-screenshot',
            contentId: 'user-screenshot',
            content_type: contentType,
            content_disposition: 'inline',
            disposition: 'inline'
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
        return response.status(200).json({
          success: true,
          provider: 'resend',
          message: 'Thank you! Your feedback and diagnostics have been successfully submitted.'
        });
      }

      // If Resend failed with an error, extract details for logging
      const resendErr = await resendRes.json().catch(() => ({}));
      console.error('Resend delivery error:', resendErr);
      return response.status(resendRes.status || 500).json({
        error: resendErr.message || 'Resend was unable to deliver the email. Please check your RESEND_API_KEY.'
      });
    }

    // 2. Secondary Provider: Web3Forms (if configured)
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
          message: `${message}\n\nPage: ${pageUrl}`,
          from_name: 'Foclyra Feedback'
        })
      });

      if (w3Res.ok) {
        return response.status(200).json({
          success: true,
          provider: 'web3forms',
          message: 'Thank you! Your feedback has been successfully submitted.'
        });
      }
    }

    return response.status(500).json({
      error: 'Email delivery service is not configured. Please add RESEND_API_KEY in Vercel Project Settings > Environment Variables.'
    });

  } catch (error) {
    console.error('Feedback delivery exception:', error);
    return response.status(500).json({ error: `Failed to deliver feedback: ${error.message}` });
  }
}
