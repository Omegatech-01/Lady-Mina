import { createCanvas, loadImage } from 'canvas';
import { canLevelUp, xpRange } from '../lib/levelling.js';

let handler = async (m, { conn, usedPrefix }) => {
    const name = conn.getName(m.sender);
    const user = global.db.data.users[m.sender];
    const { min, xp, max } = xpRange(user.level, global.multiplier);
    
    // Check for level up logic
    let before = user.level * 1;
    while (canLevelUp(user.level, user.exp, global.multiplier)) {
        user.level++;
    }
    let isLevelUp = before !== user.level;

    // --- Canvas Drawing ---
    const width = 850;
    const height = 300;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // 1. Background (Elegant Dark Tech)
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#020205');
    grad.addColorStop(1, '#1a1a3a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // 2. Decorative Background Pattern (Triangles/Lines)
    ctx.strokeStyle = 'rgba(0, 210, 255, 0.1)';
    ctx.beginPath();
    ctx.moveTo(width, 0);
    ctx.lineTo(width - 300, 0);
    ctx.lineTo(width, 200);
    ctx.closePath();
    ctx.stroke();

    // 3. Avatar (Circular with Glow)
    let pfp;
    try {
        const url = await conn.profilePictureUrl(m.sender, 'image');
        pfp = await loadImage(url);
    } catch {
        pfp = await loadImage('https://telegra.ph/file/24167bc30c0f9cc20079b.jpg'); // Placeholder
    }

    ctx.save();
    ctx.beginPath();
    ctx.arc(120, 150, 90, 0, Math.PI * 2);
    ctx.strokeStyle = '#00d2ff';
    ctx.lineWidth = 8;
    ctx.stroke();
    ctx.clip();
    ctx.drawImage(pfp, 30, 60, 180, 180);
    ctx.restore();

    // 4. Text Information
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 40px sans-serif';
    ctx.fillText(name.length > 15 ? name.substring(0, 15) + '...' : name, 250, 100);

    ctx.font = '25px sans-serif';
    ctx.fillStyle = '#00d2ff';
    ctx.fillText(`LEVEL: ${user.level}`, 250, 150);
    
    // XP Progress Text
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px sans-serif';
    const currentXP = user.exp - min;
    ctx.fillText(`${currentXP.toLocaleString()} / ${xp.toLocaleString()} XP`, 800, 185);

    // 5. Progress Bar
    const barWidth = 550;
    const barHeight = 25;
    const barX = 250;
    const barY = 200;
    const progress = Math.min((currentXP / xp), 1);

    // Bar Background
    ctx.fillStyle = '#333333';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth, barHeight, 15);
    ctx.fill();

    // Bar Progress (Glowing Gradient)
    const progressGrad = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
    progressGrad.addColorStop(0, '#00d2ff');
    progressGrad.addColorStop(1, '#9d00ff');
    ctx.fillStyle = progressGrad;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth * progress, barHeight, 15);
    ctx.fill();

    // 6. Level Up Badge (Only shows if they leveled up)
    if (isLevelUp) {
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 30px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🏆 LEVEL UP!', 700, 80);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px sans-serif';
        ctx.fillText(`${before} ➔ ${user.level}`, 700, 110);
    }

    // 7. Footer Branding
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = '18px sans-serif';
    ctx.fillText('LADY-TRISH', 250, 270);
    ctx.textAlign = 'right';
    ctx.fillText('POWERED BY OMEGATECH', 800, 270);

    // Finalize
    const buffer = canvas.toBuffer('image/png');
    
    let caption = isLevelUp 
        ? `🔥 *CONGRATULATIONS ${name.toUpperCase()}!*\n\nYou have climbed to *Level ${user.level}*!` 
        : `✨ *LEVEL STATS FOR ${name.toUpperCase()}*\n\n📊 *Level:* ${user.level}\n✨ *XP:* ${currentXP} / ${xp}\n🚀 *Next Level:* ${max - user.exp} XP remaining`;

    await conn.sendMessage(m.chat, { 
        image: buffer, 
        caption: caption 
    }, { quoted: m });
};

handler.help = ['levelup'];
handler.tags = ['xp'];
handler.command = /^levelup$/i;

export default handler;