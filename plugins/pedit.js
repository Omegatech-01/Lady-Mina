import axios from 'axios'
import { wrapper } from 'axios-cookiejar-support'
import { CookieJar } from 'tough-cookie'
import FormData from 'form-data'
import fetch from 'node-fetch'

/*
  PhotoEditorAI WhatsApp Plugin
  No excuses. Reply to image or get roasted by life.
*/

const BASE_URL = 'https://photoeditorai.io'
const API_BASE = 'https://api.photoeditorai.io/pe/photo-editor'
const SITE_KEY = '0x4AAAAAACLCCZe3S9swHyiM'

const headers = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Origin: BASE_URL,
  Referer: `${BASE_URL}/`,
  Accept: 'application/json, text/plain, */*'
}

const jar = new CookieJar()
const client = wrapper(axios.create({ jar }))

const sleep = ms => new Promise(r => setTimeout(r, ms))

function serial() {
  return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

async function solveTurnstile() {
  try {
    const { data } = await axios.post(
      'https://cloudflare.ryzecodes.xyz/api/bypass/cf-turnstile',
      { url: BASE_URL, siteKey: SITE_KEY },
      { headers: { 'Content-Type': 'application/json' } }
    )
    return data?.data?.token || ''
  } catch {
    return ''
  }
}

async function createJob(imageBuffer, prompt) {
  const form = new FormData()
  form.append('target_images', imageBuffer, {
    filename: 'image.jpg',
    contentType: 'image/jpeg'
  })
  form.append('prompt', prompt)
  form.append('model_name', 'photoeditor_3.0')
  form.append('turnstile_token', await solveTurnstile())

  const res = await client.post(`${API_BASE}/create-job-v2`, form, {
    headers: {
      ...headers,
      ...form.getHeaders(),
      'Product-Serial': serial()
    }
  })

  return res.data
}

async function pollJob(jobId) {
  for (let i = 0; i < 30; i++) {
    const { data } = await client.get(`${API_BASE}/get-job/${jobId}`, { headers })
    const r = data?.result
    if (r?.status === 2 && r.output?.length) return r.output[0]
    if (r?.status === -1) throw 'Job failed'
    await sleep(2000)
  }
  throw 'Timeout'
}

let handler = async (m, { conn, text }) => {
  if (!text) return m.reply('❌ Give a prompt.\nExample:\n.pedit anime style')

  const q = m.quoted || m
  const mime = q.mimetype || ''
  if (!/image/.test(mime)) {
    return m.reply('❌ Reply to an IMAGE. Not vibes. Not dreams. IMAGE.')
  }

  const img = await q.download()
  if (!img) return m.reply('❌ Failed to download image.')

  const wait = await m.reply('🧪 Editing image… try not to blink.')

  try {
    const job = await createJob(img, text)
    const jobId =
      job?.result?.job_id || job?.job_id || job?.id || job?.uuid
    if (!jobId) throw 'No job ID'

    const imageUrl = await pollJob(jobId)
    const buffer = await (await fetch(imageUrl)).buffer()

    await conn.sendMessage(
      m.chat,
      { image: buffer, caption: '✅ Done. Try not to ruin it again.' },
      { quoted: m }
    )
  } catch (e) {
    await m.reply(`💀 Failed:\n${e}`)
  }
}

handler.command = /^pedit$/i
handler.tags = ['ai', 'image']
handler.help = ['pedit <prompt>']

export default handler