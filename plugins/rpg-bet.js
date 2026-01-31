import { createCanvas } from 'canvas';

let confirm = {};

async function handler(m, { conn, args, usedPrefix, command }) {
    if (m.sender in confirm) throw '⚠️ You still have an active bet! Please finish it first.';

    try {
        let user = global.db.data.users[m.sender];
        // Handle "all" or specific amount
        let amount = args[0] && !isNaN(args[0]) ? Math.max(parseInt(args[0]), 1) : 
                     /all/i.test(args[0]) ? Math.floor(user.money) : 1;

        if (user.money < amount) return m.reply(`❌ *Insufficient Funds!*\nYou need *$${amount.toLocaleString()}* to place this bet.`);
        if (amount < 100) return m.reply('❌ *Minimum bet is $100.*');

        confirm[m.sender] = {
            count: amount,
            timeout: setTimeout(() => {
                m.reply('⌛ *Bet Timed Out!* The session has been cancelled.');
                delete confirm[m.sender];
            }, 60000),
        };

        const cap = `*🎰 CYBER BET INITIATED 🎰*\n\n` +
                    `👤 *Gambler:* ${conn.getName(m.sender)}\n` +
                    `💵 *Stake:* $${amount.toLocaleString()}\n` +
                    `⏰ *Time:* 60 Seconds\n\n` +
                    `_Type *Yes* to confirm the bet or *No* to cancel._`;

        conn.reply(m.chat, cap, m);
    } catch (e) {
        console.error(e);
        if (m.sender in confirm) {
            clearTimeout(confirm[m.sender].timeout);
            delete confirm[m.sender];
        }
        m.reply('⚠️ System Error: The Betting Engine failed.');
    }
}

handler.before = async (m, { conn }) => {
    if (!(m.sender in confirm)) return;
    if (m.isBaileys) return;

    let session = confirm[m.sender];
    let user = global.db.data.users[m.sender];
    let txt = m.text.trim().toLowerCase();

    // --- YES: EXECUTE BET ---
    if (/^(yes|y|yeah|ya|confirm)$/i.test(txt)) {
        clearTimeout(session.timeout);

        let stake = session.count;
        let botScore = Math.ceil(Math.random() * 91); // Max 91
        let userScore = Math.floor(Math.random() * 71); // Max 71

        let status = '';
        let profit = 0;
        let color = '';

        if (userScore > botScore) {
            profit = stake;
            user.money += profit;
            status = 'WINNER';
            color = '#00ff88'; // Neon Green
        } else if (userScore < botScore) {
            profit = -stake;
            user.money += profit;
            status = 'LOST';
            color = '#ff4d4d'; // Neon Red
        } else {
            profit = Math.floor(stake / 1.5);
            user.money += profit;
            status = 'DRAW';
            color = '#ffcc00'; // Gold
        }

        // --- CANVAS DRAWING (Casino Result) ---
        const width = 800, height = 400;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Background: Casino Dark Blue
        ctx.fillStyle = '#050510';
        ctx.fillRect(0, 0, width, height);

        // Header
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, width, 80);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 45px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`RESULT: ${status}`, width / 2, 55);

        // Score Circles
        const drawCircle = (x, label, score, sColor) => {
            ctx.beginPath();
            ctx.arc(x, 220, 80, 0, Math.PI * 2);
            ctx.strokeStyle = sColor;
            ctx.lineWidth = 10;
            ctx.stroke();
            
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 60px sans-serif';
            ctx.fillText(score, x, 240);
            
            ctx.font = '20px sans-serif';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fillText(label, x, 330);
        };

        drawCircle(250, 'YOUR SCORE', userScore, '#00d2ff');
        drawCircle(550, 'BOT SCORE', botScore, color);

        // Footer Branding
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText('LADY-TRISH CASINO • OMEGATECH SYSTEMS', width / 2, 385);

        const buffer = canvas.toBuffer('image/png');
        
        let caption = `*🎰 BETTING RESULTS 🎰*\n\n` +
                      `👤 *You:* ${userScore}\n` +
                      `🤖 *Bot:* ${botScore}\n\n` +
                      `Result: You *${status}*!\n` +
                      `Cash Flow: *${profit >= 0 ? '+' : ''}$${profit.toLocaleString()}*\n` +
                      `Current Balance: *$${user.money.toLocaleString()}*`;

        await conn.sendMessage(m.chat, { image: buffer, caption: caption }, { quoted: m });
        delete confirm[m.sender];
        return true;
    }

    // --- NO: CANCEL BET ---
    if (/^(no|n|stop|cancel|tidak)$/i.test(txt)) {
        clearTimeout(session.timeout);
        delete confirm[m.sender];
        m.reply('🚫 *Bet Cancelled.* Your money is safe.');
        return true;
    }
};

handler.help = ['bet <amount>'];
handler.tags = ['rpg'];
handler.command = /^(judi|bet)$/i;

export default handler;