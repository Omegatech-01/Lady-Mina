/**
  *» Nama :* — [ FLUX 2 - AI ] —
  *» Type :* Plugin - ESM
  *» Base Url :* https://flux2.cloud/
  *» Saluran :* https://whatsapp.com/channel/0029Vb7XfVV2v1IzPVqjgq37
  *» Creator :* -Ɗαnčoᴡ々
**/

import fetch from 'node-fetch';

async function handler(m, { conn, text, usedPrefix, command }) {
    if (!text) return conn.sendMessage(m.chat, { text: `Gunakan: ${usedPrefix + command} <prompt>` }, { quoted: m });

    const [prompt, width, height] = text.split('|').map(s => s?.trim());
    const imgWidth = width ? parseInt(width) : 512;
    const imgHeight = height ? parseInt(height) : 512;

    if (imgWidth < 256 || imgWidth > 1024 || imgHeight < 256 || imgHeight > 1024) {
        return conn.sendMessage(m.chat, { text: `Ukuran harus 256-1024 pixel` }, { quoted: m });
    }

    try {
        await conn.sendMessage(m.chat, { text: `⏳ Generating: ${prompt}...` }, { quoted: m });

        const token = await bypassTurnstile();
        const result = await generateImage(prompt, token, imgWidth, imgHeight);
        const buffer = base64ToBuffer(result.image_url);

        await conn.sendMessage(m.chat, {
            image: buffer,
            caption: `✅ ${prompt}\n📐 ${imgWidth}x${imgHeight}`
        }, { quoted: m });

    } catch (error) {
        await conn.sendMessage(m.chat, { text: `❌ ${error.message}` }, { quoted: m });
    }
}

handler.help = ['flux <prompt>'];
handler.tags = ['ai'];
handler.command = /^(flux|fluxai)$/i;
handler.limit = true;

export default handler;

const CONFIG = {
    FLUX_API: 'https://flux2.cloud/api/web/generate-basic',
    BYPASS_API: 'https://api.nekolabs.web.id/tools/bypass/cf-turnstile',
    SITE_URL: 'https://flux2.cloud',
    SITE_KEY: '0x4AAAAAACBE7FYcn9PdfENx',
    TIMEOUT: 120000,
    MAX_RETRIES: 3
};

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36',
    'Content-Type': 'application/json',
    'origin': 'https://flux2.cloud',
    'referer': 'https://flux2.cloud/'
};

async function bypassTurnstile(retry = 0) {
    const url = `${CONFIG.BYPASS_API}?url=${encodeURIComponent(CONFIG.SITE_URL)}&siteKey=${CONFIG.SITE_KEY}`;
    const res = await fetch(url, { headers: { 'User-Agent': HEADERS['User-Agent'] }, timeout: CONFIG.TIMEOUT });
    if (!res.ok) throw new Error(`Bypass error: ${res.status}`);
    
    const data = await res.json();
    if (!data.success || !data.result) {
        if (retry < CONFIG.MAX_RETRIES - 1) {
            await new Promise(r => setTimeout(r, (retry + 1) * 2000));
            return bypassTurnstile(retry + 1);
        }
        throw new Error('Bypass failed');
    }
    return data.result;
}

async function generateImage(prompt, token, width, height) {
    const res = await fetch(CONFIG.FLUX_API, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify({ prompt, turnstile_token: token, width, height }),
        timeout: CONFIG.TIMEOUT
    });
    if (!res.ok) throw new Error(`Generate error: ${res.status}`);
    const data = await res.json();
    if (!data.image_url) throw new Error('No image URL');
    return data;
}

function base64ToBuffer(base64) {
    return Buffer.from(base64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
}