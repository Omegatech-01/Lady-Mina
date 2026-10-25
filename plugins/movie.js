import axios from 'axios'

const API = 'https://api.omegatech.app/api/movie/lk21'

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) return m.reply(`*🎬 Lady-Mina Movie*\n\nExample:\n${usedPrefix + command} Avatar`)

  await m.react('🔍')
  try {
    const { data } = await axios.get(API, {
      params: { action: 'search', query: text },
      timeout: 25000,
      headers: { 'User-Agent': 'Lady-Mina/1.0' }
    })
    const results = data?.results || data?.result || data?.data || []
    const list = Array.isArray(results) ? results : []
    if (!list.length) return m.reply('❌ No movies found.')

    const top = list.slice(0, 8)
    let msg = `*🎬 Search:* ${text}\n\n`
    top.forEach((v, i) => {
      msg += `*${i + 1}.* ${v.title || v.name || 'Untitled'}\n`
      if (v.url || v.link) msg += `   ${v.url || v.link}\n`
    })
    msg += `\n_Open a link or refine your search._`

    if (top.length === 1 && (top[0].url || top[0].link)) {
      try {
        const det = await axios.get(API, {
          params: { action: 'full', query: text },
          timeout: 30000
        })
        const d = det.data?.result || det.data?.data || det.data
        const links = d?.downloads || d?.links || []
        let cap = `*🎬 ${d?.title || top[0].title || text}*\n\n`
        if (d?.synopsis) cap += d.synopsis.slice(0, 400) + '\n\n'
        if (Array.isArray(links)) links.slice(0, 10).forEach((l, i) => {
          cap += `🔗 ${l.quality || l.type || i + 1}: ${l.link || l.url || l}\n`
        })
        return m.reply(cap || msg)
      } catch {
        return m.reply(msg)
      }
    }
    return m.reply(msg)
  } catch (e) {
    m.reply('❌ Movie search failed: ' + (e.message || e))
  }
}

handler.help = ['movie']
handler.tags = ['downloader']
handler.command = /^(movie|film|lk21)$/i
handler.limit = true
export default handler
