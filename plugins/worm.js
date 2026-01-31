/**
  *» Nama :* — [ WORMGPT - AI ] —
  *» Type :* Plugin - ESM
  *» Base Url :* https://chat.wrmgpt.com
  *» Saluran :* https://whatsapp.com/channel/0029Vb7XfVV2v1IzPVqjgq37
  *» Creator :* -Ɗαnčoᴡ々
**/

const rand = n =>
  Array.from({ length: n }, () =>
    'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]
  ).join('')

async function wormgptChat(query) {
  const messageId = `${rand(8)}-${rand(4)}-${rand(4)}-${rand(4)}-${rand(12)}`
  const userId = `${rand(8)}-${rand(4)}-${rand(4)}-${rand(4)}-${rand(12)}`

  const cookie =
    '__Secure-authjs.session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIiwia2lkIjoiRnlESjQ1UXFQeDVRSVhoaVNSQk5uNFBHcFBFVnQzbjBZTVhRVGlEZ3hNeS1KaEZCNTJQOWx6d0lvNTRIODU1X3JNVzhWTHE0UUVDUExTWF9aLTh2aXcifQ..BC1-RXYYZM0oVmP7FaXUsw.f5LshHBNgG24G0uaj9te9vcDqm7zynNtVRvuuFjiHJzChQHQ4TYDCG35JXFCtiy29JcTWULM3ynjMp9l3ygwnv4FVIo9BIZBcyUQBzFyPNYcF6FGQEYke-D5ebIXcQi_tXLbxkhLTh9jTJJ4qfqZC13CgeaG-8je-x_dLT7yDe7A0s9QYqk7edr0YT_AmngvgS3MvcvhNmVC35aDurZO3dV2egpNvwgjlJaCn3aNRoiXjmtZow8pX3BUig8pfdE1.TiCtK3B8lnk4_K7R9ZxQvjqd3SVeoBzEUr8V9BKjGN0; __Secure-authjs.callback-url=https%3A%2F%2Fchat.wrmgpt.com%2Flogin'

  const res = await fetch('https://chat.wrmgpt.com/api/chat', {
    method: 'POST',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36',
      'Content-Type': 'application/json',
      Accept: '*/*',
      Origin: 'https://chat.wrmgpt.com',
      Referer: 'https://chat.wrmgpt.com/',
      Cookie: cookie,
      'sec-ch-ua-platform': '"Android"',
      'sec-ch-ua-mobile': '?1'
    },
    body: JSON.stringify({
      id: messageId,
      message: {
        role: 'user',
        parts: [{ type: 'text', text: query }],
        id: userId
      },
      selectedChatModel: 'wormgpt-v5.5',
      selectedVisibilityType: 'private',
      searchEnabled: false,
      memoryLength: 8
    })
  })

  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`)
  }

  const raw = await res.text()
  let result = ''

  for (const line of raw.split('\n')) {
    if (!line.startsWith('data: ')) continue

    const data = line.slice(6).trim()
    if (data === '[DONE]') break

    try {
      const json = JSON.parse(data)
      if (json.type === 'text-delta' && json.delta) {
        result += json.delta
      }
    } catch {}
  }

  if (!result) throw new Error('No output content generated')
  return result
}

let handler = async (m, { text, usedPrefix, command }) => {
  if (!text) {
    return m.reply(`Contoh: *${usedPrefix + command}* halo`)
  }

  await m.reply('> _Sedang memproses..._')

  try {
    const result = await wormgptChat(text)
    await m.reply(result)
  } catch (e) {
    m.reply(`❌ Error: ${e.message || e}`)
  }
}

handler.help = ['wormgpt (query)']
handler.tags = ['ai']
handler.command = ['wormgpt', 'worm']

export default handler