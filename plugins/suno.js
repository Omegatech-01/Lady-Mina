import axios from 'axios';
import { createCanvas, loadImage } from 'canvas';

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) {
        // --- STAGE 0: NO TEXT (Canvas Guide) ---
        const width = 800, height = 400;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#020205'; ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = '#9d00ff'; ctx.lineWidth = 5; ctx.strokeRect(20, 20, 760, 360);
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 50px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('SONIC ENGINE', 400, 180);
        ctx.font = '20px monospace'; ctx.fillStyle = '#9d00ff';
        ctx.fillText(`Usage: ${usedPrefix + command} <song description>`, 400, 240);
        
        return await conn.sendMessage(m.chat, { 
            image: canvas.toBuffer(), 
            caption: `*🎵 OmegaTech Music Generation*\n\nDescribe the song you want to create (Genre, Mood, Topic).\n*Example:* ${usedPrefix + command} A high energy afrobeat song about Lady-Trish` 
        }, { quoted: m });
    }

    await m.react('🎙️');
    await m.reply(`✨ *OmegaTech Sonic Lab:* Composition initiated. Please wait while the neural networks generate your track...`);

    try {
        // --- STEP 1: INITIATE CREATION ---
        const createUrl = `https://omegatech-api.dixonomega.tech/api/ai/suno-create?description=${encodeURIComponent(text)}&instrumental=false`;
        const { data: createRes } = await axios.get(createUrl);

        if (!createRes.success) throw 'Composition failed to initialize.';
        const songId = createRes.result.id;

        // --- STEP 2: POLLING FOR STATUS ---
        let songData = null;
        let attempts = 0;
        const maxAttempts = 30; // 5 minutes max (10s * 30)

        while (attempts < maxAttempts) {
            attempts++;
            const statusUrl = `https://omegatech-api.dixonomega.tech/api/ai/suno-status?id=${songId}`;
            const { data: statusRes } = await axios.get(statusUrl);

            if (statusRes.status && statusRes.result.status === 'ready') {
                songData = statusRes.result;
                break;
            }

            // Wait 10 seconds before next check
            await new Promise(resolve => setTimeout(resolve, 10000));
        }

        if (!songData) throw 'Composition timed out. Please try again later.';

        // --- STEP 3: RENDER SONIC DASHBOARD (Canvas) ---
        const width = 1000, height = 500;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, width, height);

        // Load Cover
        let coverImg;
        try { coverImg = await loadImage(songData.cover); }
        catch { coverImg = await loadImage('https://telegra.ph/file/24167bc30c0f9cc20079b.jpg'); }

        // Draw Cover (Left Side)
        ctx.drawImage(coverImg, 50, 50, 400, 400);
        ctx.strokeStyle = '#9d00ff'; ctx.lineWidth = 10; ctx.strokeRect(50, 50, 400, 400);

        // Stats Section (Right Side)
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 45px sans-serif';
        ctx.fillText(songData.title.toUpperCase(), 480, 100);

        ctx.fillStyle = '#9d00ff';
        ctx.font = '22px monospace';
        ctx.fillText(`STATUS: COMPOSITION READY`, 480, 140);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '18px sans-serif';
        // Wrap Tags text
        wrapText(ctx, `Tags: ${songData.tags}`, 480, 190, 480, 25);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText(`Duration: ${formatDuration(songData.duration)}`, 480, 420);

        // Branding
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText('LADY-TRISH SONIC LAB • OMEGATECH', 480, 460);

        const buffer = canvas.toBuffer('image/png');

        // --- STEP 4: SEND DELIVERY ---
        let caption = `*🎵 SONG COMPLETED: ${songData.title}*\n\n` +
                      `📜 *Tags:* ${songData.tags.slice(0, 150)}...\n` +
                      `⏱️ *Duration:* ${formatDuration(songData.duration)}\n\n` +
                      `_Powered by Suno AI & OmegaTech Systems_`;

        await conn.sendMessage(m.chat, { image: buffer, caption: caption }, { quoted: m });
        
        // Send the actual Audio File
        await conn.sendMessage(m.chat, { 
            audio: { url: songData.audio }, 
            mimetype: 'audio/mpeg', 
            fileName: `${songData.title}.mp3` 
        }, { quoted: m });

        await m.react('✅');

    } catch (e) {
        console.error(e);
        m.reply(`❌ *Sonic Error:* ${e.message || e}`);
    }
};

// --- HELPERS ---
function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    let words = text.split(' ');
    let line = '';
    for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        let metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
            ctx.fillText(line, x, y);
            line = words[n] + ' ';
            y += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, x, y);
}

handler.help = ['suno <prompt>'];
handler.tags = ['ai'];
handler.command = /^(suno|song|create-song)$/i;

export default handler;