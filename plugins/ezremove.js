/*
📌 Name: EZ Remove Watermark (ezremove.ai Unofficial)
🏷️ Type: Plugin ESM
📦 Description: Remove watermark / text / objects from image using ezremove.ai (unofficial API)
📑 Note: 
- This is reverse-engineered from 2024-2025 era.
- As of Jan 2026, it may still work but often gets blocked/rate-limited.
- Headers & 'product-serial' are fake → helps bypass basic checks.
- Processing takes 10-30 seconds.
- If it fails → use the website manually: https://ezremove.ai
👤 Adapted for bot
*/

import fs from 'fs'
import axios from 'axios'
import FormData from 'form-data'
import path from 'path'

let handler = async (m, { conn, usedPrefix, command }) => {
    const q = m.quoted ? m.quoted : m
    const mime = (q.msg || q).mimetype || ''
    
    if (!/image/.test(mime)) {
        return m.reply(`Reply or send an image!\nExample: ${usedPrefix + command}`)
    }

    await m.reply('⏳ Removing watermark... (takes 10-40 seconds)')

    try {
        const media = await q.download()
        const tempPath = path.join(process.cwd(), 'tmp', `ezrm-${Date.now()}.jpg`)
        
        // Save temporarily
        fs.writeFileSync(tempPath, media)

        const form = new FormData()
        form.append('image_file', fs.createReadStream(tempPath), path.basename(tempPath))

        const createRes = await axios.post(
            'https://api.ezremove.ai/api/ez-remove/watermark-remove/create-job',
            form,
            {
                headers: {
                    ...form.getHeaders(),
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                    'Origin': 'https://ezremove.ai',
                    'Referer': 'https://ezremove.ai/',
                    'product-serial': 'sr-' + Date.now()
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            }
        ).catch(err => ({ data: null }))

        const createData = createRes?.data
        if (!createData?.result?.job_id) {
            throw new Error('Failed to create job' + (createData?.message ? `: ${createData.message}` : ''))
        }

        const jobId = createData.result.job_id

        // Poll for result
        let outputUrl = null
        for (let i = 0; i < 15; i++) {
            await new Promise(r => setTimeout(r, 2500))

            const checkRes = await axios.get(
                `https://api.ezremove.ai/api/ez-remove/watermark-remove/get-job/${jobId}`,
                {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                        'Origin': 'https://ezremove.ai',
                        'product-serial': 'sr-' + Date.now()
                    }
                }
            ).catch(() => ({ data: null }))

            const check = checkRes?.data

            if (check?.code === 100000 && check?.result?.output?.[0]) {
                outputUrl = check.result.output[0]
                break
            }

            // 300001 = still processing
            if (!check || check.code !== 300001) {
                break
            }
        }

        // Clean up temp file
        try { fs.unlinkSync(tempPath) } catch {}

        if (!outputUrl) {
            throw new Error('Timeout or failed - no result after ~40 seconds')
        }

        // Send cleaned image
        await conn.sendMessage(m.chat, {
            image: { url: outputUrl },
            caption: `🧹 *Watermark Removed Successfully!*\n\nOriginal job: ${jobId}\nResult: ${outputUrl}\n\nIf it fails next time, try the free website: https://Omegatech-api.dixonomega.tech`
        }, { quoted: m })

    } catch (e) {
        console.error('EZREMOVE ERROR:', e.message || e)
        await m.reply(`❌ Failed!\n\nError: ${e.message || 'Unknown error'}\n\nPossible reasons:\n• API blocked this request\n• Rate limit\n• Image too big/complex\n\nTry manually at: https://ezremove.ai\n(Upload → Auto-remove → Download)`)
    }
}

handler.help = ['ezremove', 'removewm', 'nowm']
handler.tags = ['tools', 'image', 'ai']
handler.command = /^(ezremove|removewm|nowm|watermarkremove|removewatermark)$/i
handler.limit = true // optional

export default handler