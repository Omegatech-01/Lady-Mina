/**
  *» Nama :* — [ SORA 2 - AI ] —
  *» Type :* Plugin - ESM
  *» Base Url :* https://www.nanobana.net
  *» Saluran :* https://whatsapp.com/channel/0029Vb7XfVV2v1IzPVqjgq37
  *» Creator :* -Ɗαnčoᴡ々
**/

import fetch from 'node-fetch';
import FormData from 'form-data';
import { fileTypeFromBuffer } from 'file-type';

const API = 'https://www.nanobana.net/api';
const COOKIE = '__Host-authjs.csrf-token=30520470455c3e13eaed1f36a6d404badce7ea465230c2c98e0471bb72646a4e%7C3e869582574ac97763adf0b3d383e68275475d375f1926fd551aa712e4adbd24; __Secure-authjs.callback-url=https%3A%2F%2Fwww.nanobana.net%2F%23generator; g_state={"i_l":0,"i_ll":1769401024886,"i_b":"VKxqLQ5eJ0B2gQmnduZzPCwsZ1q418d0cjhhXWlbxTU","i_e":{"enable_itp_optimization":0}}; __Secure-authjs.session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIiwia2lkIjoiSWRmbEhwMk0teEF1V3l6Nkg1bHZrRHdOc0ZiM3BBOHVvMjNjaXhaZ1MxT1hHWUFNUUc0MGY0bW5XZnFtdWZyWnFYbHM2SFZILUZncDlvaUk5dTdIbHcifQ..lasLfR5B2_Rf2Q_F3K6fgw.Tro9GauoZdTk0Dtt_Dt6HJK5eG_OZoP66i6LKgtDzaj6v42BIhO-Hre144rB3wYfFQovDVKXyxAGG8WyP5FW_H3WTJP-it5Sm8xfmj7WWSbAzXGXPOcw-782yVRqLAK4cxuNNGVYCNJhOxLnKEAh_3bRBUHpkDmDfsnC8z5FmTtURhA32n-KiMW5zcPKKhY6haApLrOfJ3Y31NxjzVRDa-T-1vjTITsyFBsZW_WaFY8OHRz7giNl-rKbfm-OKEd_nvU0NqdnEUS_LBYN-5b7u5f1buYMdIt8M2g6YIaYwhdXIGZ-x9HpJz2API7NrhKN5tTwaN6UMPFq4ZSfEdYEWipfmUMacv5oGfW7AmaAWMoVvYs5tudzI00D_M0GE3A5F20fLFRMRgDOsI3cs5-e0TzGOTobv3D7UGau8XCrxX5exf5L6Q1C15A6xwtPpRJu1cOg1BlnOXf0gueF4sAAcg._Bl87onRhLiZFFuzC-e1_udKFzuUFVAfhW4FfmtUufE';

const HEADERS = {
    'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
    'origin': 'https://www.nanobana.net',
    'referer': 'https://www.nanobana.net/',
    'cookie': COOKIE
};

async function req(url, opts) {
    const res = await fetch(url, opts);
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 100)}`);
    try { return JSON.parse(text); } catch { return text; }
}

async function upload(buffer) {
    const { ext, mime } = await fileTypeFromBuffer(buffer) || { ext: 'jpg', mime: 'image/jpeg' };
    const form = new FormData();
    form.append('file', buffer, { filename: `image.${ext}`, contentType: mime });
    
    const data = await req(`${API}/upload/image`, {
        method: 'POST',
        headers: { ...HEADERS, ...form.getHeaders() },
        body: form
    });
    if (!data.url) throw new Error('Upload gagal');
    return data.url;
}

async function generate(prompt, imageUrl) {
    const data = await req(`${API}/sora2/image-to-video/generate`, {
        method: 'POST',
        headers: { ...HEADERS, 'content-type': 'application/json' },
        body: JSON.stringify({
            prompt,
            image_urls: [imageUrl],
            aspect_ratio: 'portrait',
            n_frames: '10',
            remove_watermark: true
        })
    });
    if (!data.taskId) throw new Error('Gagal membuat task');
    return data.taskId;
}

async function waitTask(taskId, prompt) {
    for (let i = 0; i < 120; i++) {
        await new Promise(r => setTimeout(r, 5000));
        const data = await req(`${API}/sora2/image-to-video/task/${taskId}?save=1&prompt=${encodeURIComponent(prompt)}`, {
            headers: HEADERS
        });
        if (data.status === 'completed') return data.saved?.[0]?.url;
        if (data.status === 'failed') throw new Error(data.provider_raw?.data?.failMsg || 'Generasi gagal');
    }
    throw new Error('Timeout');
}

async function handler(m, { conn, text, usedPrefix, command }) {
    const q = m.quoted || m;
    const mime = (q.msg || q).mimetype || '';
    
    if (!text || !/image/.test(mime)) {
        return m.reply(`Reply to  the image:\n${usedPrefix + command} <prompt>`);
    }

    m.reply('> _`Am coming with your video,let me first talk with omega...`_');

    try {
        const media = await q.download();
        const imageUrl = await upload(media);
        const taskId = await generate(text, imageUrl);
        const videoUrl = await waitTask(taskId, text);

        await conn.sendMessage(m.chat, { 
            video: { url: videoUrl },
            caption: `✅ *Video Done Powered by Omegatech!*\n\n📝 *Prompt:* ${text}\n🎬 *Model:* Sora 2 Image to Video`,
            gifPlayback: false
        }, { quoted: m });

    } catch (e) {
        m.reply(`❌ Error: ${e.message}`);
    }
}

handler.help = ['sora'];
handler.tags = ['ai'];
handler.command = ['sora', 'imagetovideo', 'i2v', 'img2vid'];

export default handler;