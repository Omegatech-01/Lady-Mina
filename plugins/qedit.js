import fetch from 'node-fetch'

const BASE = 'https://api.omegatech.app/api/ai'

async function tryEdit(imageUrl, prompt) {
  // 1) Morphai (stable)
  try {
    const url = `${BASE}/Morphai?action=edit&imageUrl=${encodeURIComponent(imageUrl)}&prompt=${encodeURIComponent(prompt)}`
    const res = await fetch(url, { headers: { 'User-Agent': 'Lady-Mina/1.0' } })
    const json = await res.json()
    const out = json?.data?.url || json?.result || json?.url || json?.image
    if (out) return out
  } catch (e) {
    console.error('Morphai:', e.message)
  }
  // 2) nano-banana (url param)
  try {
    const url = `${BASE}/nano-banana?action=edit&url=${encodeURIComponent(imageUrl)}&prompt=${encodeURIComponent(prompt)}`
    const res = await fetch(url, { headers: { 'User-Agent': 'Lady-Mina/1.0' } })
    const json = await res.json()
    const out = json?.data?.url || json?.result || json?.url || json?.image
    if (out) return out
  } catch (e) {
    console.error('nano-banana:', e.message)
  }
  // 3) ai-nanobanana
  try {
    const url = `${BASE}/ai-nanobanana?action=generate&prompt=${encodeURIComponent(prompt)}&imageUrl=${encodeURIComponent(imageUrl)}`
    const res = await fetch(url, { headers: { 'User-Agent': 'Lady-Mina/1.0' } })
    const json = await res.json()
    const out = json?.data?.url || json?.result || json?.url || json?.image
    if (out) return out
  } catch (e) {
    console.error('ai-nanobanana:', e.message)
  }
  return null
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
  const q = m.quoted ? m.quoted : m
  const mime = (q.msg || q).mimetype || ''
  if (!/image/.test(mime)) {
    return m.reply(`Reply an image:\n${usedPrefix + command} make it anime style`)
  }
  if (!text) return m.reply(`Example: ${usedPrefix + command} make it anime style`)

  await m.react('⏳')
  try {
    const media = await q.download()
    let imageUrl = null
    try {
      if (typeof global.uploadImage === 'function') imageUrl = await global.uploadImage(media)
    } catch {}
    if (!imageUrl) {
      return m.reply('Could not upload image for API. Try again.')
    }
    const out = await tryEdit(imageUrl, text)
    if (!out) return m.reply('❌ No result from image-edit APIs (Morphai / nano-banana).')
    await conn.sendMessage(m.chat, {
      image: { url: out },
      caption: `✨ *Lady-Mina Edit*\n${text}`
    }, { quoted: m })
  } catch (e) {
    m.reply('Error: ' + (e.message || e))
  }
}

handler.help = ['qedit', 'nano']
handler.tags = ['ai']
handler.command = /^(qedit|qwenedit|morph|nano|nanobanana)$/i
handler.limit = true
export default handler
