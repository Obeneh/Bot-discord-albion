const axios = require('axios');
const config = require('../config.json');

async function downloadImage(url) {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(response.data);
}

function findMember(guild, name) {
  const lower = name.toLowerCase();
  return guild.members.cache.find(
    m =>
      m.user.username.toLowerCase() === lower ||
      m.displayName.toLowerCase() === lower ||
      m.user.globalName?.toLowerCase() === lower
  ) || null;
}

// Match flou : le pseudo du membre CONTIENT le token OCR (min 5 chars, sens unique)
// Évite que "Style" matche à la fois "LumpyoStyle" ET "Style"
function findMemberFuzzy(guild, token) {
  if (token.length < 5) return null;
  const t = token.toLowerCase();
  return guild.members.cache.find(m => {
    const u = m.user.username.toLowerCase();
    const d = m.displayName.toLowerCase();
    const g = m.user.globalName?.toLowerCase() ?? '';
    return u.includes(t) || d.includes(t) || g.includes(t);
  }) || null;
}

async function runOCR(imageBuffer) {
  const response = await axios.post(
    `https://vision.googleapis.com/v1/images:annotate?key=${config.googleVisionApiKey}`,
    {
      requests: [{
        image: { content: imageBuffer.toString('base64') },
        features: [{ type: 'TEXT_DETECTION' }],
      }],
    }
  );

  const annotations = response.data.responses?.[0]?.textAnnotations ?? [];
  if (annotations.length === 0) return [];

  // Filtres : min 3 chars, alphanum/underscore, pas que des chiffres, pas 4+ chiffres consécutifs
  return [...new Set(
    annotations
      .slice(1)
      .map(a => a.description.trim())
      .filter(w =>
        w.length >= 3 &&
        /^[A-Za-z0-9_]+$/.test(w) &&
        !/^\d+$/.test(w) &&
        !/\d{4,}/.test(w)
      )
  )];
}

module.exports = { downloadImage, findMember, findMemberFuzzy, runOCR };
