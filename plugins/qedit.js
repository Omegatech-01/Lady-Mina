import fetch from 'node-fetch'
import FormData from 'form-data'

async function uploadToCatbox(buffer) {
  let form = new FormData()
  form.append('reqtype', 'fileupload')
  form.append('fileToUpload', buffer, 'image.jpg')

  let res = await fetch('https://catbox.moe/user/api.php', {
    method: 'POST',
    body: form
  })

  return await res.text()
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text)
    return m.reply(`Reply to an image with:\n${usedPrefix + command} <prompt>`)

  let q = m.quoted
  if (!q || !q.mimetype || !q.mimetype.startsWith('image/'))
    return m.reply('❌ Reply to an IMAGE. Not your life story.')

  try {
    // download image
    let buffer = await q.download()
    if (!buffer) throw 'Image download failed'

    // upload image
    let imageUrl = await uploadToCatbox(buffer)
    if (!imageUrl.startsWith('https'))
      throw 'Image upload failed'

    // call API
    let api =
      'https://omegatech-api.dixonomega.tech/api/ai/Qwen-image-edit' +
      `?image=${encodeURIComponent(imageUrl)}` +
      `&prompt=${encodeURIComponent(text)}`

    let res = await fetch(api)
    let json = await res.json()

    if (!json.status || !json.data?.image)
      throw 'API returned nonsense'

    await conn.sendMessage(
      m.chat,
      {
        image: { url: json.data.image },
        caption:
          `🖼️ *Image Edited*\n\n` +
          `📝 Prompt: ${text}\n` +
          `⚙️ Engine: Qwen\n` +
          `👑 OMEGATECH`
      },
      { quoted: m }
    )

  } catch (err) {
    console.error(err)
    m.reply(`❌ Error:\n${err}`)
  }
}

handler.help = ['qedit <prompt>']
handler.tags = ['ai', 'image']
handler.command = /^qedit$/i
handler.limit = true

export default handler