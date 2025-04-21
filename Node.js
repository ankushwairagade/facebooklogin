const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Replace with your actual values
const APP_ID = '665303969425082';
const APP_SECRET = 'f5ce60bc67adbe6a24b6a46273e12b95'; // ⚠️ Never expose this in frontend
const REDIRECT_URI = 'https://www.facebook.com';

app.post('/exchange_code', async (req, res) => {
  const { code, phone_number_id } = req.body;

  const params = new URLSearchParams({
    client_id: APP_ID,
    client_secret: APP_SECRET,
    redirect_uri: REDIRECT_URI,
    code
  });

  try {
    const tokenRes = await fetch(`https://graph.facebook.com/v22.0/oauth/access_token?${params}`);
    const tokenData = await tokenRes.json();

    if (tokenData.access_token) {
      res.json({
        access_token: tokenData.access_token,
        phone_number_id
      });
    } else {
      res.status(400).json({ error: 'Invalid token response', details: tokenData });
    }
  } catch (err) {
    console.error('Error exchanging code:', err);
    res.status(500).send('Token exchange failed');
  }
});

app.post('/send_message', async (req, res) => {
  const { token, phone_number_id, to } = req.body;

  try {
    const result = await fetch(`https://graph.facebook.com/v18.0/${phone_number_id}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: 'hello_world',
          language: { code: 'en_US' }
        }
      })
    });

    const responseData = await result.json();
    res.json(responseData);
  } catch (err) {
    console.error('Message send failed:', err);
    res.status(500).send('Sending message failed');
  }
});

app.listen(3000, () => console.log('🚀 Backend running at http://localhost:3000'));
