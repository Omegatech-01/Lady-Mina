/**
 * System health check — lightweight, no external lag.
 */
let handler = async (m, { conn }) => {
  const used = process.memoryUsage()
  const format = (bytes) => {
    const sizes = ['B', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 B'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i]
  }
  const uptime = process.uptime()
  const h = Math.floor(uptime / 3600)
  const min = Math.floor((uptime % 3600) / 60)
  const s = Math.floor(uptime % 60)
  const pluginCount = Object.keys(global.plugins || {}).length
  const text = `🏓 *Pong!*\n\n⏱️ Uptime: ${h}h ${min}m ${s}s\n📦 Plugins loaded: ${pluginCount}\n🧠 RSS: ${format(used.rss)}\n🗂️ Heap: ${format(used.heapUsed)} / ${format(used.heapTotal)}\n⚙️ Node: ${process.version}\n🌐 API: api.omegatech.app`
  await m.reply(text)
}
handler.help = ['ping', 'botstatus']
handler.tags = ['info', 'main']
handler.command = /^(ping|botstatus|statusbot)$/i
export default handler
