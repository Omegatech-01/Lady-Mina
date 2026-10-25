import fetch from 'node-fetch'

const API = 'https://api.omegatech.app/api/Anime/Anoboy'

async function apiGet(params) {
  const url = `${API}?${new URLSearchParams(params)}`
  const res = await fetch(url, { headers: { 'User-Agent': 'Lady-Mina/1.0' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
  conn.animeFlow = conn.animeFlow || {}

  if (!text && !m.quoted) {
    return m.reply(`*✨ Lady-Mina Anime Search*\n\nExample:\n${usedPrefix + command} One Piece\n\nReply with a number from the list to see details.`)
  }

  if (m.quoted && conn.animeFlow[m.sender]) {
    const session = conn.animeFlow[m.sender]
    const choice = parseInt(text)
    if (isNaN(choice)) return

    if (session.step === 'list') {
      const item = session.data[choice - 1]
      if (!item) return m.reply('❌ Invalid choice. Pick a number from the list.')
      await m.react('⏳')
      try {
        const res = await apiGet({ action: 'detail', url: item.url || item.link || item.href })
        const info = res.result || res.data || res
        const title = info.title || info.name || item.title || 'Anime'
        const eps = info.episodes || info.episode || []
        let cap = `*🎬 ${title}*\n\n`
        if (info.synopsis || info.description) cap += `📖 ${(info.synopsis || info.description || '').slice(0, 300)}...\n\n`
        if (Array.isArray(eps) && eps.length) {
          cap += `*EPISODES:*\n`
          eps.slice(0, 20).forEach((ep, i) => {
            const name = ep.title || ep.episode || ep.name || `Episode ${i + 1}`
            cap += `${i + 1}. ${name}\n`
          })
          cap += `\n_Reply with episode number for download links._`
          session.step = 'details'
          session.episodes = eps
        } else {
          delete conn.animeFlow[m.sender]
        }
        const thumb = info.thumbnail || info.cover || info.image || item.image
        if (thumb) return conn.sendMessage(m.chat, { image: { url: thumb }, caption: cap }, { quoted: m })
        return m.reply(cap)
      } catch (e) {
        return m.reply('❌ Failed to fetch details: ' + (e.message || e))
      }
    }

    if (session.step === 'details') {
      const ep = session.episodes[choice - 1]
      if (!ep) return m.reply('❌ Invalid episode number.')
      await m.react('📥')
      try {
        const res = await apiGet({ action: 'episode', url: ep.url || ep.link || ep.href })
        const data = res.result || res.data || res
        const links = data.downloads || data.streams || data.links || []
        let cap = `*🚀 DOWNLOAD READY*\n\n`
        if (Array.isArray(links) && links.length) {
          links.forEach((s, i) => {
            const u = s.link || s.url || s
            const q = s.quality || s.resolusi || s.type || ''
            cap += `🔗 *${q || `Mirror ${i + 1}`}*: ${u}\n\n`
          })
        } else {
          cap += JSON.stringify(data).slice(0, 800)
        }
        delete conn.animeFlow[m.sender]
        return m.reply(cap)
      } catch (e) {
        return m.reply('❌ Failed to fetch episode: ' + (e.message || e))
      }
    }
  }

  await m.react('🔍')
  try {
    const res = await apiGet({ action: 'search', query: text })
    const results = res.results || res.result || res.data || []
    const list = Array.isArray(results) ? results : (results.result || [])
    if (!list.length) return m.reply('❌ Anime not found.')

    const top = list.slice(0, 10)
    let msg = `*🔍 SEARCH RESULTS:* "${text}"\n\n`
    top.forEach((v, i) => {
      msg += `*${i + 1}.* ${v.title || v.judul || v.name || 'Untitled'}\n`
    })
    msg += `\n_Reply with a number to see details._`
    conn.animeFlow[m.sender] = { step: 'list', data: top }
    return m.reply(msg)
  } catch (e) {
    return m.reply('❌ Search failed: ' + (e.message || e))
  }
}

handler.help = ['anime']
handler.tags = ['anime']
handler.command = /^(anime)$/i
export default handler
