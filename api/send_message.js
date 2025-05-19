import fetch from 'node-fetch';

export default async function handler(req, res) {
  const { access_token, phone_number_id, to, template_name, language } = req.body;
  if (!access_token || !phone_number_id || !to || !template_name || !language) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: { name: template_name, language: { code: language } }
    };
    const resp = await fetch(
      `https://graph.facebook.com/v22.0/${phone_number_id}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }
    );
    const result = await resp.json();
    if (!resp.ok) throw new Error(JSON.stringify(result));
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}