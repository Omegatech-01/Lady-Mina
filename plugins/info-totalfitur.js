import { createCanvas } from 'canvas';

let handler = async (m, { conn }) => {
    // 1. Logic: Count total commands and unique tags
    const plugins = Object.values(global.plugins);
    const totalFeatures = plugins.filter((v) => v.help && v.tags).length;
    
    // Get unique categories (tags)
    const totalTags = [...new Set(plugins.flatMap(v => v.tags || []))].filter(Boolean).length;

    await m.react('📊');

    // 2. --- Canvas Drawing (System Analytics Card) ---
    const width = 800;
    const height = 400;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background: Dark Blue Tech Gradient
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#04040a');
    grad.addColorStop(1, '#0b0b24');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Decorative Hexagon Pattern (Subtle)
    ctx.strokeStyle = 'rgba(0, 210, 255, 0.1)';
    ctx.lineWidth = 2;
    for (let i = 0; i < width; i += 100) {
        for (let j = 0; j < height; j += 100) {
            ctx.beginPath();
            ctx.moveTo(i + 50, j);
            ctx.lineTo(i + 100, j + 25);
            ctx.lineTo(i + 100, j + 75);
            ctx.lineTo(i + 50, j + 100);
            ctx.lineTo(i, j + 75);
            ctx.lineTo(i, j + 25);
            ctx.closePath();
            ctx.stroke();
        }
    }

    // Main Stats Box (Centered)
    const boxW = 500;
    const boxH = 150;
    const boxX = (width - boxW) / 2;
    const boxY = (height - boxH) / 2;

    ctx.fillStyle = 'rgba(0, 210, 255, 0.05)';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = '#00d2ff';
    ctx.lineWidth = 3;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    // Header Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SYSTEM ANALYTICS', width / 2, boxY - 30);

    // Display Total Commands
    ctx.fillStyle = '#00d2ff';
    ctx.font = 'bold 80px sans-serif';
    ctx.fillText(totalFeatures.toString(), width / 2, boxY + 100);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px sans-serif';
    ctx.fillText('ACTIVE COMMANDS LOADED', width / 2, boxY + 130);

    // Side Info: Total Categories
    ctx.textAlign = 'left';
    ctx.fillStyle = '#00d2ff';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(`CATEGORIES: ${totalTags}`, boxX, boxY + boxH + 40);

    // "System Online" Indicator
    ctx.textAlign = 'right';
    ctx.fillStyle = '#00ff88';
    ctx.fillText('● SYSTEM ONLINE', boxX + boxW, boxY + boxH + 40);

    // Footer Branding
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('LADY-TRISH', 40, height - 30);
    
    ctx.textAlign = 'right';
    ctx.fillText('POWERED BY OMEGATECH', width - 40, height - 30);

    // 3. Send Response
    const buffer = canvas.toBuffer('image/png');
    
    let caption = `*📊 BOT SYSTEM STATISTICS*

• *Total Features:* ${totalFeatures} Commands
• *Categories:* ${totalTags} Tags
• *Status:* Optimized & Ready

_The Lady-Trish database is currently running with all systems operational._`;

    await conn.sendMessage(m.chat, { 
        image: buffer, 
        caption: caption 
    }, { quoted: m });
};

handler.help = ['totalfeatures'];
handler.tags = ['info'];
handler.command = ['totalfitur', 'totalfeatures', 'features'];

export default handler;