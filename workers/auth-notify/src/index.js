/**
 * Or-care-stra Ensemble Auth Notification Worker
 * Sends notifications when partners access the dashboard
 * Uses ntfy.sh for instant push notifications (free, no signup required)
 */

// Partner code to name mapping - MUST match command-center.html PARTNER_NAMES
const PARTNER_CODES = {
  'ENSEMBLE2026': 'KYL Solutions (Admin)',
  'KYLSOLUTIONS': 'KYL Solutions (Internal)',
  'CHBAH-PILOT': 'Chris Hani Bara Hospital',
  'GAUTENG-DOH': 'Gauteng Dept of Health',
  'MEDTECH-SA': 'MedTech SA (Supplier)',
  'PHILIPS-RSA': 'Philips Healthcare SA',
  'PARTNER-DEMO': 'Demo Partner',
};

// ntfy.sh topic - unique to ensemble
const NTFY_TOPIC = 'ensemble-kyl-auth';

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Only accept POST
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const data = await request.json();
      const { partner, timestamp, platform } = data;

      // Validate partner code exists
      if (!partner) {
        return new Response(JSON.stringify({ error: 'Missing partner code' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      // Get partner name from code
      const partnerName = PARTNER_CODES[partner] || `Partner: ${partner}`;

      // Get client info from Cloudflare
      const clientIP = request.headers.get('CF-Connecting-IP') || 'Unknown';
      const country = request.headers.get('CF-IPCountry') || 'Unknown';
      const city = request.cf?.city || 'Unknown';

      // Format timestamp
      const accessTime = timestamp
        ? new Date(timestamp).toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })
        : new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' });

      // Build notification message
      const title = `🏥 ENSEMBLE: ${partnerName}`;
      const message = `Dashboard Access\n\nCode: ${partner}\nTime: ${accessTime}\nLocation: ${city}, ${country}\nIP: ${clientIP}\nPlatform: ${platform || 'web'}`;

      // Send push notification via ntfy.sh (free, instant)
      const ntfyResponse = await fetch(`https://ntfy.sh/${NTFY_TOPIC}`, {
        method: 'POST',
        headers: {
          'Title': title,
          'Priority': 'high',
          'Tags': 'hospital,key,chart_with_upwards_trend',
        },
        body: message,
      });

      // Log to console (viewable in Cloudflare dashboard)
      console.log(`Ensemble auth: ${partnerName} (${partner}) from ${city}, ${country} - ntfy: ${ntfyResponse.status}`);

      // Return success
      return new Response(JSON.stringify({
        success: true,
        partner: partnerName,
        message: 'Notification sent',
        ntfyStatus: ntfyResponse.status
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });

    } catch (error) {
      console.error('Ensemble auth notification error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};
