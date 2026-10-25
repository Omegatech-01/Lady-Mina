import fetch from 'node-fetch'

const API = 'https://api.omegatech.app/api/ai/Morphai'

let handler = async (m, { conn, text, usedPrefix, command }) => {
  let q = m.quoted ? m.quoted : m
  let mime = (q.msg || q).mimetype || ''
  if (!/image/.test(mime)) return m.reply(`Reply an image with caption:\n${usedPrefix + command} <prompt>`)
  if (!text) return m.reply(`Example: ${usedPrefix + command} make it anime style`)
  await m.react('⏳')
  try {
    let media = await q.download()
    let imageUrl = null
    try {
      if (typeof global.uploadImage === 'function') imageUrl = await global.uploadImage(media)
    } catch {}
    if (!imageUrl) {
      return m.reply('Could not get image URL for API. Try again or use a hosted image.')
    }
    const url = `${API}?action=edit&imageUrl=${encodeURIComponent(imageUrl)}&prompt=${encodeURIComponent(text)}`
    const res = await fetch(url, { headers: { 'User-Agent': 'Lady-Mina/1.0' } })
    const json = await res.json()
    const out = json?.data?.url || json?.result || json?.url || json?.image
    if (!out) return m.reply('No result from image edit API.')
    await conn.sendMessage(m.chat, { image: { url: out }, caption: `✨ *Lady-Mina Edit*\n${text}` }, { quoted: m })
  } catch (e) {
    m.reply('Error: ' + (e.message || e))
  }
}
handler.help = ['qedit']
handler.tags = ['ai']
handler.command = /^(qedit|qwenedit|morph)$/i
handler.limit = true
export default handler
