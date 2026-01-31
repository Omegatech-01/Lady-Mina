import { createCanvas } from 'canvas';

const rewards = {
    common: {
        color: '#aaaaaa',
        money: 101, exp: 201, trash: 11,
        potion: [0, 1, 0, 1, 0, 0, 0, 0, 0],
        common: [0, 1, 0, 1, 0, 0, 0, 0, 0, 0],
        uncommon: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
    uncommon: {
        color: '#00ff88',
        money: 201, exp: 401, trash: 31,
        potion: [0, 1, 0, 0, 0, 0, 0],
        diamond: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        common: [0, 1, 0, 0, 0, 0, 0, 0],
        uncommon: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
        mythic: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        wood: [0, 1, 0, 0, 0, 0],
        rock: [0, 1, 0, 0, 0, 0],
        string: [0, 1, 0, 0, 0, 0],
    },
    mythic: {
        color: '#9d00ff',
        money: 301, exp: 551, trash: 61,
        potion: [0, 1, 0, 0, 0, 0],
        emerald: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        diamond: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
        gold: [0, 1, 0, 0, 0, 0, 0, 0, 0],
        iron: [0, 1, 0, 0, 0, 0, 0, 0],
        common: [0, 1, 0, 0, 0, 0],
        uncommon: [0, 1, 0, 0, 0, 0, 0, 0],
        mythic: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
        legendary: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        pet: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        wood: [0, 1, 0, 0, 0],
        rock: [0, 1, 0, 0, 0],
        string: [0, 1, 0, 0, 0],
    },
    legendary: {
        color: '#ffcc00',
        money: 401, exp: 601, trash: 101,
        potion: [0, 1, 0, 0, 0],
        emerald: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
        diamond: [0, 1, 0, 0, 0, 0, 0, 0, 0],
        gold: [0, 1, 0, 0, 0, 0, 0, 0],
        iron: [0, 1, 0, 0, 0, 0, 0],
        common: [0, 1, 0, 0],
        uncommon: [0, 1, 0, 0, 0, 0],
        mythic: [0, 1, 0, 0, 0, 0, 0, 0, 0],
        legendary: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
        pet: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
        wood: [0, 1, 0, 0],
        rock: [0, 1, 0, 0],
        string: [0, 1, 0, 0],
    }
};

let handler = async (m, { conn, command, args, usedPrefix }) => {
    let user = global.db.data.users[m.sender];
    let type = (args[0] || '').toLowerCase();
    let count = Math.max(1, parseInt(args[1]) || 1);

    // --- CASE 1: SHOW VAULT MENU ---
    if (!type || !rewards[type]) {
        const width = 800, height = 500;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#00d2ff';
        ctx.font = 'bold 50px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('LOOT VAULT', width / 2, 80);

        // Draw Crate Inventory Buttons
        const drawCrate = (name, color, x, y, userCount) => {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.beginPath();
            ctx.roundRect(x, y, 320, 100, 15);
            ctx.fill();
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.textAlign = 'left';
            ctx.fillStyle = color;
            ctx.font = 'bold 24px sans-serif';
            ctx.fillText(name.toUpperCase(), x + 25, y + 45);
            ctx.fillStyle = '#ffffff';
            ctx.font = '18px monospace';
            ctx.fillText(`Owned: ${userCount}`, x + 25, y + 80);
        };

        drawCrate('Common', '#aaaaaa', 60, 150, user.common || 0);
        drawCrate('Uncommon', '#00ff88', 420, 150, user.uncommon || 0);
        drawCrate('Mythic', '#9d00ff', 60, 280, user.mythic || 0);
        drawCrate('Legendary', '#ffcc00', 420, 280, user.legendary || 0);

        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = '16px sans-serif';
        ctx.fillText(`Usage: ${usedPrefix + command} <crate> <amount>`, width / 2, 450);

        const buffer = canvas.toBuffer('image/png');
        return conn.sendMessage(m.chat, { image: buffer, caption: `*📦 LADY-TRISH LOOT VAULT*\nPlease choose a crate type to open.` }, { quoted: m });
    }

    // --- CASE 2: UNBOXING LOGIC ---
    if (user[type] < count) {
        return m.reply(`❌ *Insufficient Stock!* You only have *${user[type]}* ${type} crates.\nBuy more in the shop.`);
    }

    let crateReward = {};
    for (let i = 0; i < count; i++) {
        for (let [reward, value] of Object.entries(rewards[type])) {
            if (reward === 'color') continue;
            if (reward in user) {
                // Handle probabilities
                const total = Array.isArray(value) ? value[Math.floor(Math.random() * value.length)] : value;
                if (total) {
                    user[reward] += total;
                    crateReward[reward] = (crateReward[reward] || 0) + total;
                }
            }
        }
    }
    user[type] -= count;

    await m.react('🎁');

    // --- CASE 3: RESULT CANVAS ---
    const resColor = rewards[type].color;
    const width = 850, height = 550;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#020205';
    ctx.fillRect(0, 0, width, height);

    // Glowing Header
    ctx.fillStyle = resColor;
    ctx.fillRect(0, 0, width, 80);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 40px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`UNBOXING: ${count}x ${type.toUpperCase()}`, width / 2, 55);

    // Rewards List
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = '22px monospace';
    
    let yPos = 150;
    const items = Object.keys(crateReward);
    
    items.forEach((item, i) => {
        if (i < 12) { // Limit display to fit
            const col = i >= 6 ? 450 : 80;
            const rowY = i >= 6 ? yPos + ((i - 6) * 45) : yPos + (i * 45);
            ctx.fillStyle = resColor;
            ctx.fillText('+', col, rowY);
            ctx.fillStyle = '#ffffff';
            ctx.fillText(`${crateReward[item]} ${item.toUpperCase()}`, col + 30, rowY);
        }
    });

    // Special Rare Catch Highlight
    if (crateReward.legendary || crateReward.mythic || crateReward.diamond) {
        ctx.fillStyle = 'rgba(255, 204, 0, 0.1)';
        ctx.fillRect(50, 420, 750, 60);
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🌟 RARE ITEMS ACQUIRED IN THIS DROP!', width / 2, 458);
    }

    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.font = '14px sans-serif';
    ctx.fillText('OMEGATECH RPG ENGINE • ACCESS GRANTED', width / 2, 520);

    const buffer = canvas.toBuffer('image/png');
    
    let caption = `*🎁 UNBOXING COMPLETE*
Successfully opened *${count}x ${type}* crates.

_The items above have been added to your inventory._`;

    await conn.sendMessage(m.chat, { image: buffer, caption: caption }, { quoted: m });
};

handler.help = ['open <crate> <amount>'];
handler.tags = ['rpg'];
handler.command = /^(open|unbox|gacha)$/i;

export default handler;