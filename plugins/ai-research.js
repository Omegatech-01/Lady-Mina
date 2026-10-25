import fetch from 'node-fetch'

let handler = async (m, { text, usedPrefix, command }) => {
  if (!text) return m.reply(`Example: ${usedPrefix + command} what is quantum computing`)

  await m.reply('_Lady-Mina is researching…_')

  try {
    const url = `https://api.omegatech.app/api/ai/Ai-research?query=${encodeURIComponent(text)}`
    const response = await fetch(url, { headers: { 'User-Agent': 'Lady-Mina/1.0' } })
    const res = await response.json()
    const answer = res?.result || res?.response || res?.data || res?.answer || res?.message
    if (!answer) return m.reply('❌ No research result. Try again later.')
    await m.reply(`*🔎 Lady-Mina Research*\n\n${typeof answer === 'string' ? answer : JSON.stringify(answer, null, 2).slice(0, 3500)}`)
  } catch (e) {
    m.reply('❌ Research failed: ' + (e.message || e))
  }
}

handler.help = ['research', 'airesearch']
handler.tags = ['ai']
handler.command = /^(research|airesearch|aires)$/i
handler.limit = true
export default handler
