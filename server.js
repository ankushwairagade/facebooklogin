const express = require('express');
const fetch = require('node-fetch');
const app = express();
app.use(express.json());

// --- Configuration (hardcoded) ---
const FB_APP_ID        = '665303969425082';
const FB_APP_SECRET    = 'f5ce60bc67adbe6a24b6a46273e12b95';
const REDIRECT_URI     = 'https://facebooklogin-phi.vercel.app';
const RECIPIENT_NUMBER = '+917276517716';
const PORT = process.env.PORT || 3000;

app.post('/send_message', async (req, res) => {
  const { code, phone_number_id } = req.body;
  if (!code || !phone_number_id) {
    return res.status(400).json({ error: 'Missing code or phone_number_id' });
  }

  try {
    // 1. Exchange code for access token
    const tokenParams = new URLSearchParams({
      client_id: FB_APP_ID,
      redirect_uri: REDIRECT_URI,
      client_secret: FB_APP_SECRET,
      code
    });
    const tokenRes = await fetch(
      `https://graph.facebook.com/v22.0/oauth/access_token?${tokenParams}`
    );
    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok) {
      throw new Error(tokenJson.error?.message || 'Token exchange failed');
    }
    const accessToken = tokenJson.access_token;

    // 2. Send WhatsApp text message
    const msgRes = await fetch(
      `https://graph.facebook.com/v22.0/${phone_number_id}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: RECIPIENT_NUMBER,
          type: 'text',
          text: { body: 'Hello from WhatsApp API' }
        })
      }
    );
    const msgJson = await msgRes.json();
    if (!msgRes.ok) {
      throw new Error(msgJson.error?.message || 'Send message failed');
    }

    return res.json(msgJson);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));