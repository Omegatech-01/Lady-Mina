import fetch from 'node-fetch'

const API = 'https://api.omegatech.app/api/ai'

async function safeFetch(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Lady-Mina/1.0' }
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) return m.reply(`Example: ${usedPrefix + command} a cute cat walking in the rain`)

  await m.reply('🎬 *Lady-Mina* is generating video… this can take a minute.')

  try {
    const data = await safeFetch(`${API}/veo3?prompt=${encodeURIComponent(text)}`)
    const url = data?.result || data?.video || data?.url || data?.data?.url || data?.data?.video
    if (url) {
      return conn.sendMessage(m.chat, {
        video: { url },
        caption: `🎬 *Lady-Mina Video*\n${text}`
      }, { quoted: m })
    }

    const create = await safeFetch(`${API}/Veo3-v3?prompt=${encodeURIComponent(text)}`)
    const taskId = create?.id || create?.taskId || create?.task_id || create?.result?.id
    if (!taskId) return m.reply('❌ No video URL or task id returned. API may be busy — try again later.')

    let result = null
    for (let i = 0; i < 24; i++) {
      await new Promise(r => setTimeout(r, 5000))
      try {
        const st = await safeFetch(`${API}/Veo3-v3-status?id=${encodeURIComponent(taskId)}`)
        const u = st?.video || st?.url || st?.result || st?.data?.url
        if (u) { result = u; break }
        if (st?.status === 'failed' || st?.error) return m.reply('❌ Generation failed.')
      } catch {}
    }
    if (!result) return m.reply('⌛ Timed out waiting for video.')
    await conn.sendMessage(m.chat, {
      video: { url: result },
      caption: `🎬 *Lady-Mina Video*\n${text}`
    }, { quoted: m })
  } catch (e) {
    m.reply('❌ Error: ' + (e.message || e))
  }
}

handler.help = ['sora2', 'veo']
handler.tags = ['ai']
handler.command = /^(sora2|sora|veo|veovid)$/i
handler.limit = true
export default handler
