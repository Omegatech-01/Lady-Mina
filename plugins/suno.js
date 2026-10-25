import axios from 'axios'

const API = 'https://api.omegatech.app/api/ai/sonu3'

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) {
    return m.reply(`*🎵 Lady-Mina Music Generation*\n\nDescribe the song (genre, mood, topic).\n*Example:* ${usedPrefix + command} A high energy afrobeat song about Mina`)
  }

  await m.reply('🎶 Generating song… please wait.')

  try {
    const { data } = await axios.get(API, {
      params: { action: 'full', prompt: text },
      timeout: 180000
    })

    const song = data?.result || data?.data || data
    const audio = song?.audio || song?.url || song?.audioUrl || song?.audio_url
    const title = song?.title || 'Lady-Mina Track'
    const lyrics = song?.lyrics || ''

    if (!audio) {
      const gen = await axios.get(API, { params: { action: 'generate', prompt: text }, timeout: 30000 })
      const taskId = gen.data?.taskId || gen.data?.id || gen.data?.result?.taskId
      if (!taskId) return m.reply('❌ No audio returned. Try a different prompt.')

      let audioUrl = null
      for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 5000))
        const st = await axios.get(API, { params: { action: 'result', taskId }, timeout: 20000 })
        const s = st.data?.result || st.data?.data || st.data
        audioUrl = s?.audio || s?.url || s?.audioUrl
        if (audioUrl) {
          await conn.sendMessage(m.chat, {
            audio: { url: audioUrl },
            mimetype: 'audio/mpeg',
            fileName: `${title}.mp3`
          }, { quoted: m })
          return m.reply(`✅ *${s?.title || title}*\n${(s?.lyrics || '').slice(0, 500)}`)
        }
      }
      return m.reply('⌛ Timed out waiting for music.')
    }

    await conn.sendMessage(m.chat, {
      audio: { url: audio },
      mimetype: 'audio/mpeg',
      fileName: `${title}.mp3`
    }, { quoted: m })
    if (lyrics) m.reply(`✅ *${title}*\n\n${lyrics.slice(0, 800)}`)
    else m.reply(`✅ *${title}*`)
  } catch (e) {
    m.reply('❌ Music generation failed: ' + (e.message || e))
  }
}

handler.help = ['suno', 'gensong']
handler.tags = ['ai']
handler.command = /^(suno|gensong|sonu)$/i
handler.limit = true
export default handler
