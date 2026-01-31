import { createCanvas, loadImage } from 'canvas';
import { createHash } from 'crypto';

let handler = async function (m, { args, conn, usedPrefix }) {
    // 1. Validation Logic
    if (!args[0]) throw `⚠️ *Serial Number is missing.*\n\nPlease provide your Serial Number to unregister.`;
    
    let user = global.db.data.users[m.sender];
    let sn = createHash('md5').update(m.sender).digest('hex');
    
    if (args[0] !== sn) throw `❌ *Invalid Serial Number.*\n\nAccess denied. You can find your SN by checking your profile or registration card.`;

    // 2. Perform Unregistration
    const userName = user.name || conn.getName(m.sender);
    user.registered = false;
    await m.react('🚫');

    // 3. --- Canvas Drawing (Deactivation Card) ---
    const width = 850;
    const height = 400;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background: Dark Warning Theme
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#0a0000');
    grad.addColorStop(1, '#240000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Red Security Borders
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 15;
    ctx.strokeRect(0, 0, width, height);

    // Decorative "Access Revoked" Overlay
    ctx.fillStyle = 'rgba(255, 0, 0, 0.05)';
    ctx.font = 'bold 100px sans-serif';
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate(-Math.PI / 12);
    ctx.textAlign = 'center';
    ctx.fillText('TERMINATED', 0, 0);
    ctx.restore();

    // User Avatar (Grayscale to indicate deactivation)
    let pp;
    try {
        const url = await conn.profilePictureUrl(m.sender, 'image');
        pp = await loadImage(url);
    } catch {
        pp = await loadImage('https://telegra.ph/file/24167bc30c0f9cc20079b.jpg');
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(50, 80, 200, 200);
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.clip();
    
    // Apply grayscale filter to avatar
    ctx.filter = 'grayscale(100%)';
    ctx.drawImage(pp, 50, 80, 200, 200);
    ctx.restore();

    // Data Fields
    ctx.filter = 'none';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ff4d4d';
    ctx.font = 'bold 40px sans-serif';
    ctx.fillText('ACCESS REVOKED', 280, 110);

    ctx.font = '22px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`SUBJECT : ${userName.toUpperCase()}`, 280, 170);
    ctx.fillText(`STATUS  : DEACTIVATED`, 280, 210);
    ctx.fillText(`SN ID   : ${sn.slice(0, 16).toUpperCase()}...`, 280, 250);

    // Danger Warning Symbol (Triangle)
    ctx.beginPath();
    ctx.moveTo(750, 150);
    ctx.lineTo(800, 250);
    ctx.lineTo(700, 250);
    ctx.closePath();
    ctx.fillStyle = '#ff0000';
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 60px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', 750, 235);

    // Footer
    ctx.textAlign = 'left';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillText('LADY-TRISH SECURITY', 50, 360);
    
    ctx.textAlign = 'right';
    ctx.fillText('OMEGATECH SYSTEMS', 800, 360);

    // 4. Send Response
    const buffer = canvas.toBuffer('image/png');
    
    let caption = `*🚨 SECURITY ALERT: ACCESS REVOKED*

The user *${userName}* has been successfully removed from the database. 

• *Status:* Unregistered
• *Serial:* ${sn}
• *Action:* Database Entry Purged

_To use our services again, please use the ${usedPrefix}register command._`;

    await conn.sendMessage(m.chat, { 
        image: buffer, 
        caption: caption 
    }, { quoted: m });
};

handler.help = ['unregister <SN>'];
handler.tags = ['xp'];
handler.command = /^unreg(ister)?$/i;
handler.register = true;

export default handler;