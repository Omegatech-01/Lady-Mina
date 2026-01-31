import axios from 'axios'

const BASE_URL = 'https://ai-studio.anisaofc.my.id/api'

const headers = {
  'User-Agent':
    'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome Mobile',
  'Content-Type': 'application/json',
  'Referer': 'https://ai-studio.anisaofc.my.id/',
  'Origin': 'https://ai-studio.anisaofc.my.id'
}

async function bufferToBase64(buffer, mime) {
  return `data:${mime};base64,${buffer.toString('base64')}`
}

async function aiStudio(endpoint, buffer, mime, prompt = '') {
  const payload = {
    image: await bufferToBase64(buffer, mime)
  }

  if (endpoint === 'edit-image') {
    if (!prompt) throw 'Prompt required'
    payload.prompt = prompt
  }

  const { data } = await axios.post(
    `${BASE_URL}/${endpoint}`,
    payload,
    { headers, maxBodyLength: Infinity }
  )

  return data
}

let handler = async (m, { conn, command, text }) => {
  let q = m.quoted
  if (!q || !q.mimetype?.startsWith('image/'))
    return m.reply('Reply to an image. Yes, an *image*.')

  let buffer = await q.download()
  if (!buffer) return m.reply('Failed to download image. Congrats.')

  let mime = q.mimetype
  let endpoint, caption

  try {
    switch (command) {
      case 'aiedit':
        endpoint = 'edit-image'
        caption = `✏️ Prompt: ${text}`
        break
      case 'aifigure':
        endpoint = 'to-figure'
        caption = '🗿 Figure Mode'
        break
      case 'aicomic':
        endpoint = 'to-comic'
        caption = '📖 Comic Style'
        break
      case 'aiwm':
        endpoint = 'remove-watermark'
        caption = '🧼 Watermark Removed'
        break
    }

    let res = await aiStudio(endpoint, buffer, mime, text)

    if (!res?.success || !res.imageUrl)
      throw 'API responded with garbage'

    await conn.sendMessage(
      m.chat,
      {
        image: { url: res.imageUrl },
        caption:
          `${caption}\n\n` +
          `⚙️ Engine: AI Studio\n` +
          `👑 OMEGATECH`
      },
      { quoted: m }
    )

  } catch (e) {
    console.error(e)
    m.reply(`❌ Error:\n${e}`)
  }
}

handler.command = /^(aiedit|aifigure|aicomic|aiwm)$/i
handler.tags = ['ai', 'image']
handler.help = [
  'aiedit <prompt>',
  'aifigure',
  'aicomic',
  'aiwm'
]
handler.limit = true

export default handler