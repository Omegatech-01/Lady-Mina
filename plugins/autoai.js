import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'

const dbPath = path.join(process.cwd(), 'database', 'autoai_db.json')
const API = 'https://api.omegatech.app/api/ai'

function loadDb() {
  try {
    if (!fs.existsSync(path.dirname(dbPath))) fs.mkdirSync(path.dirname(dbPath), { recursive: true })
    if (!fs.existsSync(dbPath)) {
      const init = { settings: { global: { all: false, private: false, voice: false }, chats: {} }, voiceId: '' }
      fs.writeFileSync(dbPath, JSON.stringify(init, null, 2))
      return init
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'))
  } catch {
    return { settings: { global: { all: false, private: false, voice: false }, chats: {} }, voiceId: '' }
  }
}
function saveDb(db) {
  try { fs.writeFileSync(dbPath, JSON.stringify(db, null, 2)) } catch {}
}

const SYSTEM = `You are Mina (Lady-Mina), a friendly WhatsApp assistant by OmegaTech. Keep replies short, helpful and witty. Stay in character as Mina.`

async function chatMina(question) {
  // Primary: Chatbot (stable)
  try {
    const url = `${API}/Chatbot?action=chat&message=${encodeURIComponent(SYSTEM + '\n\nUser: ' + question)}`
    const res = await fetch(url, { headers: { 'User-Agent': 'Lady-Mina/1.0' }, timeout: 25000 })
    if (res.ok) {
      const json = await res.json()
      const reply = json?.reply || json?.result || json?.response || json?.message || json?.data?.reply
      if (reply && typeof reply === 'string' && reply.trim() && !/invalid request/i.test(reply)) return reply.trim()
    }
  } catch (e) {
    console.error('Chatbot fail:', e.message)
  }
  // Fallback: All-Ai
  try {
    const url = `${API}/All-Ai?action=chat&message=${encodeURIComponent(question)}`
    const res = await fetch(url, { headers: { 'User-Agent': 'Lady-Mina/1.0' }, timeout: 25000 })
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

async function tts(text) {
  // TTS currently unstable on OmegaTech; skip gracefully
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

  return m.reply(`✨ *LADY-MINA AUTO-AI*\n\n• ${usedPrefix + command} on/off\n• ${usedPrefix + command} on/off /all\n• ${usedPrefix + command} on/off /private\n• ${usedPrefix + command} on/off /voice`)
}

handler.before = async (m, { conn }) => {
  // Anti-lag / anti-spam: 3s per-chat cooldown
  global._autoaiCd = global._autoaiCd || {}
  const cdKey = m.chat
  if (global._autoaiCd[cdKey] && Date.now() - global._autoaiCd[cdKey] < 3000) return

  if (!m.text || m.fromMe || m.isBaileys) return
  if (/^[.#!\/]/.test(m.text.trim())) return // ignore commands

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
      const audio = await tts(clean)
      if (audio) {
        await conn.sendMessage(m.chat, { audio: { url: audio }, mimetype: 'audio/mpeg', ptt: true }, { quoted: m })
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
