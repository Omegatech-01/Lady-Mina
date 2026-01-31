import { createCanvas } from 'canvas';

let handler = async (m, { conn, usedPrefix }) => {
    let user = global.db.data.users[m.sender];
    if (user.health >= 100) return m.reply('❤️ *System:* Your health is already full!');
    if (user.potion < 1) return m.reply(`❌ *No Potions!* You need to buy potions first using *${usedPrefix}buy potion 1*`);

    let before = user.health;
    user.potion -= 1;
    user.health += 40; // Heals 40 HP
    if (user.health > 100) user.health = 100;

    await m.react('🧪');

    const width = 600, height = 300;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, width, height);

    // Medical Frame
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 10;
    ctx.strokeRect(10, 10, width - 20, height - 20);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#00ff88';
    ctx.font = 'bold 40px sans-serif';
    ctx.fillText('RECOVERY SUCCESS', width / 2, 80);

    ctx.fillStyle = '#ffffff';
    ctx.font = '25px monospace';
    ctx.fillText(`Health: ${before} → ${user.health}`, width / 2, 160);

    // Health Bar
    ctx.fillStyle = '#333';
    ctx.roundRect(100, 200, 400, 30, 15);
    ctx.fill();
    ctx.fillStyle = '#00ff88';
    ctx.roundRect(100, 200, (user.health / 100) * 400, 30, 15);
    ctx.fill();

    const buffer = canvas.toBuffer('image/png');
    await conn.sendMessage(m.chat, { image: buffer, caption: `🧪 *Heal Successful!*\nYou used 1 Potion.\n*Current Health:* ${user.health} HP` }, { quoted: m });
};

handler.help = ['heal'];
handler.tags = ['rpg'];
handler.command = /^(heal)$/i;
export default handler;