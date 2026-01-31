import { createCanvas } from 'canvas';

let handler = async (m, { conn, usedPrefix }) => {
    let user = global.db.data.users[m.sender];
    await m.react('📦');

    const width = 1000, height = 800;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#020205';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#00d2ff';
    ctx.font = 'bold 50px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TREASURY VAULT', width / 2, 80);

    const drawSection = (title, items, x, y) => {
        ctx.textAlign = 'left';
        ctx.fillStyle = '#00d2ff';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText(title, x, y);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '18px monospace';
        items.forEach((item, i) => {
            ctx.fillText(`• ${item.name}: ${item.val}`, x, y + 35 + (i * 28));
        });
    };

    // Data Categories
    drawSection('RESOURCES', [
        { name: 'Money', val: `$${(user.money || 0).toLocaleString()}` },
        { name: 'XP', val: (user.exp || 0).toLocaleString() },
        { name: 'Diamond', val: user.diamond || 0 },
        { name: 'Emerald', val: user.emerald || 0 },
        { name: 'Gold', val: user.gold || 0 },
        { name: 'Iron', val: user.iron || 0 }
    ], 80, 160);

    drawSection('TOOLS & GEAR', [
        { name: 'Sword', val: user.sword ? 'Equipped' : 'None' },
        { name: 'Armor', val: user.armor ? 'Equipped' : 'None' },
        { name: 'Pickaxe', val: user.pickaxe ? 'Equipped' : 'None' },
        { name: 'Axe', val: user.axe ? 'Equipped' : 'None' },
        { name: 'ATM Card', val: user.atm ? 'Active' : 'None' }
    ], 400, 160);

    drawSection('LIVESTOCK', [
        { name: 'Bull', val: user.banteng || 0 },
        { name: 'Tiger', val: user.harimau || 0 },
        { name: 'Elephant', val: user.gajah || 0 },
        { name: 'Panda', val: user.panda || 0 },
        { name: 'Crocodile', val: user.buaya || 0 }
    ], 700, 160);

    drawSection('GREENHOUSE', [
        { name: 'Apples', val: user.apel || 0 },
        { name: 'Mangos', val: user.mangga || 0 },
        { name: 'Oranges', val: user.jeruk || 0 },
        { name: 'Grapes', val: user.anggur || 0 },
        { name: 'Seeds', val: (user.bibitapel || 0) + (user.bibitjeruk || 0) }
    ], 80, 420);

    drawSection('CONSUMABLES', [
        { name: 'Potions', val: user.potion || 0 },
        { name: 'Trash', val: user.trash || 0 },
        { name: 'Wood', val: user.wood || 0 },
        { name: 'Rock', val: user.rock || 0 },
        { name: 'String', val: user.string || 0 }
    ], 400, 420);

    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('LADY-TRISH RPG • OMEGATECH SYSTEMS', width / 2, height - 50);

    const buffer = canvas.toBuffer('image/png');
    await conn.sendMessage(m.chat, { image: buffer, caption: `*📦 ${conn.getName(m.sender)}'s Inventory*\nUse the items in the shop or for crafting.` }, { quoted: m });
};

handler.help = ['inventory'];
handler.tags = ['rpg'];
handler.command = /^(inv|inventory|kandang|tas)$/i;

export default handler;