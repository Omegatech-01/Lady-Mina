import fetch from 'node-fetch'

const API = 'https://api.omegatech.app/api/ai'

async function genImage(prompt, model = 'flux') {
  // Primary: freeimage (Pollinations)
  try {
    const url = `${API}/freeimage?action=generate&prompt=${encodeURIComponent(prompt)}&model=${encodeURIComponent(model)}`
    const res = await fetch(url, { headers: { 'User-Agent': 'Lady-Mina/1.0' } })
    const json = await res.json()
    const out = json?.data?.url || json?.data?.imageUrl || json?.url || json?.result
    if (out) return out
    // Some responses only give a pollinations URL pattern
    if (json?.data?.provider === 'pollinations' && json?.data?.url) return json.data.url
  } catch (e) {
    console.error('freeimage fail:', e.message)
  }
  // Fallback: pollination2
  try {
    const url = `${API}/pollination2?action=generate&prompt=${encodeURIComponent(prompt)}&model=${encodeURIComponent(model)}`
    const res = await fetch(url, { headers: { 'User-Agent': 'Lady-Mina/1.0' } })
    const json = await res.json()
    const out = json?.data?.imageUrl || json?.data?.url || json?.url || json?.result
    if (out) return out
  } catch (e) {
    console.error('pollination2 fail:', e.message)
  }
  // Direct Pollinations CDN (uncensored, no key)
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=${encodeURIComponent(model)}&width=1024&height=1024&nologo=true`
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) {
    return m.reply(`*🖼️ Lady-Mina Image (Pollinations)*\n\nUncensored text→image.\nExample:\n${usedPrefix + command} cyberpunk city at night\n${usedPrefix + command} flux a red dragon\n\nModels: flux, turbo, flux-realism, sana`)
  }

  let model = 'flux'
  let prompt = text
  const known = ['flux', 'turbo', 'flux-realism', 'sana']
  const parts = text.trim().split(/\s+/)
  if (known.includes(parts[0].toLowerCase())) {
    model = parts[0].toLowerCase()
    prompt = parts.slice(1).join(' ')
  }
  if (!prompt) return m.reply('Add a prompt after the model name.')

  await m.react('🎨')
  try {
    const imageUrl = await genImage(prompt, model)
    await conn.sendMessage(m.chat, {
      image: { url: imageUrl },
      caption: `✨ *Lady-Mina* · ${model}\n${prompt}`
    }, { quoted: m })
  } catch (e) {
    m.reply('❌ Image gen failed: ' + (e.message || e))
  }
}

handler.help = ['txt2img', 'pollinations', 'imagine']
handler.tags = ['ai']
handler.command = /^(txt2img|pollinations|imagine|imggen|draw)$/i
handler.limit = true
export default handler
