import { createCanvas } from 'canvas';

let handler = async (m, { conn, args, command, usedPrefix }) => {
    conn.casino = conn.casino ? conn.casino : {};
    
    // Prevent multiple games in one chat
    if (m.chat in conn.casino) return m.reply('🎰 *A game is already in progress!* Please wait for it to finish.');
    
    if (args.length < 1) return m.reply(`*Usage:* ${usedPrefix + command} <amount>\n*Example:* ${usedPrefix + command} 1000`);

    let user = global.db.data.users[m.sender];
    let count = args[0];
    count = /all/i.test(count) ? Math.floor(user.exp) : parseInt(count);
    count = Math.max(1, count);

    if (user.exp < count) return m.reply(`❌ *Insufficient XP!*\nYou need *${count.toLocaleString()} XP* to play.`);

    conn.casino[m.chat] = true;

    try {
        await m.react('🎲');

        // Logic: Bot (0-100) vs User (0-80) -> Hard Mode
        let botScore = Math.floor(Math.random() * 101);
        let userScore = Math.floor(Math.random() * 81);

        let status = '';
        let reward = 0;
        let color = '';

        if (botScore > userScore) {
            status = 'DEFEAT';
            reward = -count;
            color = '#ff4d4d'; // Red
        } else if (botScore < userScore) {
            status = 'VICTORY';
            reward = count; // Winning gives 2x back (original logic: +count)
            color = '#00ff88'; // Green
        } else {
            status = 'DRAW';
            reward = 0;
            color = '#00d2ff'; // Blue
        }

        user.exp += reward;

        // --- CANVAS DRAWING ---
        const width = 850, height = 450;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = '#050510';
        ctx.fillRect(0, 0, width, height);

        // Neon Glow Header
        ctx.shadowBlur = 15;
        ctx.shadowColor = color;
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, width, 80);
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 45px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`CASINO: ${status}`, width / 2, 55);

        // Draw Player and Bot Sections
        const drawStats = (x, title, score, subColor) => {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.beginPath();
            ctx.roundRect(x, 120, 300, 200, 20);
            ctx.fill();
            ctx.strokeStyle = subColor;
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 25px sans-serif';
            ctx.fillText(title, x + 150, 160);

            ctx.font = 'bold 80px sans-serif';
            ctx.fillStyle = subColor;
            ctx.fillText(score, x + 150, 260);
        };

        drawStats(80, 'YOU', userScore, '#00d2ff');
        drawStats(470, 'BOT', botScore, color);

        // Result Text
        ctx.fillStyle = '#ffffff';
        ctx.font = '22px monospace';
        const resultMsg = status === 'VICTORY' ? `PROFIT: +${reward} XP` : 
                          status === 'DEFEAT' ? `LOSS: ${reward} XP` : 'DRAW: XP RETURNED';
        ctx.fillText(resultMsg, width / 2, 380);

        // Footer
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = '18px sans-serif';
        ctx.fillText('LADY-TRISH CASINO ENGINE • OMEGATECH SYSTEMS', width / 2, 430);

        const buffer = canvas.toBuffer('image/png');

        let caption = `*🎰 NEON CASINO RESULTS 🎰*\n\n` +
                      `👤 *User Score:* ${userScore}\n` +
                      `🤖 *Bot Score:* ${botScore}\n\n` +
                      `Result: You *${status}*!\n` +
                      `Transaction: *${reward >= 0 ? '+' : ''}${reward} XP*\n` +
                      `Current Balance: *${user.exp.toLocaleString()} XP*`;

        await conn.sendMessage(m.chat, { 
            image: buffer, 
            caption: caption,
            mentions: [m.sender]
        }, { quoted: m });

    } catch (e) {
        console.error(e);
        m.reply('⚠️ *Error:* Casino machine malfunctioned.');
    } finally {
        delete conn.casino[m.chat];
    }
};

handler.help = ['casino <amount>'];
handler.tags = ['rpg'];
handler.command = /^(casino|csn)$/i;
handler.group = true;

export default handler;