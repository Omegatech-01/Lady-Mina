import { createCanvas, loadImage } from 'canvas';

let handler = async (m, { conn, text, usedPrefix, command, isOwner }) => {
    if (!global.db.data.credits) global.db.data.credits = [];
    
    const ownerJid = '23278025474@s.whatsapp.net';
    
    // --- 1. FIXED MANAGEMENT LOGIC ---
    if (command === 'addcredit' || command === 'setrole') {
        if (!isOwner) return m.reply('❌ Restricted to Founder.');
        let [who, role] = text.split('|');
        if (!who || !role) throw `Usage: ${usedPrefix + command} @user | Role`;
        
        let jid = who.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        let name = conn.getName(jid) || 'Contributor';
        
        let index = global.db.data.credits.findIndex(v => v.jid === jid);
        if (index !== -1) {
            global.db.data.credits[index].role = role.trim();
        } else {
            global.db.data.credits.push({ jid, name, role: role.trim() });
        }
        return m.reply(`✅ *${name}* updated in team.`);
    }

    if (command === 'delcredit') {
        if (!isOwner) return m.reply('❌ Restricted to Founder.');
        if (!text) throw `Usage: ${usedPrefix}delcredit @user`;
        
        let jid = text.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        let initialLen = global.db.data.credits.length;
        global.db.data.credits = global.db.data.credits.filter(v => v.jid !== jid);
        
        if (global.db.data.credits.length === initialLen) return m.reply('❌ User not found in credits.');
        return m.reply(`🗑️ Removed successfully.`);
    }

    // --- 2. THE UI OVERHAUL (CANVAS) ---
    const team = global.db.data.credits;
    await m.react('💎');

    const width = 1000;
    const itemHeight = 100;
    const headerH = 180;
    const graphH = 300; // Extra space for the circle graph
    const footerH = 100;
    const height = headerH + (team.length * itemHeight) + graphH + footerH;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background: Modern Dark Mesh
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#020205');
    bgGrad.addColorStop(1, '#080c14');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Decorative Blur Circles (Sleek UI)
    drawBlurCircle(ctx, 900, 100, 200, 'rgba(0, 210, 255, 0.07)');
    drawBlurCircle(ctx, 100, height - 200, 250, 'rgba(157, 0, 255, 0.05)');

    // Header Title
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 60px sans-serif';
    ctx.fillText('CORE TEAM', width / 2, 85);
    ctx.font = '20px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText('OFFICIAL CONTRIBUTORS & STAFF', width / 2, 120);

    // DRAW THE TEAM LIST
    let yPos = 180;
    for (let i = 0; i < team.length; i++) {
        const member = team[i];
        const isMe = member.jid === ownerJid;

        // Glass Box
        ctx.fillStyle = isMe ? 'rgba(0, 210, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)';
        ctx.beginPath();
        ctx.roundRect(50, yPos, width - 100, 80, 15);
        ctx.fill();
        if (isMe) {
            ctx.strokeStyle = 'rgba(0, 210, 255, 0.3)';
            ctx.stroke();
        }

        // Avatar
        let pfp;
        try { pfp = await loadImage(await conn.profilePictureUrl(member.jid, 'image')); } 
        catch { pfp = await loadImage('https://telegra.ph/file/24167bc30c0f9cc20079b.jpg'); }

        ctx.save();
        ctx.beginPath();
        ctx.arc(100, yPos + 40, 30, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(pfp, 70, yPos + 10, 60, 60);
        ctx.restore();

        // Name & Role
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 26px sans-serif';
        const nameText = member.name.toUpperCase();
        ctx.fillText(nameText, 160, yPos + 35);

        // Blue Badge for Omegatech
        if (isMe) {
            const nw = ctx.measureText(nameText).width;
            drawVerifyBadge(ctx, 160 + nw + 20, yPos + 25, 18);
        }

        ctx.fillStyle = isMe ? '#00d2ff' : 'rgba(255, 255, 255, 0.6)';
        ctx.font = '18px sans-serif';
        ctx.fillText(member.role, 160, yPos + 65);

        yPos += itemHeight;
    }

    // --- CIRCLE GRAPH (DISTRIBUTION) ---
    const graphY = yPos + 100;
    const centerX = width / 2;
    
    ctx.beginPath();
    ctx.arc(centerX, graphY, 80, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 30;
    ctx.stroke();

    // Fill Graph (Blue segment representing the Founder's share of lead)
    ctx.beginPath();
    ctx.arc(centerX, graphY, 80, -Math.PI / 2, Math.PI);
    ctx.strokeStyle = '#00d2ff';
    ctx.lineWidth = 30;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText(`${team.length}`, centerX, graphY + 10);
    ctx.font = '14px sans-serif';
    ctx.fillText('TOTAL MEMBERS', centerX, graphY + 35);

    // Footer
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('LADY-TRISH CORE SYSTEMS', width / 2, height - 60);
    ctx.font = '12px sans-serif';
    ctx.fillText('DEVELOPED & MAINTAINED BY OMEGATECH', width / 2, height - 40);

    const buffer = canvas.toBuffer('image/png');
    await conn.sendMessage(m.chat, { image: buffer, caption: `*💎 Lady-Trish Project Team*` }, { quoted: m });
};

// --- HELPERS ---
function drawBlurCircle(ctx, x, y, r, color) {
    ctx.save();
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.restore();
}

function drawVerifyBadge(ctx, x, y, s) {
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = '#00d2ff';
    for (let i = 0; i < 24; i++) {
        let angle = (i * Math.PI) / 12;
        let rad = i % 2 === 0 ? s : s * 0.8;
        ctx.lineTo(x + rad * Math.cos(angle), y + rad * Math.sin(angle));
    }
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - s / 2, y);
    ctx.lineTo(x - s / 10, y + s / 2.5);
    ctx.lineTo(x + s / 1.5, y - s / 3);
    ctx.stroke();
    ctx.restore();
}

handler.help = ['credits'];
handler.tags = ['info'];
handler.command = /^(credits|addcredit|delcredit|setrole)$/i;

export default handler;