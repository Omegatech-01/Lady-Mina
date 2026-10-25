import fetch from 'node-fetch'

let handler = async (m, { conn, text, usedPrefix, command }) => {
  let q = m.quoted ? m.quoted : m
  let mime = (q.msg || q).mimetype || ''
  if (!/image/.test(mime)) return m.reply(`Reply an image with caption:\n${usedPrefix + command} <prompt>`)
  if (!text) return m.reply(`Example: ${usedPrefix + command} make it anime style`)
  await m.react('⏳')
  try {
    let media = await q.download()
    // upload helper if available - fallback: skip if no URL
    let imageUrl = null
    try {
      // try common uploaders in this bot ecosystem
      if (typeof global.uploadImage === 'function') imageUrl = await global.uploadImage(media)
    } catch {}
    if (!imageUrl) {
      // last resort: send as base path not supported; ask user
      return m.reply('Could not get image URL for API. Try again or use a hosted image.')
    }
    let api =
      'https://api.omegatech.app/api/ai/Qwen-image-edit' +
      `?image=${encodeURIComponent(imageUrl)}` +
      `&prompt=${encodeURIComponent(text)}`
    let res = await fetch(api)
    let json = await res.json()
    let out = json?.result || json?.url || json?.image
    if (!out) return m.reply('No result from image edit API.')
    await conn.sendMessage(m.chat, { image: { url: out }, caption: `✨ ${text}` }, { quoted: m })
  } catch (e) {
    m.reply('Error: ' + (e.message || e))
  }
}
handler.help = ['qedit']
handler.tags = ['ai']
handler.command = /^(qedit|qwenedit)$/i
handler.limit = true
export default handler
