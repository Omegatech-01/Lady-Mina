import { createCanvas, loadImage } from 'canvas';

let handler = async (m, { conn, usedPrefix, command }) => {
    // 1. INPUT VALIDATION
    const who = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : null;
    if (!who) throw `*⚠️ PARTNER REQUIRED* ⚠️\n\nPlease tag someone to start a business with.\nExample: *${usedPrefix + command} @user*`;

    if (!global.db.data.users[who]) return m.reply('❌ This user is not in my database.');
    if (who === m.sender) return m.reply('❌ You cannot start a business with yourself!');

    const user = global.db.data.users[m.sender];
    const partner = global.db.data.users[who];

    // 2. COOLDOWN & MODAL CHECK
    const now = Date.now();
    const cooldown = 28800000; // 8 Hours
    const diff = now - (user.lastdagang || 0);

    if (diff < cooldown) {
        return m.reply(`🕒 *BUSINESS ON HOLD* 🕒\n\nYour previous venture is still being processed. Wait for:\n*${clockString(cooldown - diff)}*`);
    }

    if (user.money < 5000) throw `❌ You need at least *$5,000* capital to start.`;
    if (partner.money < 5000) throw `❌ Your partner doesn't have enough capital ($5,000 min).`;

    // 3. INITIAL INVESTMENT LOGIC
    const investment = Math.floor(Math.random() * 5000) + 1000;
    
    user.money -= investment;
    partner.money -= investment;
    user.lastdagang = now;
    partner.lastdagang = now;

    await m.react('🤝');

    // 4. --- CANVAS DRAWING (Partnership Card) ---
    const width = 900, height = 500;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background: Executive Deep Blue
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#04040a');
    grad.addColorStop(1, '#0b132b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Header
    ctx.fillStyle = '#00d2ff';
    ctx.font = 'bold 45px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PARTNERSHIP AGREEMENT', width / 2, 80);

    // Helper to draw circular pfps
    async function drawPfp(jid, x, y) {
        let url;
        try { url = await conn.profilePictureUrl(jid, 'image'); } 
        catch { url = 'https://telegra.ph/file/24167bc30c0f9cc20079b.jpg'; }
        const img = await loadImage(url);
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, 80, 0, Math.PI * 2);
        ctx.lineWidth = 8;
        ctx.strokeStyle = '#00d2ff';
        ctx.stroke();
        ctx.clip();
        ctx.drawImage(img, x - 80, y - 80, 160, 160);
        ctx.restore();
    }

    // Draw User 1 (Left) and User 2 (Right)
    await drawPfp(m.sender, 250, 250);
    await drawPfp(who, 650, 250);

    // Central Icon (& or VS)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 60px sans-serif';
    ctx.fillText('&', width / 2, 270);

    // Business Details
    ctx.font = '22px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText(`Joint Capital: -$${(investment * 2).toLocaleString()}`, width / 2, 380);
    ctx.fillStyle = '#00ff88';
    ctx.fillText('STATUS: VENTURE STARTED', width / 2, 410);

    // Footer
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = '18px sans-serif';
    ctx.fillText('LADY-TRISH ECONOMY • POWERED BY OMEGATECH', width / 2, 470);

    const buffer = canvas.toBuffer('image/png');
    
    let initialCap = `*💼 NEW JOINT VENTURE STARTED!*

Partners: @${m.sender.split('@')[0]} & @${who.split('@')[0]}
Shared Capital: *$${investment.toLocaleString()}* each.

_Please wait for the market results..._
_First ROI expected in 1 hour._`;

    await conn.sendMessage(m.chat, { image: buffer, caption: initialCap, mentions: [m.sender, who] }, { quoted: m });

    // 5. TIMED REWARDS (FLOW)
    // First Result (1 Hour)
    setTimeout(() => {
        const roi = 15000;
        user.money += roi;
        partner.money += roi;
        conn.reply(m.chat, `*📈 VENTURE UPDATE (Phase 1)*\n\nThe business is booming! Both partners received a return of *$${roi.toLocaleString()}*.\n\nUser: +$15k\nPartner: +$15k`, m, { mentions: [m.sender, who] });
    }, 3600000);

    // Second Result (2 Hours)
    setTimeout(() => {
        const roi = 15000;
        user.money += roi;
        partner.money += roi;
        conn.reply(m.chat, `*🚀 VENTURE SUCCESS (Phase 2)*\n\nThe business has peaked! Both partners earned another *$${roi.toLocaleString()}*.\n\nTotal Venture Profit: *$30,000* each!`, m, { mentions: [m.sender, who] });
    }, 7200000);
};

handler.help = ['trade <@user>'];
handler.tags = ['rpg'];
handler.command = /^(berdagang|trade|venture)$/i;
handler.register = true;
handler.group = true;

export default handler;

function clockString(ms) {
    let h = Math.floor(ms / 3600000);
    let m = Math.floor(ms / 60000) % 60;
    let s = Math.floor(ms / 1000) % 60;
    return `${h}h ${m}m ${s}s`;
}