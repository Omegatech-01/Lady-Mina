import axios from 'axios'

const API = 'https://api.omegatech.app/api/movie/MovieBox-pro'
const OFF = 'https://api.omegatech.app/api/movie/Moviebox_off'

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) {
    return m.reply(`*🎬 Lady-Mina MovieBox*\n\nSearch:\n${usedPrefix + command} Avatar\n\nReply with a number for stream links.`) 
  }

  conn.movieFlow = conn.movieFlow || {}

  // Reply flow: pick result
  if (m.quoted && conn.movieFlow[m.sender] && /^\d+$/.test(text.trim())) {
    const list = conn.movieFlow[m.sender]
    const item = list[parseInt(text) - 1]
    if (!item) return m.reply('❌ Invalid number.')
    await m.react('📥')
    try {
      const sid = item.subjectId
      let streams = []
      // Prefer search-provided proxies
      if (item.proxyStream || item.proxyDownload) {
        streams.push({ label: 'Stream (proxy)', url: item.proxyStream })
        streams.push({ label: 'Download (proxy)', url: item.proxyDownload })
      }
      // Moviebox_off play
      try {
        const { data } = await axios.get(OFF, {
          params: { action: 'play', subjectId: sid, season: item.season || 0, episode: 0 },
          timeout: 25000,
          headers: { 'User-Agent': 'Lady-Mina/1.0' }
        })
        const arr = data?.data?.streams || data?.streams || []
        arr.forEach((s, i) => {
          const u = s.trapUrl || s.url || s.hls || s.dash
          if (u) streams.push({ label: s.resolutions || s.format || `Source ${i + 1}`, url: u })
        })
      } catch {}

      let cap = `*🎬 ${item.title}*\n`
      if (item.genre) cap += `🎭 ${item.genre}\n`
      if (item.imdbRatingValue || item.imdb) cap += `⭐ ${item.imdbRatingValue || item.imdb}\n`
      if (item.releaseDate) cap += `📅 ${item.releaseDate}\n`
      cap += '\n'
      if (streams.length) {
        streams.slice(0, 12).forEach((s, i) => {
          if (s.url) cap += `🔗 *${s.label || i + 1}*:\n${s.url}\n\n`
        })
      } else {
        cap += '_No direct streams found. Try another title._'
      }
      delete conn.movieFlow[m.sender]
      const cover = item.cover?.url || item.cover
      if (cover) return conn.sendMessage(m.chat, { image: { url: cover }, caption: cap }, { quoted: m })
      return m.reply(cap)
    } catch (e) {
      return m.reply('❌ Failed: ' + (e.message || e))
    }
  }

  await m.react('🔍')
  try {
    const { data } = await axios.get(API, {
      params: { action: 'search', keyword: text },
      timeout: 25000,
      headers: { 'User-Agent': 'Lady-Mina/1.0' }
    })
    const results = data?.data?.results || data?.results || []
    if (!results.length) return m.reply('❌ No movies found on MovieBox.')

    const top = results.slice(0, 10)
    conn.movieFlow[m.sender] = top

    let msg = `*🎬 MovieBox Search:* ${text}\n\n`
    top.forEach((v, i) => {
      const type = v.subjectType === 2 ? 'Series' : 'Movie'
      msg += `*${i + 1}.* ${v.title} (${type})\n`
      if (v.imdbRatingValue) msg += `   ⭐ ${v.imdbRatingValue} · ${v.releaseDate || ''}\n`
    })
    msg += `\n_Reply with a number for stream / download links._`
    return m.reply(msg)
  } catch (e) {
    m.reply('❌ Movie search failed: ' + (e.message || e))
  }
}

handler.help = ['movie', 'moviebox']
handler.tags = ['downloader']
handler.command = /^(movie|film|moviebox|mb)$/i
handler.limit = true
export default handler
