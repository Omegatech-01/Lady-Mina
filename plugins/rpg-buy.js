import { createCanvas } from 'canvas';

const ITEM_PRICES = {
    potion: 5000,
    bibitapel: 2000,
    bibitjeruk: 2000,
    bibitmangga: 2000,
    bibitpisang: 2000,
    bibitanggur: 2000,
    wood: 500,
    iron: 1500,
    string: 300
};

let handler = async (m, { conn, args, usedPrefix, command }) => {
    let type = (args[0] || '').toLowerCase();
    let count = Math.max(1, parseInt(args[1]) || 1);
    let user = global.db.data.users[m.sender];

    // --- CASE 1: SHOW SHOP CATALOG ---
    if (!type || !ITEM_PRICES[type]) {
        let list = `*🛒 OMEGATECH MARKET CATALOG*\n\n`;
        for (let [item, price] of Object.entries(ITEM_PRICES)) {
            list += `• *${item}* — $${price.toLocaleString()}\n`;
        }
        list += `\n*Usage:* ${usedPrefix + command} <item> <amount>\n*Example:* ${usedPrefix + command} potion 5`;
        return m.reply(list);
    }

    // --- CASE 2: PURCHASE LOGIC ---
    let totalCost = ITEM_PRICES[type] * count;
    if (user.money < totalCost) {
        return m.reply(`❌ *Insufficient Balance!*\nYou need *$${totalCost.toLocaleString()}* but you only have *$${user.money.toLocaleString()}*`);
    }

    user.money -= totalCost;
    user[type] = (user[type] || 0) + count;

    await m.react('💳');

    // --- CANVAS RECEIPT ---
    const width = 600, height = 400;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Design: Receipt Style
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    ctx.strokeStyle = '#000000';
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(20, 20, width - 40, height - 40);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 30px monospace';
    ctx.fillText('TRANSACTION RECEIPT', width / 2, 80);

    ctx.textAlign = 'left';
    ctx.font = '18px monospace';
    ctx.fillText(`ITEM     : ${type.toUpperCase()}`, 60, 150);
    ctx.fillText(`QUANTITY : ${count}`, 60, 190);
    ctx.fillText(`TOTAL    : $${totalCost.toLocaleString()}`, 60, 230);
    ctx.fillText(`DATE     : ${new Date().toLocaleString()}`, 60, 270);

    ctx.textAlign = 'center';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('STATUS: PAID IN FULL', width / 2, 340);

    const buffer = canvas.toBuffer('image/png');
    await conn.sendMessage(m.chat, { image: buffer, caption: `✅ *Purchase Successful!*\nYou bought *${count} ${type}* for *$${totalCost.toLocaleString()}*.\nRemaining Balance: *$${user.money.toLocaleString()}*` }, { quoted: m });
};

handler.help = ['buy <item> <count>'];
handler.tags = ['rpg'];
handler.command = /^(buy|beli)$/i;

export default handler;