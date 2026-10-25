import fetch from 'node-fetch'

const API = 'https://api.omegatech.app/api/ai/Nicevoice'

async function api(params) {
  const url = `${API}?${new URLSearchParams(params)}`
  const res = await fetch(url, { headers: { 'User-Agent': 'Lady-Mina/1.0' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

async function generateTTS(text, voice = 'friendly-women') {
  const gen = await api({ action: 'generate', text: text.slice(0, 500), voice })
  const taskSn = gen?.data?.taskSn || gen?.taskSn
  if (!taskSn) throw new Error('No taskSn from Nicevoice')

  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 2000))
    const st = await api({ action: 'result', taskSn })
    const d = st?.data || st
    if (d?.audioUrl && !d.pending) return d.audioUrl
    if (d?.pending === false && !d.audioUrl) throw new Error('TTS failed')
  }
  throw new Error('TTS timeout')
}

let handler = async (m, { conn, text, usedPrefix, command, args }) => {
  if (command === 'ttsvoices' || args[0] === 'list' || args[0] === 'voices') {
    try {
      const res = await api({ action: 'list' })
      const voices = res?.data?.voices || []
      let msg = '*🎙️ Nicevoice Voices*\n\n'
      voices.slice(0, 40).forEach(v => {
        msg += `• *${v.slug}* — ${v.name} (${v.gender || '?'})\n`
      })
      msg += `\nUse: ${usedPrefix}tts <voice> <text>\nOr: ${usedPrefix}tts <text> (default female)`
      return m.reply(msg)
    } catch (e) {
      return m.reply('❌ Could not list voices: ' + (e.message || e))
    }
  }

  if (!text) {
    return m.reply(`*🎙️ Lady-Mina TTS (Nicevoice)*\n\n${usedPrefix}tts Hello Mina\n${usedPrefix}tts energetic-male Hello there\n${usedPrefix}ttsvoices — list voices\n\nAlso supports clone (advanced).`)
  }

  await m.react('🔊')
  try {
    // Optional first token as voice slug
    let voice = 'friendly-women'
    let say = text
    const parts = text.trim().split(/\s+/)
    if (parts.length > 1 && /^[a-z0-9-]+$/i.test(parts[0]) && parts[0].length < 40) {
      voice = parts[0]
      say = parts.slice(1).join(' ')
    }
    const audioUrl = await generateTTS(say, voice)
    await conn.sendMessage(m.chat, {
      audio: { url: audioUrl },
      mimetype: 'audio/mpeg',
      ptt: true
    }, { quoted: m })
  } catch (e) {
    m.reply('❌ TTS failed: ' + (e.message || e))
  }
}

handler.help = ['tts', 'ttsvoices']
handler.tags = ['ai', 'tools']
handler.command = /^(tts|ttsvoices|nicevoice)$/i
handler.limit = true
export default handler

// Shared for autoai
export { generateTTS }
