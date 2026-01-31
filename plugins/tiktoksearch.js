import axios from 'axios'
import { URLSearchParams } from 'url'

let handler = async (m, { conn, usedPrefix, command, text }) => {
    if (!text) return m.reply(`*⚠️ Input Required:* Enter keywords to crawl TikTok.\n*Example:* ${usedPrefix + command} tech reviews 5`)

    let count = 12
    const args = text.split(' ')
    const keywords = args.slice(0, -1).join(' ') || text
    if (!isNaN(args[args.length - 1])) count = Math.min(20, parseInt(args[args.length - 1]))

    await m.react('🔍')
    await m.reply(`🔎 *OmegaTech Crawler:* Harvesting TikTok data for "${keywords}"...`)

    try {
        const payload = new URLSearchParams({ keywords: keywords, count: count, cursor: 0, HD: 1 })
        const { data } = await axios.post('https://tikwm.com/api/feed/search', payload.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }
        })

        if (data.code !== 0 || !data.data?.videos?.length) throw 'No data found.'

        const results = data.data.videos
        const first = results[0]

        await conn.sendMessage(m.chat, {
            video: { url: `https://tikwm.com${first.play}` },
            caption: `🎥 *CRAWLER PREVIEW (Top Result)*\n\n📌 *Title:* ${first.title || 'Untitled'}\n👤 *Author:* @${first.author.unique_id}\n⏱️ *Duration:* ${first.duration}s\n📊 *Stats:* ${first.play_count} views\n\n_Remaining results listed below._`
        }, { quoted: m })

        let txt = `🔎 *TIKTOK CRAWLER DATA: ${keywords.toUpperCase()}*\n\n`
        results.forEach((v, i) => {
            txt += `${i+1}. ${v.title.slice(0,30)}...\n   🔗 *Link:* https://tikwm.com${v.play}\n\n`
        })

        await m.reply(txt + `_Powered by Lady-Trish Intelligence_`)

    } catch (e) {
        m.reply('❌ *Crawl Failed:* The TikTok database is currently protected or rate-limited.')
    }
}

handler.help = ['ttsearch <query>']
handler.tags = ['downloader', 'search']
handler.command = /^(tiktoksearch|ttsearch|caritt)$/i
handler.limit = true
export default handler