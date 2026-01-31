import { createCanvas, loadImage } from 'canvas';
import { createHash } from 'crypto';

let Reg = /\|?(.*)([.|] *?)([0-9]*)$/i;

let handler = async function (m, { text, usedPrefix, conn, command }) {
    let user = global.db.data.users[m.sender];
    
    // 1. Validation Logic
    if (user.registered === true) 
        throw `⚠️ You are already registered!\nUse *${usedPrefix}unreg* to reset.`;

    if (!Reg.test(text)) 
        return m.reply(`*Format Wrong!*\nExample: ${usedPrefix + command} Thor.17`);

    let [_, name, _splitter, age] = text.match(Reg);
    if (!name) throw 'Name cannot be empty';
    if (!age) throw 'Age cannot be empty';

    age = parseInt(age);
    if (age > 50) throw '👴 Too old! Max age is 50.';
    if (age < 12) throw '👶 Underage users are not allowed.';

    // 2. Database Update
    user.name = name.trim();
    user.age = age;
    user.regTime = Date.now();
    user.registered = true;
    user.axe = 1;
    user.axedurability = 30;
    user.pickaxe = 1;
    user.pickaxedurability = 40;

    let sn = createHash('md5').update(m.sender).digest('hex').slice(0, 16); // Shortened for UI
    let totalUsers = Object.values(global.db.data.users).filter(v => v.registered == true).length;

    await m.react('📝');

    // 3. --- Canvas Drawing ---
    const width = 900;
    const height = 500;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background: Cyberpunk Dark
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#050505');
    grad.addColorStop(1, '#121212');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Decorative Elements (Glowing Lines)
    ctx.strokeStyle = '#00d2ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 50); ctx.lineTo(width, 50);
    ctx.moveTo(0, height - 50); ctx.lineTo(width, height - 50);
    ctx.stroke();

    // Side Badge
    ctx.fillStyle = '#00d2ff';
    ctx.fillRect(0, 150, 10, 200);

    // Load Profile Picture
    let pp;
    try {
        const url = await conn.profilePictureUrl(m.sender, 'image');
        pp = await loadImage(url);
    } catch {
        pp = await loadImage('https://telegra.ph/file/24167bc30c0f9cc20079b.jpg');
    }

    // Avatar Circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(180, 250, 110, 0, Math.PI * 2);
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#00d2ff';
    ctx.stroke();
    ctx.clip();
    ctx.drawImage(pp, 70, 140, 220, 220);
    ctx.restore();

    // Main Header
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 40px sans-serif';
    ctx.fillText('CITIZEN REGISTRATION', 340, 120);

    // User Information Fields
    ctx.font = '22px monospace';
    ctx.fillStyle = '#00d2ff';
    ctx.fillText('NAME   :', 340, 180);
    ctx.fillText('AGE    :', 340, 220);
    ctx.fillText('SERIAL :', 340, 260);
    ctx.fillText('STATUS :', 340, 300);

    ctx.fillStyle = '#ffffff';
    ctx.fillText(user.name.toUpperCase(), 460, 180);
    ctx.fillText(`${user.age} YEARS OLD`, 460, 220);
    ctx.fillText(sn.toUpperCase(), 460, 260);
    ctx.fillStyle = '#00ff88'; // Green for Verified
    ctx.fillText('VERIFIED CITIZEN', 460, 300);

    // Starter Pack Box
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.strokeRect(340, 330, 500, 100);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(340, 330, 500, 100);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('STARTER PACK LOADED', 355, 360);
    
    ctx.font = '18px monospace';
    ctx.fillStyle = '#00d2ff';
    ctx.fillText('🪓 AXE (LV.1)', 355, 395);
    ctx.fillText('⛏️ PICKAXE (LV.1)', 355, 415);
    
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('DUR: 30', 820, 395);
    ctx.fillText('DUR: 40', 820, 415);

    // Footer
    ctx.textAlign = 'left';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillText('LADY-TRISH', 50, 480);
    
    ctx.textAlign = 'right';
    ctx.fillText(`MEMBER #${totalUsers}`, 850, 480);
    ctx.font = '14px sans-serif';
    ctx.fillText('OMEGATECH SYSTEMS ©', 850, 30);

    // 4. Send Response
    const buffer = canvas.toBuffer('image/png');
    
    let cap = `*✅ REGISTRATION SUCCESSFUL*

👤 *Name:* ${user.name}
🎂 *Age:* ${user.age} Years
🔑 *SN:* ${sn}

🎁 *Starter Pack:*
• 1x Axe (30 Durability)
• 1x Pickaxe (40 Durability)

_You are now registered as user #${totalUsers} in our database._`;

    await conn.sendMessage(m.chat, { 
        image: buffer, 
        caption: cap 
    }, { quoted: m });
};

handler.help = ['register <name>.<age>'];
handler.tags = ['xp'];
handler.command = /^(daftar|verify|reg(ister)?)$/i;

export default handler;