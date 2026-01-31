import { createCanvas, loadImage } from 'canvas';
import os from 'os';
import fs from 'fs';
import moment from 'moment-timezone';

let handler = async (m, { conn }) => {
    const start = Date.now();
    await m.react('🛰️');

    // --- Configuration & Random Assets ---
    const menuAssets = [
        'https://files.catbox.moe/fqg2jx.jpeg',
        'https://files.catbox.moe/k2l8i7.jpeg',
        'https://files.catbox.moe/oi68l3.jpeg',
        'https://files.catbox.moe/7tdusb.jpeg'
    ];
    const randomUrl = menuAssets[Math.floor(Math.random() * menuAssets.length)];

    // --- System Data ---
    const totalMem = os.totalmem();
    const usedMem = totalMem - os.freemem();
    const memPercent = ((usedMem / totalMem) * 100).toFixed(1);
    const botSpeed = Date.now() - start;
    const cpuModel = os.cpus()[0].model.split('@')[0].trim();

    // --- Canvas Drawing ---
    const width = 1000;
    const height = 600;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // 1. Sleek Background
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, width, height);

    // Subtle Hexagonal Grid or Lines
    ctx.strokeStyle = 'rgba(0, 210, 255, 0.07)';
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 50) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
    }

    // 2. Load Local Background Image with Blur/Mask
    try {
        if (fs.existsSync('./media/menu.jpg')) {
            const bg = await loadImage('./media/menu.jpg');
            ctx.globalAlpha = 0.3; // Make it a faint background
            ctx.drawImage(bg, 0, 0, width, height);
            ctx.globalAlpha = 1.0;
        }
    } catch (e) { console.error("BG Load Fail"); }

    // 3. Glowing Title
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00d2ff';
    ctx.fillStyle = '#00d2ff';
    ctx.font = 'bold 50px sans-serif';
    ctx.fillText('Lady-Trish', 50, 90);
    ctx.shadowBlur = 0;

    // 4. Circular Profile (Top Right)
    try {
        const profileImg = await loadImage(randomUrl);
        const r = 90; // Radius
        const cx = 820; // Center X
        const cy = 130; // Center Y

        // Glow Ring
        ctx.beginPath();
        ctx.arc(cx, cy, r + 10, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 210, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Image Clipping
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(profileImg, cx - r, cy - r, r * 2, r * 2);
        ctx.restore();

        // Border
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = '#00d2ff';
        ctx.lineWidth = 4;
        ctx.stroke();
    } catch (e) { console.log("Profile Fail"); }

    // 5. Enriched Stat Cards
    const drawGlassStat = (label, value, x, y) => {
        // Card Background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.beginPath();
        ctx.roundRect(x, y, 550, 60, 15);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 210, 255, 0.2)';
        ctx.stroke();

        // Text
        ctx.font = 'bold 22px monospace';
        ctx.fillStyle = '#00d2ff';
        ctx.fillText(label, x + 20, y + 38);
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'right';
        ctx.fillText(value, x + 530, y + 38);
        ctx.textAlign = 'left';
    };

    drawGlassStat('⚡ LATENCY', `${botSpeed} MS`, 50, 150);
    drawGlassStat('⌛ UPTIME', toTime(process.uptime() * 1000), 50, 225);
    drawGlassStat('🖥️ CPU', cpuModel.slice(0, 25), 50, 300);
    drawGlassStat('💾 RAM', `${formatSize(usedMem)} / ${formatSize(totalMem)}`, 50, 375);

    // 6. Modern Progress Bar
    const barX = 50;
    const barY = 500;
    const barW = 900;
    const barH = 12;

    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 6);
    ctx.fill();

    const progressW = (barW * memPercent) / 100;
    const grad = ctx.createLinearGradient(barX, 0, barX + progressW, 0);
    grad.addColorStop(0, '#00d2ff');
    grad.addColorStop(1, '#0066ff');

    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00d2ff';
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(barX, barY, progressW, barH, 6);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '16px sans-serif';
    ctx.fillText(`SYSTEM LOAD: ${memPercent}%`, barX, barY - 15);

    // 7. Footer
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('LADY-TRISH  v1.0', 50, 570);
    ctx.textAlign = 'right';
    ctx.fillText('SECURITY STATUS: VERIFIED', 950, 570);

    const buffer = canvas.toBuffer('image/png');

    // --- Verified Message Output ---
    await conn.sendMessage(m.chat, { 
        image: buffer, 
        caption: `*SYS-HEALTH:* Stable\n*RESPONSE:* ${botSpeed}ms`,
        contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            externalAdReply: {
                title: `Lady-Trish`,
                body: `Lady-Trish Powered by OmegaTech`,
                thumbnail: buffer,
                mediaType: 1,
                showAdAttribution: true 
            },
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363403299118246@newsletter',
                newsletterName: `Lady-Trish Official ✅`, 
            },
        }
    }, { quoted: m });
};

handler.help = ['ping'];
handler.command = ['ping', 'speed'];

export default handler;

function toTime(ms) {
    let h = Math.floor(ms / 3600000);
    let m = Math.floor((ms % 3600000) / 60000);
    let s = Math.floor((ms % 60000) / 1000);
    return `${h}h ${m}m ${s}s`;
}

function formatSize(size) {
    return (size / (1024 * 1024)).toFixed(1) + ' MB';
}