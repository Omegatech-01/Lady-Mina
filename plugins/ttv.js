import axios from 'axios'
import FormData from 'form-data'

const AgungDevX = {
    config: {
        base: 'https://text2video.aritek.app',
        cipher: 'hbMcgZLlzvghRlLbPcTbCpfcQKM0PcU0zhPcTlOFMxBZ1oLmruzlVp9remPgi0QWP0QW',
        shift: 3,
        ua: 'AgungDevX Coder/1.0.0 (WhatsApp Bot)'
    },
    _decryptToken: () => {
        const input = AgungDevX.config.cipher
        const shift = AgungDevX.config.shift
        return [...input].map(c =>
            /[a-z]/.test(c) ? String.fromCharCode((c.charCodeAt(0) - 97 - shift + 26) % 26 + 97) :
            /[A-Z]/.test(c) ? String.fromCharCode((c.charCodeAt(0) - 65 - shift + 26) % 26 + 65) : c
        ).join('')
    }
}

let handler = async (m, { conn, usedPrefix, command, text }) => {
    if (!text) return m.reply(`*⚠️ Usage:* Provide a description for the generation.\n\n*Example:* ${usedPrefix + command} Astronaut on Mars\n*Video Mode:* Add \`--video\` at the end.`)

    const isVideo = text.endsWith('--video')
    const prompt = text.replace('--video', '').trim()

    await m.react('🎞️')
    await m.reply(`⏳ *Lady-Trish Neural Engine:* Generating ${isVideo ? 'video' : 'image'} from prompt...`)

    try {
        const token = AgungDevX._decryptToken()
        if (isVideo) {
            const resKey = await axios.post(`${AgungDevX.config.base}/txt2videov3`, {
                deviceID: Math.random().toString(16).slice(2, 10),
                isPremium: 1, prompt: prompt, used: [], versionCode: 59
            }, { headers: { 'authorization': token } })

            const key = resKey.data.key
            let videoUrl = null
            for (let i = 0; i < 40; i++) {
                await new Promise(r => setTimeout(r, 3000))
                const resVideo = await axios.post(`${AgungDevX.config.base}/video`, { keys: [key] }, { headers: { 'authorization': token } })
                if (resVideo.data.datas?.[0]?.url) { videoUrl = resVideo.data.datas[0].url; break; }
            }
            if (!videoUrl) throw 'Render timeout.'
            await conn.sendMessage(m.chat, { video: { url: videoUrl }, caption: `🎥 *OMEGATECH NEURAL RENDER*\n*Prompt:* ${prompt}` }, { quoted: m })
        } else {
            const form = new FormData()
            form.append('prompt', prompt)
            form.append('token', token)
            const { data } = await axios.post(`${AgungDevX.config.base}/text2img`, form, { headers: { 'authorization': token, ...form.getHeaders() } })
            if (!data.url) throw 'Render failed.'
            await conn.sendMessage(m.chat, { image: { url: data.url }, caption: `🖼️ *OMEGATECH IMAGE GEN*\n*Prompt:* ${prompt}` }, { quoted: m })
        }
    } catch (e) {
        m.reply('❌ *Render Failed:* The neural engine is currently offline.')
    }
}

handler.help = ['render <prompt>']
handler.tags = ['ai', 'video']
handler.command = /^(render|ttv|t2v|gen)$/i
handler.limit = true
export default handler