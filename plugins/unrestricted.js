import axios from 'axios'
import * as cheerio from 'cheerio'

const STYLES = [
  'photorealistic',
  'digital-art',
  'impressionist',
  'anime',
  'fantasy',
  'sci-fi',
  'vintage'
]

async function unrestrictedAI(prompt, style = 'anime') {
  if (!prompt) throw 'Prompt is required'
  if (!STYLES.includes(style)) {
    throw `Available styles: ${STYLES.join(', ')}`
  }

  // Step 1: get nonce
  const { data: html } = await axios.get(
    'https://unrestrictedaiimagegenerator.com/',
    {
      headers: {
        origin: 'https://unrestrictedaiimagegenerator.com',
        referer: 'https://unrestrictedaiimagegenerator.com/',
        'user-agent': 'Mozilla/5.0 (Android)'
      }
    }
  )

  const $ = cheerio.load(html)
  const nonce = $('input[name="_wpnonce"]').attr('value')
  if (!nonce) throw 'Nonce not found'

  // Step 2: generate image
  const { data } = await axios.post(
    'https://unrestrictedaiimagegenerator.com/',
    new URLSearchParams({
      generate_image: true,
      image_description: prompt,
      image_style: style,
      _wpnonce: nonce
    }).toString(),
    {
      headers: {
        origin: 'https://unrestrictedaiimagegenerator.com',
        referer: 'https://unrestrictedaiimagegenerator.com/',
        'content-type': 'application/x-www-form-urlencoded',
        'user-agent': 'Mozilla/5.0 (Android)'
      }
    }
  )

  const $$ = cheerio.load(data)
  let img = $$('img#resultImage').attr('src')
  if (!img) throw 'No image result'

  // Make absolute URL if needed
  if (!img.startsWith('http')) img = 'https://unrestrictedaiimagegenerator.com' + img

  // Fetch image as buffer
  const imageResponse = await axios.get(img, { responseType: 'arraybuffer' })
  return Buffer.from(imageResponse.data, 'binary')
}

const handler = async (m, { text, conn }) => {
  if (!text) {
    return m.reply(
      `❌ Usage:\n.unrestricted <style>|<prompt>\n\nStyles:\n${STYLES.join(', ')}`
    )
  }

  let style = 'anime'
  let prompt = text

  if (text.includes('|')) {
    const split = text.split('|')
    style = split[0].trim().toLowerCase()
    prompt = split.slice(1).join('|').trim()
  }

  m.react('🎨')

  try {
    const imgBuffer = await unrestrictedAI(prompt, style)

    await conn.sendMessage(
      m.chat,
      {
        image: imgBuffer,
        caption: `🎨 *Unrestricted AI*\nStyle: ${style}\n📝 Prompt: ${prompt}`
      },
      { quoted: m }
    )
  } catch (e) {
    console.error(e)
    m.reply(`💥 Failed: ${e}`)
  }
}

handler.help = ['unrestricted']
handler.tags = ['ai']
handler.command = /^unrestricted$/i

export default handler