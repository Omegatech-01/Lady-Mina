import { createCanvas, loadImage } from 'canvas';

let handler = async (m, { conn, usedPrefix, command }) => {
    try {
        const user = global.db.data.users[m.sender];
        const now = Date.now();
        const cooldown = 604800000; // 7 Days
        const diff = now - (user.lastbansos || 0);

        // --- 1. COOLDOWN CHECK ---
        if (diff < cooldown) {
            const timers = clockString(cooldown - diff);
            return m.reply(`⚠️ *HEIST ON COOLDOWN* ⚠️\n\nThe Anti-Corruption Squad is currently monitoring your accounts.\n\n*Wait for:* ${timers}\n_Try again once the heat dies down._`);
        }

        // --- 2. HEIST LOGIC ---
        const risk = Math.floor(Math.random() * 101); // 0-100
        const luck = Math.floor(Math.random() * 81);  // 0-80
        
        let status = '';
        let amount = 0;
        let color = '';

        if (risk > luck) {
            // CAUGHT
            status = 'CAUGHT';
            amount = -5000000;
            color = '#ff4d4d'; // Red
            user.money = Math.max(0, (user.money || 0) + amount); // Prevent negative if desired, or allow it
        } else if (risk < luck) {
            // SUCCESS
            status = 'SUCCESS';
            amount = 2000000;
            color = '#00ff88'; // Green
            user.money = (user.money || 0) + amount;
        } else {
            // BRIBE
            status = 'BRIBED';
            amount = 0;
            color = '#ffcc00'; // Gold
        }

        user.lastbansos = now; // Set Cooldown

        // --- 3. CANVAS DRAWING (Heist Report) ---
        const width = 850, height = 450;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Background: Dark Noir Theme
        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, width, height);

        // Header Bar
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, width, 80);

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 40px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`HEIST REPORT: ${status}`, width / 2, 55);

        // User Avatar
        let pp;
        try {
            pp = await loadImage(await conn.profilePictureUrl(m.sender, 'image'));
        } catch {
            pp = await loadImage('https://telegra.ph/file/24167bc30c0f9cc20079b.jpg');
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(150, 250, 90, 0, Math.PI * 2);
        ctx.lineWidth = 10;
        ctx.strokeStyle = color;
        ctx.stroke();
        ctx.clip();
        ctx.drawImage(pp, 60, 160, 180, 180);
        ctx.restore();

        // Data Fields
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 30px sans-serif';
        ctx.fillText(conn.getName(m.sender).toUpperCase(), 300, 180);

        ctx.font = '22px monospace';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillText(`ID       : ${m.sender.split('@')[0]}`, 300, 220);
        ctx.fillText(`DATE     : ${new Date().toLocaleDateString()}`, 300, 250);
        ctx.fillText(`OUTCOME  :`, 300, 280);

        ctx.fillStyle = color;
        ctx.font = 'bold 28px sans-serif';
        if (status === 'CAUGHT') {
            ctx.fillText('BUSTED BY ANTI-CORRUPTION SQUAD', 430, 280);
            ctx.fillStyle = '#ff4d4d';
            ctx.fillText(`FINE: -$5,000,000`, 300, 330);
        } else if (status === 'SUCCESS') {
            ctx.fillText('FUNDS LAUNDERED SUCCESSFULLY', 430, 280);
            ctx.fillStyle = '#00ff88';
            ctx.fillText(`PROFIT: +$2,000,000`, 300, 330);
        } else {
            ctx.fillText('INVESTIGATION STALLED (BRIBED)', 430, 280);
            ctx.fillStyle = '#ffcc00';
            ctx.fillText(`STATUS: ESCAPED VIA PAYOFF`, 300, 330);
        }

        // Footer
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText('LADY-TRISH HEIST ENGINE • OMEGATECH SYSTEMS', width / 2, 420);

        // --- 4. SEND RESPONSE ---
        const buffer = canvas.toBuffer('image/png');
        
        let caption = '';
        if (status === 'CAUGHT') {
            caption = `🚨 *BUSTED!* 🚨\n\nYou were caught laundering government funds. The court has ordered you to pay a fine of *$5,000,000* to avoid prison time.`;
        } else if (status === 'SUCCESS') {
            caption = `💰 *HEIST SUCCESSFUL!* 💰\n\nYou successfully diverted public funds into your offshore account. You earned *$2,000,000*!`;
        } else {
            caption = `⚖️ *INVESTIGATION ADJOURNED* ⚖️\n\nThe heist failed, but you successfully bribed the officials. You didn't make any money, but you stayed out of a jail cell.`;
        }

        await conn.sendMessage(m.chat, { image: buffer, caption: caption }, { quoted: m });

    } catch (e) {
        console.error(e);
        m.reply('⚠️ System Error: The Heist Engine is currently offline.');
    }
};

handler.help = ['corruption'];
handler.tags = ['rpg'];
handler.command = /^(korupsi|corruption|heist)$/i;
handler.group = true;

export default handler;

// Helper: Improved Timer
function clockString(ms) {
    let d = Math.floor(ms / 86400000);
    let h = Math.floor((ms % 86400000) / 3600000);
    let m = Math.floor((ms % 3600000) / 60000);
    let s = Math.floor((ms % 60000) / 1000);
    return `${d}d ${h}h ${m}m ${s}s`;
}