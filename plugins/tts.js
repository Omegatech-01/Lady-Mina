import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'

const API = 'https://api.omegatech.app/api/ai/Nicevoice'
const cloneDbPath = path.join(process.cwd(), 'database', 'voice_clones.json')

function loadClones() {
  try {
    if (!fs.existsSync(path.dirname(cloneDbPath))) fs.mkdirSync(path.dirname(cloneDbPath), { recursive: true })
    if (!fs.existsSync(cloneDbPath)) {
      fs.writeFileSync(cloneDbPath, '{}')
      return {}
    }
    return JSON.parse(fs.readFileSync(cloneDbPath, 'utf8'))
  } catch {
    return {}
  }
}
function saveClones(db) {
  try { fs.writeFileSync(cloneDbPath, JSON.stringify(db, null, 2)) } catch {}
}

async function apiGet(params) {
  const url = `${API}?${new URLSearchParams(params)}`
  const res = await fetch(url, { headers: { 'User-Agent': 'Lady-Mina/1.0' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

async function apiPost(body) {
  const res = await fetch(API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Lady-Mina/1.0'
    },
    body: JSON.stringify(body)
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

/** Download remote audio → Buffer (never expose URL to chat) */
async function fetchAudioBuffer(audioUrl) {
  const res = await fetch(audioUrl, { headers: { 'User-Agent': 'Lady-Mina/1.0' } })
  if (!res.ok) throw new Error(`Audio fetch HTTP ${res.status}`)
  const ab = await res.arrayBuffer()
  return Buffer.from(ab)
}

async function pollResult(taskSn, account, token, tries = 25) {
  for (let i = 0; i < tries; i++) {
    await new Promise(r => setTimeout(r, 2500))
    const params = { action: 'result', taskSn }
    if (account) params.account = account
    if (token) params.token = token
    const st = await apiGet(params)
    const d = st?.data || st
    if (d?.audioUrl && !d.pending) return d.audioUrl
    if (d?.pending === false && !d.audioUrl) throw new Error('TTS generation failed')
  }
  throw new Error('TTS timeout — try again')
}

async function generateTTS(text, voice = 'friendly-women', extra = {}) {
  const params = {
    action: 'generate',
    text: String(text).slice(0, 500),
    voice
  }
  if (extra.referenceId) params.referenceId = extra.referenceId
  if (extra.account) params.account = extra.account
  if (extra.token) params.token = extra.token

  const gen = await apiGet(params)
  const d = gen?.data || gen
  const taskSn = d?.taskSn
  if (!taskSn) throw new Error('No taskSn from Nicevoice')
  const account = d?.account || extra.account
  const token = d?.token || extra.token
  return pollResult(taskSn, account, token)
}

/** Clone from base64 sample — no public link required */
async function cloneFromBase64(base64, transcript = '', name = 'mina-clone') {
  const body = {
    action: 'clone',
    audio_base64: base64,
    text: transcript || 'Sample voice for cloning',
    referenceName: name
  }
  const res = await apiPost(body)
  const d = res?.data || res
  if (!d?.referenceId) throw new Error(res?.error || 'Clone failed — no referenceId')
  return {
    referenceId: d.referenceId,
    account: d.account,
    token: d.token,
    name: d.referenceName || name
  }
}

async function sendPttBuffer(conn, chat, buffer, quoted) {
  await conn.sendMessage(chat, {
    audio: buffer,
    mimetype: 'audio/mpeg',
    ptt: true
  }, { quoted })
}

let handler = async (m, { conn, text, usedPrefix, command, args }) => {
  const q = m.quoted ? m.quoted : null
  const mime = (q?.msg || q)?.mimetype || ''
  const isAudioReply = q && /audio|ptt|ogg|mpeg|mp4|opus|voice/i.test(mime)

  // List system voices
  if (command === 'ttsvoices' || args[0] === 'list' || args[0] === 'voices') {
    try {
      const res = await apiGet({ action: 'list' })
      const voices = res?.data?.voices || []
      let msg = '*🎙️ Nicevoice System Voices*\n\n'
      voices.slice(0, 40).forEach(v => {
        msg += `• *${v.slug}* — ${v.name} (${v.gender || '?'})\n`
      })
      msg += `\n*Clone your voice:*\nReply to a voice note with:\n${usedPrefix}ttsclone Hello Mina\nor\n${usedPrefix}tts Hello Mina\n\nUses base64 (no link shown).`
      return m.reply(msg)
    } catch (e) {
      return m.reply('❌ Could not list voices: ' + (e.message || e))
    }
  }

  // Clone mode: reply to voice note
  if (isAudioReply && (command === 'ttsclone' || command === 'clonevoice' || command === 'tts' || command === 'nicevoice')) {
    const say = (text || '').trim()
    if (!say) {
      return m.reply(`Reply to a *voice note* with:\n${usedPrefix}ttsclone <text to speak>\n\nExample: ${usedPrefix}ttsclone Hello, this is my cloned voice`)
    }

    await m.react('🧬')
    try {
      const media = await q.download()
      if (!media || !media.length) throw new Error('Could not download voice note')
      if (media.length < 8000) throw new Error('Voice sample too short — send at least ~3–5 seconds of clear speech')

      // base64 only — never upload a public URL for the sample
      const b64 = Buffer.from(media).toString('base64')
      await m.reply('🧬 Cloning voice from your note (base64)…')

      const cloned = await cloneFromBase64(b64, say.slice(0, 80), `user-${m.sender.split('@')[0]}`)

      // Persist clone for this user
      const db = loadClones()
      db[m.sender] = {
        referenceId: cloned.referenceId,
        account: cloned.account,
        token: cloned.token,
        name: cloned.name,
        updated: Date.now()
      }
      saveClones(db)

      await m.reply('🔊 Generating speech with your clone…')
      const audioUrl = await generateTTS(say, 'energetic-male', {
        referenceId: cloned.referenceId,
        account: cloned.account,
        token: cloned.token
      })

      // Send as buffer — no link in chat
      const buf = await fetchAudioBuffer(audioUrl)
      await sendPttBuffer(conn, m.chat, buf, m)
      await m.react('✅')
    } catch (e) {
      console.error('ttsclone error:', e)
      m.reply('❌ Clone/TTS failed: ' + (e.message || e) + '\n\n_Tip: use a clear 5–10s voice note. System voices still work with_ ' + usedPrefix + 'tts friendly-women Hello')
    }
    return
  }

  // Reuse last clone if user has one: .myvoice <text>
  if (command === 'myvoice' || args[0] === 'my') {
    const say = command === 'myvoice' ? (text || '').trim() : args.slice(1).join(' ').trim()
    if (!say) return m.reply(`Usage: ${usedPrefix}myvoice <text>\n(Uses your last cloned voice)`)
    const db = loadClones()
    const c = db[m.sender]
    if (!c?.referenceId) {
      return m.reply(`No saved clone. Reply to a voice note with:\n${usedPrefix}ttsclone <text>`)
    }
    await m.react('🔊')
    try {
      const audioUrl = await generateTTS(say, 'energetic-male', {
        referenceId: c.referenceId,
        account: c.account,
        token: c.token
      })
      const buf = await fetchAudioBuffer(audioUrl)
      await sendPttBuffer(conn, m.chat, buf, m)
    } catch (e) {
      m.reply('❌ ' + (e.message || e))
    }
    return
  }

  // System voice TTS
  if (!text) {
    return m.reply(`*🎙️ Lady-Mina TTS (Nicevoice)*\n\n*System voice:*\n${usedPrefix}tts Hello Mina\n${usedPrefix}tts energetic-male Hello\n\n*Clone (reply to voice note):*\n${usedPrefix}ttsclone Hello from my voice\n${usedPrefix}myvoice Hello again\n\n${usedPrefix}ttsvoices — list system voices\n\n_Audio is sent as voice note — no links shown._`)
  }

  await m.react('🔊')
  try {
    let voice = 'friendly-women'
    let say = text
    const parts = text.trim().split(/\s+/)
    if (parts.length > 1 && /^[a-z0-9-]+$/i.test(parts[0]) && parts[0].length < 40) {
      voice = parts[0]
      say = parts.slice(1).join(' ')
    }
    const audioUrl = await generateTTS(say, voice)
    const buf = await fetchAudioBuffer(audioUrl)
    await sendPttBuffer(conn, m.chat, buf, m)
  } catch (e) {
    m.reply('❌ TTS failed: ' + (e.message || e))
  }
}

handler.help = ['tts', 'ttsclone', 'myvoice', 'ttsvoices']
handler.tags = ['ai', 'tools']
handler.command = /^(tts|ttsclone|clonevoice|myvoice|ttsvoices|nicevoice)$/i
handler.limit = true
export default handler
export { generateTTS, cloneFromBase64, fetchAudioBuffer }
