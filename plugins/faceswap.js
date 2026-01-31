import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import path from 'path';
import { createCanvas } from 'canvas';

let handler = async (m, { conn, text, usedPrefix, command }) => {
    conn.fswap = conn.fswap ? conn.fswap : {};

    const q = m.quoted ? m.quoted : m;
    const mime = (q.msg || q).mimetype || '';

    // --- STAGE 0: NO IMAGE (Show Canvas Guide) ---
    if (!/image/.test(mime)) {
        const width = 800, height = 400;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#020205'; ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = '#ff00ff'; ctx.lineWidth = 5; ctx.strokeRect(20, 20, 760, 360);
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 50px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('FACE-SWAP ENGINE', 400, 180);
        ctx.font = '20px monospace'; ctx.fillStyle = '#00d2ff';
        ctx.fillText(`Step 1: Reply to SOURCE image with ${usedPrefix + command}`, 400, 240);
        ctx.fillText(`Step 2: Reply to TARGET image with ${usedPrefix + command}`, 400, 270);
        
        return await conn.sendMessage(m.chat, { 
            image: canvas.toBuffer(), 
            caption: `*🎭 OmegaTech Face-Swap Intelligence*\n\nTo swap faces, I need two images. Please follow the visual guide above.` 
        }, { quoted: m });
    }

    // --- STAGE 1: FIRST IMAGE RECEIVED ---
    if (!conn.fswap[m.sender]) {
        await m.react('⏳');
        try {
            const imgBuffer = await q.download();
            const tempName = path.join(process.cwd(), 'tmp', `source_${m.sender.split('@')[0]}.jpg`);
            if (!fs.existsSync(path.join(process.cwd(), 'tmp'))) fs.mkdirSync(path.join(process.cwd(), 'tmp'));
            fs.writeFileSync(tempName, imgBuffer);

            conn.fswap[m.sender] = { source: tempName };
            return m.reply('✅ *Source Image Saved.* Now, reply to the **Target Image** (the one you want to put the face onto) with the same command.');
        } catch (e) { return m.reply('❌ Failed to process the first image.'); }
    }

    // --- STAGE 2: SECOND IMAGE RECEIVED & PROCESSING ---
    if (conn.fswap[m.sender] && conn.fswap[m.sender].source) {
        await m.react('🧬');
        const sourcePath = conn.fswap[m.sender].source;
        const targetImg = await q.download();
        const targetPath = path.join(process.cwd(), 'tmp', `target_${m.sender.split('@')[0]}.jpg`);
        fs.writeFileSync(targetPath, targetImg);

        await m.reply('✨ *Lady-Trish Neural Lab:* Both samples acquired. Initiating molecular face-swap... this may take 30 seconds.');

        try {
            // 1. Create Job
            const form = new FormData();
            form.append('source_image', fs.createReadStream(sourcePath), { filename: 'source.jpg', contentType: 'image/jpeg' });
            form.append('target_image', fs.createReadStream(targetPath), { filename: 'target.jpg', contentType: 'image/jpeg' });

            const createRes = await axios.post('https://api.lovefaceswap.com/api/face-swap/create-poll', form, {
                headers: {
                    ...form.getHeaders(),
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36',
                    'origin': 'https://lovefaceswap.com',
                    'referer': 'https://lovefaceswap.com/'
                }
            });

            const taskId = createRes.data.data.task_id;
            if (!taskId) throw 'Neural Link Refused: Task ID not generated.';

            // 2. Polling for results
            let resultUrl = null;
            for (let i = 0; i < 20; i++) { // Max 60 seconds
                await new Promise(r => setTimeout(r, 3000));
                const check = await axios.get(`https://api.lovefaceswap.com/api/common/get?job_id=${taskId}`, {
                    headers: { 'User-Agent': 'Mozilla/5.0', 'origin': 'https://lovefaceswap.com' }
                });
                
                const data = check.data.data;
                if (data.image_url && data.image_url.length > 0) {
                    resultUrl = data.image_url[0];
                    break;
                }
                if (data.status === 'failed') throw 'Neural processing failed on the server.';
            }

            if (!resultUrl) throw 'Processing timeout.';

            // 3. Deliver Result
            await conn.sendMessage(m.chat, { 
                image: { url: resultUrl }, 
                caption: `🎭 *FACE-SWAP SUCCESSFUL*\n\n_Molecular structure successfully re-mapped by OmegaTech Neural Intelligence._`
            }, { quoted: m });

            await m.react('✅');

        } catch (e) {
            console.error(e);
            m.reply(`❌ *System Failure:* ${e.message || e}`);
        } finally {
            // Cleanup
            try {
                fs.unlinkSync(sourcePath);
                fs.unlinkSync(targetPath);
                delete conn.fswap[m.sender];
            } catch {}
        }
    }
};

handler.help = ['faceswap'];
handler.tags = ['ai', 'tools'];
handler.command = /^(faceswap|swapface)$/i;
handler.limit = true;

export default handler;