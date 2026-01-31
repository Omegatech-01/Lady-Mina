import fetch from 'node-fetch'

const API = 'https://omegatech-api.dixonomega.tech/api/ai'

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
    return m.reply('💀 Network error. Sora2 not happy.')
  }

  if (!create?.status || !create?.task?.id) {
    console.log(create)
    return m.reply('💀 API responded but the task didn’t start.')
  }

  const taskId = create.task.id
  let tries = 0
  const maxTries = 30 // max 3 minutes if interval = 6s

  // 2️⃣ Poll status
  const interval = setInterval(async () => {
    tries++
    if (tries > maxTries) {
      clearInterval(interval)
      return m.reply('⏰ Took too long. Sora2 fell asleep.')
    }

    let statusRes
    try {
      statusRes = await safeFetch(`${API}/sora2-statusv2?id=${taskId}`)
    } catch {
      return // silent retry
    }

    if (statusRes?.videoStatus === 'succeeded' && statusRes.video) {
      clearInterval(interval)

      await conn.sendMessage(m.chat, {
        video: { url: statusRes.video },
        mimetype: 'video/mp4',
        caption: `🎞 Prompt: ${text}`
      })

      m.reply('✅ Video ready! Check above 👆')
    }
  }, 6000)
}

handler.command = /^sora2$/i
handler.owner = false
handler.tags = ['ai', 'video']
handler.help = ['sora2 <prompt>']

export default handler