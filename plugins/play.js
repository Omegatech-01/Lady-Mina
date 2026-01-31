import ytSearch from "yt-search"

async function run(url) {
  while (true) {
    const res = await fetch(`https://youtubedl.siputzx.my.id/download?type=audio&url=${encodeURIComponent(url)}`, {
      headers: { Accept: "application/json, text/plain, */*" }
    })

    const data = await res.json()

    if (data.status === "completed") {
      return "https://youtubedl.siputzx.my.id" + data.fileUrl
    }
  }
}

let handler = async (m, { conn, args }) => {
  try {
    if (!args.length) return m.reply('*Example :* .play Alan Walker - Faded')

    const query = args.join(" ")
    m.reply("Wait")

    const search = await ytSearch(query)
    const video = search.videos[0]
    const { title, url, timestamp, views, author, thumbnail } = video

    const audio = await run(url)

    const caption = `*${title}*
*Author :* ${author.name}
*Views :* ${views}
*Duration :* ${timestamp}
*Link :* ${url}
> Send Audio`

    await conn.sendMessage(
      m.chat,
      { image: { url: thumbnail }, caption },
      { quoted: m }
    )

    await conn.sendMessage(
      m.chat,
      { audio: { url: audio }, mimetype: "audio/mpeg" },
      { quoted: m }
    )

  } catch (e) {
    m.reply(String(e))
  }
}

handler.help = ["play", "ytplay"]
handler.tags = ["downloader"]
handler.command = /^(play|ytplay)$/i

export default handler