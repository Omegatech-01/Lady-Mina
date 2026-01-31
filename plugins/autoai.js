import fs from 'fs'
import path from 'path'
import fetch from 'node-fetch'

const dbPath = path.join(process.cwd(), 'database', 'autoai_db.json')

if (!fs.existsSync(path.dirname(dbPath)))
    fs.mkdirSync(path.dirname(dbPath), { recursive: true })

if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(
        dbPath,
        JSON.stringify({
            settings: {
                global: {
                    all: false,
                    private: false,
                    voice: true,
                    defaultVoice: 'bella'
                }
            },
            memory: {}
        }, null, 2)
    )
}

const getDB = () => JSON.parse(fs.readFileSync(dbPath))
const saveDB = (data) => fs.writeFileSync(dbPath, JSON.stringify(data, null, 2))

const systemPrompt =
`You are Trisha. Not an AI. Real human. Sarcastic, witty, loyal to OmegaTech. Short human replies.`

let VOICE_CACHE = null

async function getVoices() {
    if (VOICE_CACHE) return VOICE_CACHE
    const res = await fetch('https://omegatech-api.dixonomega.tech/api/ai/text-to-speech?text=')
    const json = await res.json()
    VOICE_CACHE = json.voices || []
    return VOICE_CACHE
}

async function resolveVoice(input) {
    if (!input) return 'bella'
    const voices = await getVoices()
    const found =
        voices.find(v => v.id === input) ||
        voices.find(v => v.name.toLowerCase().includes(input.toLowerCase()))
    return found ? found.id : 'bella'
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
    let db = getDB()
    let args = text ? text.split(' ') : []
    let sub = args[0]?.toLowerCase()
    let target = args[1]?.toLowerCase()

    if (sub === 'voice' && !target) {
        let voices = await getVoices()
        let list = `✨ *TRISHA VOICE ENGINE* ✨\n\n` +
            voices.map(v => `🆔 \`${v.id}\`\n🗣️ ${v.name}`).join('\n\n')
        return m.reply(list)
    }

    if (sub === 'set' && target === 'voice') {
        let v = args[2]
        if (!v) return m.reply(`Example: ${usedPrefix + command} set voice bella`)
        db.settings.global.defaultVoice = v
        saveDB(db)
        return m.reply(`✅ Voice set to: *${v}*`)
    }

    if (sub === 'on' || sub === 'off') {
        let enable = sub === 'on'
        if (target === '/all') db.settings.global.all = enable
        else if (target === '/private') db.settings.global.private = enable
        else if (target === '/voice') db.settings.global.voice = enable
        else {
            if (!db.settings[m.chat]) db.settings[m.chat] = {}
            db.settings[m.chat].enabled = enable
        }
        saveDB(db)
        return m.reply(`✅ Trisha is now ${enable ? 'ENABLED' : 'DISABLED'} for this chat.`)
    }

    return m.reply(`✨ *TRISHA AUTO-AI* ✨\n\n• ${usedPrefix + command} on/off\n• ${usedPrefix + command} on/off /all\n• ${usedPrefix + command} on/off /private\n• ${usedPrefix + command} on/off /voice`)
}

handler.before = async (m, { conn }) => {
    // 1. IMPROVED SELF-REPLY PROTECTION
    if (!m.text || /^[.!#]/.test(m.text)) return
    if (m.isBaileys) return // Prevents bot-to-bot loops

    let db = getDB()
    let g = db.settings.global
    let c = db.settings[m.chat] || {}

    // 2. PRIORITY TOGGLE LOGIC (Fixes the OFF issue)
    let shouldReply = false
    let isPrivate = !m.isGroup

    // Priority 1: If user turned it OFF manually in this specific chat, ALWAYS STAY OFF
    if (c.enabled === false) {
        shouldReply = false
    } 
    // Priority 2: If user turned it ON manually, stay ON
    else if (c.enabled === true) {
        shouldReply = true
    } 
    // Priority 3: Master switch
    else if (g.all) {
        shouldReply = true
    } 
    // Priority 4: Private DM global setting
    else if (isPrivate && g.private) {
        shouldReply = true
    }

    // 3. FIX FOR "MESSAGE YOURSELF" CHATS
    // If it's a message to yourself, Baileys marks it as fromMe.
    // We only reply if it's NOT a quote of the bot's own audio.
    if (m.chat === m.sender && m.fromMe) {
        // Only reply if there is no "quoted" message (meaning you typed it fresh)
        if (m.quoted) return 
    } else if (m.fromMe) {
        return // Normal fromMe check for groups/other DMs
    }

    if (!shouldReply) return

    try {
        let q = encodeURIComponent(m.text)
        let aiUrl = `https://omegatech-api.dixonomega.tech/api/ai/write-cream?question=${q}&logic=${encodeURIComponent(systemPrompt)}`

        let aiRes = await fetch(aiUrl)
        let aiJson = await aiRes.json()
        let answer = aiJson.results
        if (!answer) return

        if (g.voice) {
            await conn.sendPresenceUpdate('recording', m.chat)
            let cleanText = answer.replace(/[^\w\s.,?!]/g, '').slice(0, 300)
            let voiceId = await resolveVoice(g.defaultVoice)

            let ttsUrl = `https://omegatech-api.dixonomega.tech/api/ai/text-to-speech?text=${encodeURIComponent(cleanText)}&voice=${voiceId}`
            let ttsRes = await fetch(ttsUrl)
            let ttsJson = await ttsRes.json()
            
            if (!ttsJson.result?.audio) return

            let audioBuf = await (await fetch(ttsJson.result.audio)).buffer()

            await conn.sendMessage(m.chat, {
                audio: audioBuf,
                mimetype: 'audio/mpeg',
                ptt: false
            }, { quoted: m })
        } else {
            await conn.sendPresenceUpdate('composing', m.chat)
            await m.reply(answer)
        }
    } catch (e) {
        console.error("Trisha Error:", e)
    }
}

handler.help = ['autoai']
handler.tags = ['ai']
handler.command = /^(autoai|trisha)$/i

export default handler