import axios from 'axios'

function parseTime(str) {
  const match = str.match(/^(\d+)(sec|s|min|m|hour|h)$/i)
  if (!match) return null
  let value = parseInt(match[1])
  const unit = match[2].toLowerCase()
  let ms;
  switch (unit) {
    case 'sec': case 's': ms = value * 1000; break
    case 'min': case 'm': ms = value * 60 * 1000; break
    case 'hour': case 'h': ms = value * 60 * 60 * 1000; break
    default: return null
  }
  return ms < 10000 ? 10000 : ms
}

global.autoGcppJobs = global.autoGcppJobs || {}

async function getImageBuffer(type) {
  try {
    const api = `https://omegatech-api.dixonomega.tech/api/tools/wallpaper?name=${encodeURIComponent(type)}`
    const res = await axios.get(api, { timeout: 15000 })
    if (!res.data?.results?.length) return null
    const pick = res.data.results[Math.floor(Math.random() * res.data.results.length)]
    const img = await axios.get(pick.image, { responseType: 'arraybuffer' })
    return Buffer.from(img.data)
  } catch { return null }
}

// 🛡️ RECOVERY WRAPPER: Retries on 500 error
async function updateWithRetry(conn, jid, type, retries = 2) {
  const buffer = await getImageBuffer(type)
  if (!buffer) return

  try {
    await conn.updateProfilePicture(jid, buffer)
    console.log(`[AUTO-GCPP] Success: ${jid}`)
  } catch (e) {
    console.error(`[AUTO-GCPP] Error: ${e.message}`)
    
    // If it's a Server Error (500), wait 3s and retry
    if (e.message.includes('500') && retries > 0) {
      console.log(`[AUTO-GCPP] 500 detected. Retrying... (${retries} left)`)
      await new Promise(resolve => setTimeout(resolve, 3000))
      return updateWithRetry(conn, jid, type, retries - 1)
    }

    // If it's a Rate Limit (429), stop the job
    if (e.message.includes('429')) {
      clearInterval(global.autoGcppJobs[jid])
      delete global.autoGcppJobs[jid]
      conn.sendMessage(jid, { text: "❌ *Auto-Stopped:* Too many requests (429). Please wait 30 mins." })
    }
  }
}

const handler = async (m, { text, conn, isBotAdmin }) => {
  if (!m.isGroup || !isBotAdmin) return
  const chatId = m.chat

  if (text.toLowerCase() === 'stop') {
    if (global.autoGcppJobs[chatId]) {
      clearInterval(global.autoGcppJobs[chatId])
      delete global.autoGcppJobs[chatId]
      return m.reply("✅ *Stopped.*")
    }
    return
  }

  let [type, timeStr] = text.split('|').map(v => v.trim())
  const ms = parseTime(timeStr || "1min")

  if (!ms) return m.reply("❌ Invalid time format.")
  if (global.autoGcppJobs[chatId]) clearInterval(global.autoGcppJobs[chatId])

  try {
    // 🔥 Start immediately
    await updateWithRetry(conn, chatId, type)
    
    // 🔁 Set loop with recovery
    global.autoGcppJobs[chatId] = setInterval(() => {
      updateWithRetry(conn, chatId, type)
    }, ms)

    m.reply(`✅ *Auto-GCPP v7 (Recovery Mode) Active*\n🕒 Interval: ${timeStr}\n\n_Note: Server errors (500) will be handled automatically._`)
  } catch (e) {
    m.reply(`❌ Error: ${e.message}`)
  }
}

handler.help = ['autogcpp']
handler.tags = ['group']
handler.command = /^autogcpp$/i
handler.admin = true
handler.botAdmin = true

export default handler