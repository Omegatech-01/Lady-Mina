import fetch from 'node-fetch'

const API = 'https://api.omegatech.app/api/ai'

async function safeFetch(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'OMEGA-V6/1.0 (Baileys Bot)' }
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) return m.reply(`Example: ${usedPrefix + command} a cat in space`)
  await m.reply('_Generating with Sora..._')
  try {
    const data = await safeFetch(`${API}/sora?prompt=${encodeURIComponent(text)}`)
    const url = data?.result || data?.url || data?.video
    if (!url) return m.reply('No result from API.')
    await conn.sendMessage(m.chat, { video: { url }, caption: `🎬 *Sora*\n${text}` }, { quoted: m })
  } catch (e) {
    m.reply('Error: ' + (e.message || e))
  }
}
handler.help = ['sora2']
handler.tags = ['ai']
handler.command = /^(sora2|sora)$/i
handler.limit = true
export default handler
