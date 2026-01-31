import { createCanvas } from 'canvas';

let handler = async (m, { text, conn, usedPrefix, command }) => {
    if (!text) throw `*Example:* ${usedPrefix + command} How do quantum computers work?`;

    await m.react('🧠');
    await m.reply('_Accessing Neural Network..._');

    try {
        const url = `https://omegatech-api.dixonomega.tech/api/ai/Ai-research?query=${encodeURIComponent(text)}`;
        const response = await fetch(url);
        const res = await response.json();

        if (!res.status || !res.data) throw 'Database connection lost.';

        const answer = res.data.answer;
        const sources = res.data.source || [];
        const attribution = res.attribution || "@Omegatech-01";

        // --- 1. THE UI/UX CANVAS (Local Processing) ---
        const width = 800;
        const height = 450;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Background: Deep Onyx
        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, width, height);

        // Futuristic Radial Glows
        drawGlow(ctx, 0, 0, 400, 'rgba(0, 210, 255, 0.1)'); // Cyan Top-Left
        drawGlow(ctx, width, height, 400, 'rgba(157, 0, 255, 0.05)'); // Purple Bottom-Right

        // Draw Neural Network Particles (Abstract UI)
        ctx.strokeStyle = 'rgba(0, 210, 255, 0.2)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 15; i++) {
            let x1 = Math.random() * width;
            let y1 = Math.random() * height;
            let x2 = Math.random() * width;
            let y2 = Math.random() * height;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            // Dots at junctions
            ctx.fillStyle = '#00d2ff';
            ctx.beginPath();
            ctx.arc(x1, y1, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Central Core Ring (UI Focus)
        ctx.strokeStyle = '#00d2ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, 100, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(0, 210, 255, 0.3)';
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, 120, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]); // Reset

        // Floating Branding Text (Minimalist)
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 40px sans-serif';
        ctx.fillText('NEURAL CORE', width / 2, height / 2 + 15);
        
        ctx.font = '14px monospace';
        ctx.fillStyle = '#00d2ff';
        ctx.fillText('SYSTEM STATUS: OPTIMIZED', width / 2, height / 2 + 50);

        // Footer UX Elements
        ctx.textAlign = 'left';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText('LADY-TRISH INTELLIGENCE', 40, height - 40);
        
        ctx.textAlign = 'right';
        ctx.fillText('OMEGATECH RESEARCH', width - 40, height - 40);

        // --- 2. SENDING THE DATA ---
        const buffer = canvas.toBuffer('image/png');

        // Handle Sources Logic
        let sourceList = sources.length > 0 
            ? sources.map((s, i) => `🔗 [Source ${i+1}](${s})`).join('\n') 
            : `🔗 https://t.me/Omegatech_01`; // Default fallback link

        let caption = `*🧠 OMEGATECH AI RESEARCH*\n\n` +
                      `${answer}\n\n` +
                      `*📚 REFERENCE LINKS:*\n${sourceList}\n\n` +
                      `_Attribution: ${attribution}_`;

        await conn.sendMessage(m.chat, { 
            image: buffer, 
            caption: caption 
        }, { quoted: m });
        
        await m.react('✅');

    } catch (err) {
        console.error(err);
        m.reply('⚠️ Error: The Research API is currently offline.');
    }
};

// Helper: Radial Blur Glow
function drawGlow(ctx, x, y, r, color) {
    let g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

handler.help = ['research'];
handler.tags = ['ai'];
handler.command = /^(research|aisearch|ai-research)$/i;

handler.register = true;
handler.limit = true;

export default handler;