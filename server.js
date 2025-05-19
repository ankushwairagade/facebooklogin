const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// --- Configuration ---
const FB_APP_ID        = '665303969425082';
const FB_APP_SECRET    = 'f5ce60bc67adbe6a24b6a46273e12b95';
const REDIRECT_URI     = 'https://facebooklogin-phi.vercel.app';
const RECIPIENT_NUMBER = '+917276517716';
const PORT             = process.env.PORT || 3000;

app.post('/send_message', async (req, res) => {
  const { code, phone_number_id } = req.body;
  if (!code || !phone_number_id) {
    return res.status(400).json({ error: 'code and phone_number_id are required' });
  }

  try {
    // Exchange code for access token
    const params   = new URLSearchParams({ client_id: FB_APP_ID, redirect_uri: REDIRECT_URI, client_secret: FB_APP_SECRET, code });
    const tokenRes = await fetch(`https://graph.facebook.com/v22.0/oauth/access_token?${params}`);
    const token   = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(token.error?.message || 'Token exchange failed');

    // Send text message
    const msgRes = await fetch(
      `https://graph.facebook.com/v22.0/${phone_number_id}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messaging_product: 'whatsapp', to: RECIPIENT_NUMBER, type: 'text', text: { body: 'Hello from WhatsApp API!' } })
      }
    );
    const msgJson = await msgRes.json();
    if (!msgRes.ok) throw new Error(msgJson.error?.message || 'Message send failed');

    return res.json(msgJson);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));