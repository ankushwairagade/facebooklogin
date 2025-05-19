import fetch from 'node-fetch';

export default async function handler(req, res) {
  console.log('📥 /exchange_code payload:', req.body);
  const { FB_APP_ID, FB_APP_SECRET, REDIRECT_URI } = process.env;
  const { code, phone_number_id } = req.body;
  if (!code || !phone_number_id) {
    return res.status(400).json({ error: 'Missing code or phone_number_id' });
  }
  try {
    // 1️⃣ Exchange auth code
    console.log('🔄 Exchanging code for token');
    const tokenRes = await fetch(
      `https://graph.facebook.com/v22.0/oauth/access_token` +
      `?client_id=${FB_APP_ID}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&client_secret=${FB_APP_SECRET}` +
      `&code=${code}`
    );
    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(JSON.stringify(tokenJson));
    const { access_token } = tokenJson;

    // 2️⃣ Fetch phone details & templates
    console.log('🔄 Fetching phone details & templates');
    const [phoneDetailsRes, templatesRes] = await Promise.all([
      fetch(
        `https://graph.facebook.com/v22.0/${phone_number_id}` +
        `?fields=display_phone_number,quality_rating,verified_name_code`,
        { headers: { Authorization: `Bearer ${access_token}` } }
      ),
      fetch(
        `https://graph.facebook.com/v22.0/${phone_number_id}/message_templates` +
        `?limit=50&fields=name,language,category`,
        { headers: { Authorization: `Bearer ${access_token}` } }
      )
    ]);
    const phoneDetails = await phoneDetailsRes.json();
    const templates = await templatesRes.json();

    console.log('📤 /exchange_code response');
    res.status(200).json({
      access_token,
      phone_number_id,
      phone_details: phoneDetails,
      message_templates: templates.data || []
    });
  } catch (err) {
    console.error('❌ exchange_code error:', err);
    res.status(500).json({ error: err.message });
  }
}