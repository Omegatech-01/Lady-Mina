/*
📌 Name: AgungDevX Text2Pet (Unofficial Text-to-Image & Text-to-Video)
🏷️ Type: Plugin ESM
📦 Description: Generate image or video from text prompt (pet/animal focused?) using old zdex.top API
📑 Note: 
- API likely DEAD/OFFLINE in Jan 2026 (401/503 errors on zdex.top domains).
- Token decryption is kept from original scraper.
- Video polling up to ~3 minutes (100 attempts).
- If fails → try free alternatives: openart.ai/generator/pet-photo or fotor.com pet AI
👤 Adapted for bot
*/

import axios from 'axios'

class AgungDevXText2Pet {
    constructor() {
        this.baseUrl = 'https://text2pet.zdex.top'
        this.token = this.decryptToken()
        this.headers = {
            'user-agent': 'AgungDevX FreeScrape/1.0.0 (WhatsApp Bot)',
            'accept-encoding': 'gzip',
            'content-type': 'application/json',
            'authorization': this.token
        }
    }

    decryptToken() {
        const cipher = 'hbMcgZLlzvghRlLbPcTbCpfcQKM0PcU0zhPcTlOFMxBZ1oLmruzlVp9remPgi0QWP0QW'
        const shift = 3
        
        return [...cipher].map(c => {
            if (/[a-z]/.test(c)) {
                return String.fromCharCode((c.charCodeAt(0) - 97 - shift + 26) % 26 + 97)
            } else if (/[A-Z]/.test(c)) {
                return String.fromCharCode((c.charCodeAt(0) - 65 - shift + 26) % 26 + 65)
            }
            return c
        }).join('')
    }

    generateDeviceId() {
        const chars = '0123456789abcdef'
        let id = ''
        for (let i = 0; i < 16; i++) {
            id += chars[Math.floor(Math.random() * chars.length)]
        }
        return id
    }
}

let handler = async (m, { conn, usedPrefix, command, text }) => {
    if (!text) return m.reply(`Masukkan prompt!\n\nContoh:\n${usedPrefix + command} a cute black cat wearing sunglasses\n\nUntuk video: tambah --video di akhir`)

    const isVideo = text.endsWith('--video')
    const prompt = text.replace('--video', '').trim()

    if (!prompt) return m.reply('Prompt tidak boleh kosong!')

    await m.reply(`⏳ Generating ${isVideo ? 'video' : 'image'}... (bisa sangat lama 30 detik - 3 menit)`)

    try {
        const generator = new AgungDevXText2Pet()

        if (isVideo) {
            // Text to Video
            const payload = {
                deviceID: generator.generateDeviceId(),
                isPremium: 1,
                prompt,
                used: [],
                versionCode: 6
            }

            const res = await axios.post(`${generator.baseUrl}/videos`, payload, {
                headers: generator.headers
            })

            if (res.data.code !== 0 || !res.data.key) {
                throw new Error('Gagal mendapatkan video key')
            }

            const key = res.data.key

            // Poll progress
            let result = null
            for (let attempt = 0; attempt < 100; attempt++) {
                await new Promise(resolve => setTimeout(resolve, 2000))

                const pollRes = await axios.post(`${generator.baseUrl}/videos/batch`, { keys: [key] }, {
                    headers: generator.headers,
                    timeout: 15000
                })

                if (pollRes.data.code === 0 && pollRes.data.datas?.[0]) {
                    const data = pollRes.data.datas[0]
                    if (data.url && data.url.trim()) {
                        result = data
                        break
                    }
                }
            }

            if (!result || !result.url) throw new Error('Timeout atau gagal generate video')

            await conn.sendMessage(m.chat, {
                video: { url: result.url.trim() },
                caption: `🎥 *Video Generated!*\nPrompt: ${prompt}\n\nVia AgungDevX Text2Pet (old API)`
            }, { quoted: m })

        } else {
            // Text to Image
            const res = await axios.post(`${generator.baseUrl}/images`, { prompt }, {
                headers: generator.headers
            })

            if (res.data.code !== 0 || !res.data.data) {
                throw new Error('Gagal generate gambar')
            }

            const imgUrl = res.data.data.trim()

            await conn.sendMessage(m.chat, {
                image: { url: imgUrl },
                caption: `🖼️ *Image Generated!*\nPrompt: ${prompt}\n\nVia AgungDevX Text2Pet (old API)`
            }, { quoted: m })
        }

    } catch (e) {
        console.error('TEXT2PET ERROR:', e.message || e)
        await m.reply(`❌ Gagal proses!\n\nError: ${e.message || 'Unknown'}\n\nKemungkinan besar API sudah mati/offline di 2026 (zdex.top down).\n\n**Alternatif bagus gratis sekarang**:\n• https://openart.ai/generator/pet-photo (text to pet image)\n• https://www.fotor.com/features/pet-paintings-from-photos (pet portrait)\n• https://www.adobe.com/products/firefly/features/ai-pet-portrait-generator.html\n\nCoba yang ini bro, pasti jalan!`)
    }
}

handler.help = ['pet <prompt>', 'pet <prompt> --video']
handler.tags = ['ai', 'generator', 'image', 'video']
handler.command = /^(pet|text2pet|agungpet)$/i
handler.limit = true // optional

export default handler