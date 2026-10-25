import fetch from 'node-fetch'

const API = 'https://api.omegatech.app/api/ai'

async function safeFetch(url, timeoutMs = 30000) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Lady-Mina/1.0' },
      signal: ctrl.signal
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
  } finally {
    clearTimeout(t)
  }
}

function pickVideo(data) {
  return data?.result || data?.video || data?.url || data?.data?.url || data?.data?.video || data?.data?.result || null
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) return m.reply(`*🎬 Lady-Mina Text→Video*\n\nExample:\n${usedPrefix + command} a cute cat walking in the rain\n\n_May take 1–10 minutes._`)

  await m.reply('🎬 *Lady-Mina* is generating video… this can take several minutes.')

  try {
    // 1) Ai-video (FreeAIVideos) — longer wait
    try {
      const data = await safeFetch(
        `${API}/Ai-video?prompt=${encodeURIComponent(text)}&maxWait=300`,
        320000
      )
      const url = pickVideo(data)
      if (url) {
        return conn.sendMessage(m.chat, {
          video: { url },
          caption: `🎬 *Lady-Mina Video*\n${text}`
        }, { quoted: m })
      }
    } catch (e) {
      console.error('Ai-video failed:', e.message)
    }

    // 2) veo3 sync
    try {
      const data = await safeFetch(`${API}/veo3?prompt=${encodeURIComponent(text)}`, 60000)
      const url = pickVideo(data)
      if (url) {
        return conn.sendMessage(m.chat, {
          video: { url },
          caption: `🎬 *Lady-Mina Video*\n${text}`
        }, { quoted: m })
      }
    } catch (e) {
      console.error('veo3 failed:', e.message)
    }

    // 3) Veo3-v3 async poll
    try {
      const create = await safeFetch(`${API}/Veo3-v3?prompt=${encodeURIComponent(text)}`, 30000)
      const taskId = create?.id || create?.taskId || create?.task_id || create?.result?.id
      if (taskId) {
        for (let i = 0; i < 24; i++) {
          await new Promise(r => setTimeout(r, 5000))
          try {
            const st = await safeFetch(`${API}/Veo3-v3-status?id=${encodeURIComponent(taskId)}`, 20000)
            const u = pickVideo(st)
            if (u) {
              return conn.sendMessage(m.chat, {
                video: { url: u },
                caption: `🎬 *Lady-Mina Video*\n${text}`
              }, { quoted: m })
            }
            if (st?.status === 'failed' || st?.error) break
          } catch {}
        }
      }
    } catch (e) {
      console.error('Veo3-v3 failed:', e.message)
    }

    return m.reply('❌ Video generation is currently unavailable on the API side. Try again later.')
  } catch (e) {
    m.reply('❌ Error: ' + (e.message || e))
  }
}

handler.help = ['sora2', 'veo', 'aivideo']
handler.tags = ['ai']
handler.command = /^(sora2|sora|veo|veovid|aivideo)$/i
handler.limit = true
export default handler
