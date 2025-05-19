require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');

const app = express();
app.use(helmet());
app.use(morgan('combined'));
app.use(cors({ origin: true }));
app.use(express.json());

const { FB_APP_ID, FB_APP_SECRET, REDIRECT_URI, PORT = 3000 } = process.env;
if (!FB_APP_ID || !FB_APP_SECRET || !REDIRECT_URI) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

async function graphGet(path, token) {
  const res = await fetch(`https://graph.facebook.com/v22.0/${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Graph GET error ${res.status}: ${err}`);
  }
  return res.json();
}

async function graphPost(path, token, body) {
  const res = await fetch(`https://graph.facebook.com/v22.0/${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Graph POST error ${res.status}: ${err}`);
  }
  return res.json();
}

// Exchange code for token & fetch assets
app.post('/exchange_code', async (req, res) => {
  const { code, phone_number_id } = req.body;
  if (!code || !phone_number_id) {
    return res.status(400).json({ error: 'Missing code or phone_number_id' });
  }
  try {
    const tokenData = await graphGet(
      `oauth/access_token?client_id=${FB_APP_ID}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&client_secret=${FB_APP_SECRET}` +
      `&code=${code}`
    );
    const { access_token } = tokenData;

    const [phoneDetails, templates] = await Promise.all([
      graphGet(`${phone_number_id}?fields=display_phone_number,quality_rating,verified_name_code`, access_token),
      graphGet(`${phone_number_id}/message_templates?limit=50&fields=name,language,category`, access_token)
    ]);

    res.json({ access_token, phone_number_id, phone_details: phoneDetails, message_templates: templates.data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Send template message
app.post('/send_message', async (req, res) => {
  const { access_token, phone_number_id, to, template_name, language } = req.body;
  if (!access_token || !phone_number_id || !to || !template_name || !language) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const payload = { messaging_product: 'whatsapp', to, type: 'template', template: { name: template_name, language: { code: language } } };
    const result = await graphPost(`${phone_number_id}/messages`, access_token, payload);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));