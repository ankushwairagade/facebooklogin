import fetch from 'node-fetch';

export default async function handler(req, res) {
  console.log('📥 /send_message payload:', req.body);
  const { access_token, phone_number_id, to, template_name, language } = req.body;
  if (!access_token || !phone_number_id || !to || !template_name || !language) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    console.log('🔄 Sending WhatsApp template message');
    const response = await fetch(
      `https://graph.facebook.com/v22.0/${phone_number_id}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'template',
          template: { name: template_name, language: { code: language } }
        })
      }
    );
    const result = await response.json();
    console.log('📤 /send_message response', result);
    if (!response.ok) throw new Error(JSON.stringify(result));
    res.status(200).json(result);
  } catch (err) {
    console.error('❌ send_message error:', err);
    res.status(500).json({ error: err.message });
  }
}