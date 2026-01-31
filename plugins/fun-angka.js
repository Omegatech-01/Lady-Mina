import { createCanvas } from 'canvas';

let handler = async (m, { conn, args, usedPrefix, command }) => {
    const userNumber = args[0];
    const validNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

    if (!userNumber || !validNumbers.includes(userNumber)) {
        return m.reply(`*⚠️ Invalid Input!*\nUse: ${usedPrefix + command} <0-9>\nExample: ${usedPrefix + command} 7`);
    }

    const botNumber = validNumbers[Math.floor(Math.random() * validNumbers.length)];
    const isWin = userNumber === botNumber;
    const bonus = isWin ? Math.floor(Math.random() * 500) + 200 : Math.floor(Math.random() * 100) + 10;

    global.db.data.users[m.sender].exp += bonus;

    // --- CANVAS DRAWING ---
    const width = 800, height = 400;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background Gradient (Casino Style)
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#0f0c29');
    grad.addColorStop(0.5, '#302b63');
    grad.addColorStop(1, '#24243e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Glow Effect
    ctx.shadowBlur = 20;
    ctx.shadowColor = isWin ? '#00ff88' : '#ff4d4d';

    // User Box
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.roundRect(50, 100, 300, 200, 20);
    ctx.fill();
    
    // Bot Box
    ctx.roundRect(450, 100, 300, 200, 20);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Text: Labels
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText('YOUR PICK', 200, 80);
    ctx.fillText('BOT PICK', 600, 80);

    // Text: Numbers
    ctx.font = 'bold 120px sans-serif';
    ctx.fillStyle = '#00d2ff';
    ctx.fillText(userNumber, 200, 240);
    ctx.fillStyle = isWin ? '#00ff88' : '#ff4d4d';
    ctx.fillText(botNumber, 600, 240);

    // Result Badge
    ctx.font = 'bold 40px sans-serif';
    ctx.fillStyle = isWin ? '#00ff88' : '#ff4d4d';
    ctx.fillText(isWin ? '🏆 YOU WIN!' : '❌ YOU LOSE', 400, 350);

    // Footer
    ctx.font = '20px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText(`REWARD: +${bonus} XP`, 400, 380);

    const buffer = canvas.toBuffer();
    
    let caption = `*🎲 GUESS NUMBER RESULT*\n\n` +
                  `👤 Your Pick: *${userNumber}*\n` +
                  `🤖 Bot Pick: *${botNumber}*\n\n` +
                  `${isWin ? '✅ Amazing! Your prediction was correct!' : '❌ Oops! Try again next time.'}\n` +
                  `🎁 Bonus: *+${bonus} XP*`;

    await conn.sendMessage(m.chat, { image: buffer, caption }, { quoted: m });
};

handler.help = ['guess <0-9>'];
handler.tags = ['game'];
handler.command = /^(angka|guess|gtn)$/i;

export default handler;