import { createCanvas, loadImage } from 'canvas';

const rewardConfig = {
    daily: {
        label: 'DAILY REWARD',
        cooldown: 86400000, 
        lastKey: 'lastclaim',
        color: '#00d2ff', // Cyan
        free: { exp: 500, money: 1000, limit: 5 },
        prem: { exp: 1000, money: 5000, limit: 10 },
    },
    weekly: {
        label: 'WEEKLY REWARD',
        cooldown: 604800000, 
        lastKey: 'lastweekly',
        color: '#9d00ff', // Purple
        free: { exp: 2999, money: 7000, limit: 15 },
        prem: { exp: 4999, money: 14000, limit: 30 },
    },
    monthly: {
        label: 'MONTHLY REWARD',
        cooldown: 2592000000, 
        lastKey: 'lastmonthly',
        color: '#ffcc00', // Gold
        free: { exp: 4999, money: 50000, limit: 30 },
        prem: { exp: 5999, money: 100000, limit: 50 },
    },
};

let handler = async (m, { conn, command, isPrems }) => {
    // 1. IDENTIFY TYPE
    const type = /daily|claim|harian/i.test(command) ? 'daily' : 
                 /weekly|mingguan/i.test(command) ? 'weekly' : 
                 /monthly|bulanan/i.test(command) ? 'monthly' : null;

    if (!type) return;

    const user = global.db.data.users[m.sender];
    const cfg = rewardConfig[type];
    const now = Date.now();
    const lastClaim = user[cfg.lastKey] || 0;
    const remaining = (lastClaim + cfg.cooldown) - now;

    // 2. COOLDOWN CHECK
    if (remaining > 0) {
        return m.reply(`⏳ *REWARD ALREADY CLAIMED* ⏳\n\nYou have already collected your *${cfg.label}*.\n\n*Available in:* ${formatTime(remaining)}`);
    }

    // 3. ASSIGN REWARD
    const reward = isPrems ? cfg.prem : cfg.free;
    user.exp += reward.exp;
    user.money += reward.money;
    user.limit += reward.limit;
    user[cfg.lastKey] = now;

    await m.react('🎁');

    // 4. --- CANVAS DRAWING (Reward Voucher) ---
    const width = 800, height = 400;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background: Dark Obsidian
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, width, height);

    // Side Accent Color (Based on Reward Type)
    ctx.fillStyle = cfg.color;
    ctx.fillRect(0, 0, 15, height);

    // Glass Box
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.roundRect(50, 50, width - 100, height - 100, 20);
    ctx.fill();
    ctx.strokeStyle = cfg.color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // User Profile Image
    let pp;
    try {
        pp = await loadImage(await conn.profilePictureUrl(m.sender, 'image'));
    } catch {
        pp = await loadImage('https://telegra.ph/file/24167bc30c0f9cc20079b.jpg');
    }

    ctx.save();
    ctx.beginPath();
    ctx.arc(140, 200, 60, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(pp, 80, 140, 120, 120);
    ctx.restore();

    // Text Content
    ctx.textAlign = 'left';
    ctx.fillStyle = cfg.color;
    ctx.font = 'bold 35px sans-serif';
    ctx.fillText(cfg.label, 230, 110);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(conn.getName(m.sender).toUpperCase(), 230, 150);

    ctx.font = '20px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText(`+ ${reward.exp.toLocaleString()} XP`, 230, 200);
    ctx.fillText(`+ $${reward.money.toLocaleString()} CASH`, 230, 240);
    ctx.fillText(`+ ${reward.limit} LIMITS`, 230, 280);

    if (isPrems) {
        ctx.fillStyle = cfg.color;
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText('⭐ PREMIUM BOOST ACTIVE', 230, 320);
    }

    // Footer
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('LADY-TRISH SYSTEMS • OMEGATECH RPG', width - 80, height - 80);

    // 5. SEND RESPONSE
    const buffer = canvas.toBuffer('image/png');
    
    let caption = `*🎁 ${cfg.label} COLLECTED!*

Hello *${conn.getName(m.sender)}*, your resources have been allocated successfully.

✨ *XP:* +${reward.exp.toLocaleString()}
💰 *Cash:* +$${reward.money.toLocaleString()}
🎫 *Limit:* +${reward.limit}

${isPrems ? '_Premium bonuses have been applied to your account._' : `_Upgrade to Premium for 2x rewards!_`}`;

    await conn.sendMessage(m.chat, { image: buffer, caption: caption }, { quoted: m });
};

handler.help = ['daily', 'weekly', 'monthly'];
handler.tags = ['rpg'];
handler.command = /^(daily|claim|harian|weekly|mingguan|monthly|bulanan)$/i;

export default handler;

function formatTime(ms) {
    let h = Math.floor(ms / 3600000);
    let m = Math.floor((ms % 3600000) / 60000);
    let s = Math.floor((ms % 60000) / 1000);
    return `${h}h ${m}m ${s}s`;
}