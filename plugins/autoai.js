import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'

const dbPath = path.join(process.cwd(), 'database', 'autoai_db.json')
const API = 'https://api.omegatech.app/api/ai'

function loadDb() {
  try {
    if (!fs.existsSync(path.dirname(dbPath))) fs.mkdirSync(path.dirname(dbPath), { recursive: true })
    if (!fs.existsSync(dbPath)) {
      const init = { settings: { global: { all: false, private: false, voice: false }, chats: {} }, voiceId: 'friendly-women' }
      fs.writeFileSync(dbPath, JSON.stringify(init, null, 2))
      return init
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'))
  } catch {
    return { settings: { global: { all: false, private: false, voice: false }, chats: {} }, voiceId: 'friendly-women' }
  }
}
function saveDb(db) {
  try { fs.writeFileSync(dbPath, JSON.stringify(db, null, 2)) } catch {}
}

const SYSTEM = `You are Mina (Lady-Mina), a friendly WhatsApp assistant by OmegaTech. Keep replies short, helpful and witty. Stay in character as Mina.`

async function chatMina(question) {
  try {
    const url = `${API}/Chatbot?action=chat&message=${encodeURIComponent(SYSTEM + '\n\nUser: ' + question)}`
    const res = await fetch(url, { headers: { 'User-Agent': 'Lady-Mina/1.0' } })
    if (res.ok) {
      const json = await res.json()
      const reply = json?.reply || json?.result || json?.response || json?.message || json?.data?.reply
      if (reply && typeof reply === 'string' && reply.trim() && !/invalid request/i.test(reply)) return reply.trim()
    }
  } catch (e) {
    console.error('Chatbot fail:', e.message)
  }
  try {
    const url = `${API}/All-Ai?action=chat&message=${encodeURIComponent(question)}`
    const res = await fetch(url, { headers: { 'User-Agent': 'Lady-Mina/1.0' } })
    if (res.ok) {
      const json = await res.json()
      let reply = json?.reply || json?.result || json?.response
      if (typeof reply === 'string' && reply.startsWith('{')) {
        try { reply = JSON.parse(reply)?.reply || reply } catch {}
      }
      if (reply && typeof reply === 'string' && reply.trim()) return reply.trim()
    }
  } catch (e) {
    console.error('All-Ai fail:', e.message)
  }
  return null
}

async function nicevoiceTTS(text, voice = 'friendly-women') {
  try {
    const genUrl = `${API}/Nicevoice?action=generate&text=${encodeURIComponent(text.slice(0, 400))}&voice=${encodeURIComponent(voice)}`
    const genRes = await fetch(genUrl, { headers: { 'User-Agent': 'Lady-Mina/1.0' } })
    const gen = await genRes.json()
    const d = gen?.data || gen
    const taskSn = d?.taskSn
    if (!taskSn) return null
    const account = d?.account
    const token = d?.token
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 2500))
      let resultUrl = `${API}/Nicevoice?action=result&taskSn=${encodeURIComponent(taskSn)}`
      if (account) resultUrl += `&account=${encodeURIComponent(account)}`
      if (token) resultUrl += `&token=${encodeURIComponent(token)}`
      const stRes = await fetch(resultUrl, { headers: { 'User-Agent': 'Lady-Mina/1.0' } })
      const st = await stRes.json()
      const rd = st?.data || st
      if (rd?.audioUrl && !rd.pending) {
        // Download as buffer so chat never sees a URL
        const aRes = await fetch(rd.audioUrl, { headers: { 'User-Agent': 'Lady-Mina/1.0' } })
        if (!aRes.ok) return null
        return Buffer.from(await aRes.arrayBuffer())
      }
    }
  } catch (e) {
    console.error('Nicevoice TTS:', e.message)
  }
  return null
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
  const db = loadDb()
  const arg = (text || '').trim().toLowerCase()
  const chatId = m.chat

  if (/^(on|off)/.test(arg)) {
    const enable = arg.startsWith('on')
    const target = arg.includes('/all') ? '/all' : arg.includes('/private') ? '/private' : arg.includes('/voice') ? '/voice' : 'chat'
    if (target === '/all') db.settings.global.all = enable
    else if (target === '/private') db.settings.global.private = enable
    else if (target === '/voice') db.settings.global.voice = enable
    else {
      db.settings.chats[chatId] = db.settings.chats[chatId] || {}
      db.settings.chats[chatId].enabled = enable
    }
    saveDb(db)
    return m.reply(`✅ *Mina* is now *${enable ? 'ENABLED' : 'DISABLED'}*${target === 'chat' ? ' for this chat' : ' (' + target + ')'}.`)
  }

  return m.reply(`✨ *LADY-MINA AUTO-AI*\n\n• ${usedPrefix + command} on/off\n• ${usedPrefix + command} on/off /all\n• ${usedPrefix + command} on/off /private\n• ${usedPrefix + command} on/off /voice  _(Nicevoice PTT, no links)_`)
}

handler.before = async (m, { conn }) => {
  global._autoaiCd = global._autoaiCd || {}
  const cdKey = m.chat
  if (global._autoaiCd[cdKey] && Date.now() - global._autoaiCd[cdKey] < 3000) return

  if (!m.text || m.fromMe || m.isBaileys) return
  if (/^[.#!\/]/.test(m.text.trim())) return

  const db = loadDb()
  const g = db.settings.global
  const chat = db.settings.chats[m.chat] || {}

  if (chat.enabled === false) return
  let active = chat.enabled === true
  if (!active) {
    if (g.all) active = true
    else if (g.private && !m.isGroup) active = true
  }
  if (!active) return

  global._autoaiCd[cdKey] = Date.now()
  try {
    const reply = await chatMina(m.text)
    if (!reply || typeof reply !== 'string') return
    const clean = String(reply).trim()
    if (!clean) return

    if (g.voice) {
      const voice = db.voiceId || 'friendly-women'
      const audioBuf = await nicevoiceTTS(clean, voice)
      if (audioBuf && Buffer.isBuffer(audioBuf)) {
        await conn.sendMessage(m.chat, { audio: audioBuf, mimetype: 'audio/mpeg', ptt: true }, { quoted: m })
        return
      }
    }
    await m.reply(clean)
  } catch (e) {
    console.error('Mina AutoAI Error:', e)
  }
}

handler.help = ['autoai']
handler.tags = ['ai']
handler.command = /^(autoai|minaai)$/i
export default handler
