import fetch from 'node-fetch'

const API = 'https://api.omegatech.app/api/ai'

async function safeFetch(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'OMEGA-V6/1.0 (Baileys Bot)' }
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

let handler = async (m, { conn, text }) => {
  if (!text) return m.reply('Type a prompt for Sora2 to animate.')

  m.reply('🎬 Generating video… patience is a virtue.')

  // 1️⃣ Create task
  let create
  try {
    create = await safeFetch(
      `${API}/Sora2-createv2?prompt=${encodeURIComponent(text)}&ratio=9:16`
    )
  } catch (e) {
    console.error(e)
    return m.reply('❌ Failed to start generation.')
  }

  if (!create?.id) return m.reply('❌ No task id returned.')

  // 2️⃣ Poll status
  let result = null
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 5000))
    try {
      const st = await safeFetch(`${API}/Sora2-statusv2?id=${create.id}`)
      if (st?.status === 'completed' || st?.video || st?.url) {
        result = st
        break
      }
      if (st?.status === 'failed') return m.reply('❌ Generation failed.')
    } catch (e) {
      console.error(e)
    }
  }

  if (!result) return m.reply('⌛ Timed out waiting for video.')

  const url = result.video || result.url || result.result
  if (!url) return m.reply('❌ No video URL in response.')

  await conn.sendMessage(m.chat, {
    video: { url },
    caption: `🎬 *Sora2*\n${text}`
  }, { quoted: m })
}

handler.help = ['sora2']
handler.tags = ['ai']
handler.command = /^(sora2)$/i
handler.limit = true
export default handler
