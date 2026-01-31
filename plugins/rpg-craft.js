import { createCanvas } from 'canvas';

let handler = async (m, { conn, args, usedPrefix, command }) => {
    let user = global.db.data.users[m.sender];
    let type = (args[0] || '').toLowerCase();

    // --- 1. THE CRAFTING BLUEPRINT CANVAS ---
    if (!type) {
        const width = 900, height = 700;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Background: Industrial Dark
        ctx.fillStyle = '#0a0a10';
        ctx.fillRect(0, 0, width, height);

        // Cyber Grid
        ctx.strokeStyle = 'rgba(0, 210, 255, 0.05)';
        for(let i=0; i<width; i+=40) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,height); ctx.stroke(); }
        for(let i=0; i<height; i+=40) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(width,i); ctx.stroke(); }

        // Header
        ctx.fillStyle = '#00d2ff';
        ctx.font = 'bold 50px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('FORGE BLUEPRINTS', width / 2, 80);

        // User Inventory Snippet (Top Right)
        ctx.textAlign = 'right';
        ctx.font = '16px monospace';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillText(`WOOD: ${user.wood || 0} | IRON: ${user.iron || 0} | ROCK: ${user.rock || 0}`, 850, 40);
        ctx.fillText(`STRING: ${user.string || 0} | DIAMOND: ${user.diamond || 0} | EMERALD: ${user.emerald || 0}`, 850, 65);

        // Draw Blueprint Cards
        const drawRecipe = (name, reqs, x, y) => {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.beginPath();
            ctx.roundRect(x, y, 380, 140, 15);
            ctx.fill();
            ctx.strokeStyle = '#00d2ff';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.textAlign = 'left';
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 24px sans-serif';
            ctx.fillText(name.toUpperCase(), x + 20, y + 40);

            ctx.font = '16px monospace';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            reqs.forEach((req, i) => {
                ctx.fillText(`- ${req}`, x + 25, y + 70 + (i * 22));
            });
        };

        // Recipes Data
        drawRecipe('Pickaxe', ['10 Wood', '5 Rock', '5 Iron', '20 String'], 50, 150);
        drawRecipe('Sword', ['10 Wood', '15 Iron'], 470, 150);
        drawRecipe('Axe', ['5 Wood', '10 Iron'], 50, 310);
        drawRecipe('Fishing Rod', ['10 Wood', '2 Iron', '20 String'], 470, 310);
        drawRecipe('Armor', ['30 Iron', '1 Emerald', '5 Diamond'], 50, 470);
        drawRecipe('ATM Card', ['3 Emerald', '6 Diamond', '10k Money'], 470, 470);

        // Footer
        ctx.textAlign = 'center';
        ctx.fillStyle = '#00d2ff';
        ctx.font = 'italic 20px sans-serif';
        ctx.fillText(`Command: ${usedPrefix + command} <item>`, width / 2, 660);

        const buffer = canvas.toBuffer('image/png');
        return conn.sendMessage(m.chat, { image: buffer, caption: `*⚒️ LADY-TRISH FORGE*\nReady to craft? Make sure you have the required materials listed above.` }, { quoted: m });
    }

    // --- 2. CRAFTING LOGIC (Translated to English) ---
    try {
        await m.react('⚒️');
        switch (type) {
            case 'pickaxe':
                if (user.pickaxe > 0) throw 'You already own a Pickaxe!';
                if (user.wood < 10 || user.rock < 5 || user.iron < 5 || user.string < 20) 
                    throw 'Insufficient materials!\nRequired: 10 Wood, 5 Rock, 5 Iron, 20 String';

                user.wood -= 10;
                user.rock -= 5;
                user.iron -= 5;
                user.string -= 20;
                user.pickaxe = 1;
                user.pickaxedurability = 40;
                m.reply('✅ *Success:* You forged a sturdy Pickaxe!');
                break;

            case 'sword':
                if (user.sword > 0) throw 'You already own a Sword!';
                if (user.wood < 10 || user.iron < 15) 
                    throw 'Insufficient materials!\nRequired: 10 Wood, 15 Iron';

                user.wood -= 10;
                user.iron -= 15;
                user.sword = 1;
                user.sworddurability = 40;
                m.reply('✅ *Success:* You forged a deadly Sword!');
                break;

            case 'axe':
                if (user.axe > 0) throw 'You already own an Axe!';
                if (user.wood < 5 || user.iron < 10) 
                    throw 'Insufficient materials!\nRequired: 5 Wood, 10 Iron';

                user.wood -= 5;
                user.iron -= 10;
                user.axe = 1;
                user.axedurability = 40;
                m.reply('✅ *Success:* You forged a sharp Axe!');
                break;

            case 'fishingrod':
            case 'rod':
                if (user.fishingrod > 0) throw 'You already own a Fishing Rod!';
                if (user.wood < 10 || user.iron < 2 || user.string < 20) 
                    throw 'Insufficient materials!\nRequired: 10 Wood, 2 Iron, 20 String';

                user.wood -= 10;
                user.iron -= 2;
                user.string -= 20;
                user.fishingrod = 1;
                user.fishingroddurability = 40;
                m.reply('✅ *Success:* You crafted a professional Fishing Rod!');
                break;

            case 'armor':
                if (user.armor > 0) throw 'You already own Armor!';
                if (user.iron < 30 || user.emerald < 1 || user.diamond < 5) 
                    throw 'Insufficient materials!\nRequired: 30 Iron, 1 Emerald, 5 Diamond';

                user.iron -= 30;
                user.emerald -= 1;
                user.diamond -= 5;
                user.armor = 1;
                user.armordurability = 50;
                m.reply('✅ *Success:* You forged a set of Knight Armor!');
                break;

            case 'atm':
                if (user.atm > 0) throw 'You already own an ATM Card!';
                if (user.emerald < 3 || user.diamond < 6 || user.money < 10000) 
                    throw 'Insufficient materials!\nRequired: 3 Emerald, 6 Diamond, $10,000 Cash';

                user.emerald -= 3;
                user.diamond -= 6;
                user.money -= 10000;
                user.atm = 1;
                user.fullatm = 5000000;
                m.reply('✅ *Success:* You registered a high-tier ATM Card!');
                break;

            default:
                m.reply(`⚠️ *Unknown Item:* That item cannot be crafted. Use *${usedPrefix}craft* to see blueprints.`);
        }
    } catch (e) {
        m.reply(typeof e === 'string' ? `❌ ${e}` : '⚠️ Crafting failed.');
    }
};

handler.help = ['craft <item>'];
handler.tags = ['rpg'];
handler.command = /^(craft)$/i;

export default handler;