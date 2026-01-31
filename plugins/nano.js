import axios from 'axios'
import FormData from 'form-data'

const uploadToCatbox = async (buffer) => {
  const form = new FormData()
  form.append('fileToUpload', buffer, 'image.jpg')
  form.append('reqtype', 'fileupload')

  const res = await axios.post(
    'https://catbox.moe/user/api.php',
    form,
    { headers: form.getHeaders() }
  )

  return res.data.trim()
}

const handler = async (m, { conn, args }) => {
  try {
    // 1️⃣ Get image
    const quoted = m.quoted || m
    const mime = quoted.mimetype || ''

    if (!/image\/(png|jpe?g)/i.test(mime)) {
      return m.reply('❌ Reply to an image or send image with caption.')
    }

    // 2️⃣ Download image
    const imgBuffer = await quoted.download()
    if (!imgBuffer) throw 'Image download failed'

    // 3️⃣ Upload to Catbox
    m.reply('⏳ Uploading image...')
    const catboxUrl = await uploadToCatbox(imgBuffer)

    if (!catboxUrl.startsWith('https')) {
      throw 'Catbox upload failed'
    }

    // 4️⃣ Prompt
    const prompt = args.join(' ') || 'Make meme'

    // 5️⃣ Call API WITH URL (THIS IS THE FIX)
    const apiUrl =
      `https://api-faa.my.id/faa/editfoto?url=` +
      encodeURIComponent(catboxUrl) +
      `&prompt=` +
      encodeURIComponent(prompt)

    const res = await axios.get(apiUrl, {
      responseType: 'arraybuffer'
    })

    // 6️⃣ Send result
    await conn.sendMessage(
      m.chat,
      {
        image: Buffer.from(res.data),
        caption: '✅ Image edited successfully'
      },
      { quoted: m }
    )

  } catch (err) {
    console.error('EDITFOTO ERROR:', err)

    m.reply(
      `💥 Failed to edit image\n\n` +
      `Reason:\n${err?.message || err}`
    )
  }
}

handler.command = ['editfoto', 'nano']
export default handler