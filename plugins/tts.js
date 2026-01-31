import axios from 'axios'

const IFRAME_URL = 'https://plachta-vits-umamusume-voice-synthesizer.hf.space'

const CHAR_MAP = {
  grass: '草上飞 Grass Wonder (Umamusume Pretty Derby)',
  goldship: '黄金船 Gold Ship (Umamusume Pretty Derby)',
  teio: '东海帝王 Tokai Teio (Umamusume Pretty Derby)',
  raiden: '雷电将军 Raiden Shogun (Genshin Impact)',
  hutao: '胡桃 Hu Tao (Genshin Impact)',
  ayaka: '神里绫华 Kamisato Ayaka (Genshin Impact)',
  paimon: '派蒙 Paimon (Genshin Impact)'
}

const LANG_MAP = {
  jp: '日本語',
  en: 'English',
  cn: '简体中文',
  mix: 'Mix'
}

async function generateTTS(text, character, language) {
  const session = Math.random().toString(36).slice(2)

  await axios.post(`${IFRAME_URL}/gradio_api/queue/join`, {
    data: [
      text,
      character,
      language,
      1.0,
      false
    ],
    fn_index: 2,
    session_hash: session,
    trigger_id: 24
  })

  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 2000))

    const res = await axios.get(
      `${IFRAME_URL}/gradio_api/queue/data?session_hash=${session}`,
      { responseType: 'text' }
    )

    const lines = res.data.split('\n')
    for (const line of lines) {
      if (!line.startsWith('data:')) continue
      const json = JSON.parse(line.replace('data: ', ''))

      if (json.msg === 'process_completed') {
        for (const item of json.output.data) {
          if (typeof item === 'string' && item.endsWith('.wav')) {
            return `${IFRAME_URL}/gradio_api/file=${item}`
          }
        }
      }
    }
  }

  throw 'TTS timeout'
}

const handler = async (m, { text, conn }) => {
  if (!text) {
    return m.reply(
`🧪 *Lady-Trish TTS*
Usage:
.tts <character>|<lang> <text>

Example:
.tts grass|jp Hello trainer
.tts raiden|en I will protect you`
    )
  }

  const [meta, ...msg] = text.split(' ')
  const [charKey, langKey] = meta.split('|')

  const character = CHAR_MAP[charKey?.toLowerCase()] || CHAR_MAP.grass
  const language = LANG_MAP[langKey?.toLowerCase()] || LANG_MAP.jp
  const content = msg.join(' ')

  m.react('🧪')

  try {
    const audioUrl = await generateTTS(content, character, language)

    await conn.sendMessage(
      m.chat,
      {
        audio: { url: audioUrl },
        mimetype: 'audio/wav',
        ptt: true
      },
      { quoted: m }
    )
  } catch (e) {
    console.error(e)
    m.reply('❌ TTS generation failed')
  }
}

handler.help = ['tts']
handler.tags = ['ai']
handler.command = /^tts|t2p| text2speech$/i

export default handler