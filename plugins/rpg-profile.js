import { createCanvas, loadImage } from 'canvas';

let handler = async (m, { conn }) => {
    let user = global.db.data.users[m.sender];
    let { level, exp, money, limit, health, registered, age, name } = user;
    
    // XP Progress Calculation
    const multiplier = 45; // Matches common leveling systems
    const min = level * level * multiplier;
    const max = (level + 1) * (level + 1) * multiplier;
    const currentExp = exp - min;
    const xpNeeded = max - min;
    const progress = Math.min(currentExp / xpNeeded, 1);

    await m.react('👤');

    // --- CANVAS DRAWING (Citizen ID) ---
    const width = 900, height = 500;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, width, height);

    // Sidebar Glow
    ctx.fillStyle = '#00d2ff';
    ctx.fillRect(0, 0, 15, height);

    // Profile Picture
    let pp;
    try {
        pp = await loadImage(await conn.profilePictureUrl(m.sender, 'image'));
    } catch {
        pp = await loadImage('https://telegra.ph/file/24167bc30c0f9cc20079b.jpg');
    }

    ctx.save();
    ctx.beginPath();
    ctx.arc(180, 200, 100, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(pp, 80, 100, 200, 200);
    ctx.restore();

    // Stats Section
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 45px sans-serif';
    ctx.fillText((name || conn.getName(m.sender)).toUpperCase(), 340, 100);

    ctx.font = '22px monospace';
    ctx.fillStyle = '#00d2ff';
    const drawStat = (label, val, x, y) => {
        ctx.fillStyle = '#00d2ff';
        ctx.fillText(label, x, y);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(val, x + 120, y);
    };

    drawStat('LEVEL', level, 340, 160);
    drawStat('HEALTH', `${health}%`, 340, 200);
    drawStat('MONEY', `$${money.toLocaleString()}`, 340, 240);
    drawStat('LIMIT', limit, 340, 280);

    // Progress Bar
    ctx.fillStyle = '#333';
    ctx.roundRect(340, 340, 500, 25, 12);
    ctx.fill();
    ctx.fillStyle = '#00d2ff';
    ctx.roundRect(340, 340, progress * 500, 25, 12);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${currentExp.toLocaleString()} / ${xpNeeded.toLocaleString()} XP to Level ${level + 1}`, 340 + 250, 390);

    // Branding
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('LADY-TRISH CITIZEN ID', width - 40, height - 40);

    const buffer = canvas.toBuffer('image/png');
    
    let caption = `*👤 USER PROFILE: ${name || conn.getName(m.sender)}*\n\n` +
                  `🏷️ *Status:* ${registered ? 'Verified Citizen' : 'Unregistered'}\n` +
                  `🎂 *Age:* ${age || 'Unknown'}\n\n` +
                  `📊 *Current XP:* ${currentExp.toLocaleString()}\n` +
                  `✨ *XP to Next Level:* ${xpNeeded - currentExp.toLocaleString()}\n\n` +
                  `_Type *${(m.prefix || '.')}inventory* to see your items._`;

    await conn.sendMessage(m.chat, { image: buffer, caption: caption }, { quoted: m });
};

handler.help = ['profile'];
handler.tags = ['info'];
handler.command = /^(profile|me|profil)$/i;

export default handler;