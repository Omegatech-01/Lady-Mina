import moment from 'moment-timezone'
import * as levelling from '../lib/levelling.js'
import fs from 'fs'

/* ================= FAKE META CONTACT ================= */
const fakeMeta = {
	key: {
		participant: '23278025474@s.whatsapp.net',
		remoteJid: '23278025474@s.whatsapp.net',
		fromMe: false,
		id: 'OMEGATECH_META_' + Date.now()
	},
	message: {
		contactMessage: {
			displayName: 'OmegaTech',
			vcard: `BEGIN:VCARD
VERSION:3.0
N:OmegaTech;;;;
FN:OmegaTech
TEL;waid=23278025474:+232 780 25474
END:VCARD`,
			sendEphemeral: true
		}
	},
	messageTimestamp: Math.floor(Date.now() / 1000),
	pushName: 'OmegaTech'
}
/* ===================================================== */

const handler = async (m, { conn, usedPrefix: _p, isOwner }) => {

	/* ---------- HEADER IMAGE ---------- */
	const thumbs = [
		'https://files.catbox.moe/fqg2jx.jpeg',
		'https://files.catbox.moe/k2l8i7.jpeg',
		'https://files.catbox.moe/oi68l3.jpeg',
		'https://files.catbox.moe/7tdusb.jpeg'
	]
	const thumbUrl = thumbs[Math.floor(Math.random() * thumbs.length)]

	/* ---------- TAGS ---------- */
	const allTags = {
		main: 'Main Protocol',
		ai: 'Neural Intelligence',
		downloader: 'Media Extraction',
		tools: 'Utility Modules',
		fun: 'Entertainment',
		group: 'Group Control',
		info: 'System Info',
		owner: 'Founder Protocol'
	}

	if (!isOwner) delete allTags.owner
	if (!m.isGroup) delete allTags.group

	/* ---------- USER DATA ---------- */
	const user = global.db.data.users[m.sender]
	const { min, xp, max } = levelling.xpRange(user.level, global.multiplier)

	const uptime = clockString(process.uptime() * 1000)
	const d = new Date()
	const week = d.toLocaleDateString('en-US', { weekday: 'long' })
	const date = d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })

	/* ---------- MENU TEXT ---------- */
	let text = `
┏━━〔  ${style('Lady-Trish')}  〕━━┓
┃ ⚡ ${greeting()}
┃ 👤 User: ${user.name || conn.getName(m.sender)}
┃ 🧬 Role: ${user.role}
┃ 📊 Level: ${user.level}
┃ ☄️ XP: ${xp} / ${max}
┃ ⏳ Uptime: ${uptime}
┃ 📅 ${week}, ${date}
┗━━━━━━━━━━━━━━┛

`

	for (let tag in allTags) {
		text += `┏━━〔 ${allTags[tag].toUpperCase()} 〕━━┓\n`
		let cmds = Object.values(global.plugins)
			.filter(p => p.tags && p.tags.includes(tag))
			.flatMap(p => p.help || [])
			.map(cmd => `┃ • ${_p}${cmd}`)
			.join('\n')
		text += cmds || '┃ • -'
		text += `\n┗━━━━━━━━━━━━━━┛\n\n`
	}

	/* ---------- SEND DOCUMENT MENU ---------- */
	await conn.sendMessage(
		m.chat,
		{
			document: Buffer.from('Lady-Trish System Interface'),
			mimetype: 'application/pdf',
			fileName: 'Lady-Trish_Menu.pdf',
			fileLength: 999999999,
			pageCount: 2026,
			caption: style(text),
			contextInfo: {
				forwardingScore: 999,
				isForwarded: true,
				externalAdReply: {
					title: 'Lady-Trish WhatsApp Bot',
					body: 'System Online • Stable Channel',
					thumbnailUrl: thumbUrl,
					sourceUrl: global.source || 'https://wa.me/23278025474',
					mediaType: 1,
					renderLargerThumbnail: true
				},
				forwardedNewsletterMessageInfo: {
					newsletterJid: '120363403299118246@newsletter',
					serverMessageId: 142,
					newsletterName: 'Lady-Trish Channel'
				}
			}
		},
		{ quoted: fakeMeta }
	)
}

/* ---------- HANDLER ---------- */
handler.help = ['menu']
handler.tags = ['main']
handler.command = /^(menu|help|\?)$/i
handler.exp = 3

export default handler

/* ---------- UTIL ---------- */
function style(text) {
	const map = {
		a:'ᴀ',b:'ʙ',c:'ᴄ',d:'ᴅ',e:'ᴇ',f:'ꜰ',g:'ɢ',
		h:'ʜ',i:'ɪ',j:'ᴊ',k:'ᴋ',l:'ʟ',m:'ᴍ',
		n:'ɴ',o:'ᴏ',p:'ᴘ',q:'ǫ',r:'ʀ',s:'ꜱ',
		t:'ᴛ',u:'ᴜ',v:'ᴠ',w:'ᴡ',x:'x',y:'ʏ',z:'ᴢ'
	}
	return text.toLowerCase().split('').map(c => map[c] || c).join('')
}

function clockString(ms) {
	let h = Math.floor(ms / 3600000)
	let m = Math.floor((ms % 3600000) / 60000)
	let s = Math.floor((ms % 60000) / 1000)
	return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':')
}

function greeting() {
	const h = moment.tz('Africa/Freetown').format('HH')
	if (h < 4) return 'Good night'
	if (h < 12) return 'Good morning'
	if (h < 18) return 'Good afternoon'
	return 'Good evening'
}