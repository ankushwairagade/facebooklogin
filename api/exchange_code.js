import fetch from 'node-fetch';

export default async function handler(req, res) {
  const { code, phone_number_id } = req.body;
  if (!code || !phone_number_id) {
    return res.status(400).json({ error: 'Missing code or phone_number_id' });
  }
  const { FB_APP_ID, FB_APP_SECRET, REDIRECT_URI } = process.env;
  try {
    // Exchange auth code
    const tokenRes = await fetch(
      `https://graph.facebook.com/v22.0/oauth/access_token?` +
      new URLSearchParams({
        client_id: FB_APP_ID,
        redirect_uri: REDIRECT_URI,
        client_secret: FB_APP_SECRET,
        code
      })
    );
    const { access_token } = await tokenRes.json();

    // Parallel fetch: phone details & templates
    const [phoneDetails, templates] = await Promise.all([
      fetch(
        `https://graph.facebook.com/v22.0/${phone_number_id}?fields=display_phone_number,quality_rating,verified_name_code`,
        { headers: { Authorization: `Bearer ${access_token}` } }
      ).then(r => r.json()),
      fetch(
        `https://graph.facebook.com/v22.0/${phone_number_id}/message_templates?limit=50&fields=name,language,category`,
        { headers: { Authorization: `Bearer ${access_token}` } }
      ).then(r => r.json())
    ]);

    return res.json({ access_token, phone_number_id, phone_details: phoneDetails, message_templates: templates.data || [] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}