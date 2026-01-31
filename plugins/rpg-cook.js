import { createCanvas } from 'canvas';

let handler = async (m, { conn, args, usedPrefix, command }) => {
    try {
        let user = global.db.data.users[m.sender];
        let type = (args[0] || '').toLowerCase();
        let count = args[1] ? Math.min(10, Math.max(1, parseInt(args[1]))) : 1;

        // --- 1. THE MENU CANVAS (Shown when no args are provided) ---
        if (!type) {
            const width = 900, height = 650;
            const canvas = createCanvas(width, height);
            const ctx = canvas.getContext('2d');

            // Background: Dark Slate / Charcoal
            ctx.fillStyle = '#0a0a0c';
            ctx.fillRect(0, 0, width, height);

            // Gold Border
            ctx.strokeStyle = '#d4af37';
            ctx.lineWidth = 10;
            ctx.strokeRect(20, 20, width - 40, height - 40);

            // Header
            ctx.fillStyle = '#d4af37';
            ctx.font = 'bold 50px serif';
            ctx.textAlign = 'center';
            ctx.fillText('CULINARY MENU', width / 2, 90);
            
            ctx.fillStyle = '#ffffff';
            ctx.font = 'italic 18px sans-serif';
            ctx.fillText('Requirement: 2 Raw Meat + 1 Coal per dish', width / 2, 125);

            // Menu Items Grid
            ctx.textAlign = 'left';
            ctx.font = 'bold 22px sans-serif';
            const drawCategory = (title, items, x, y) => {
                ctx.fillStyle = '#d4af37';
                ctx.fillText(title, x, y);
                ctx.fillStyle = '#ffffff';
                ctx.font = '18px monospace';
                items.forEach((item, i) => {
                    ctx.fillText(`• ${item}`, x, y + 35 + (i * 30));
                });
            };

            drawCategory('POULTRY (Chicken)', ['RoastChicken', 'FriedChicken', 'ChickenStew', 'SpicyChicken'], 80, 200);
            drawCategory('MEAT (Beef/Pork)', ['Steak', 'Rendang', 'RoastPork'], 80, 420);
            drawCategory('SEAFOOD (Fish/Crab)', ['GrilledFish', 'GrilledShrimp', 'GrilledWhale', 'GrilledCrab'], 480, 200);
            drawCategory('LOCAL (Exotic)', ['GrilledCatfish', 'GrilledTilapia', 'GrilledPomfret'], 480, 420);

            // Footer
            ctx.textAlign = 'center';
            ctx.font = 'bold 20px sans-serif';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillText(`Usage: ${usedPrefix + command} <dish> <amount>`, width / 2, 590);

            const buffer = canvas.toBuffer('image/png');
            return conn.sendMessage(m.chat, { image: buffer, caption: `*👨‍🍳 Welcome to the Lady-Trish Kitchen*\n\nPlease choose a dish from the menu above and provide the quantity.` }, { quoted: m });
        }

        // --- 2. COOKING LOGIC (Mapped to original DB keys) ---
        let ingredients = {
            // Chicken based
            'roastchicken': { key: 'ayambakar', raw: 'ayam' },
            'friedchicken': { key: 'ayamgoreng', raw: 'ayam' },
            'chickenstew': { key: 'oporayam', raw: 'ayam' },
            'spicychicken': { key: 'gulaiayam', raw: 'ayam' },
            // Beef / Pork based
            'steak': { key: 'steak', raw: 'sapi' },
            'rendang': { key: 'rendang', raw: 'sapi' },
            'roastpork': { key: 'babipanggang', raw: 'babi' },
            // Seafood / Local
            'grilledfish': { key: 'ikanbakar', raw: 'ikan' },
            'grilledshrimp': { key: 'udangbakar', raw: 'udang' },
            'grilledwhale': { key: 'pausbakar', raw: 'paus' },
            'grilledcrab': { key: 'kepitingbakar', raw: 'kepiting' },
            'grilledcatfish': { key: 'lelebakar', raw: 'lele' },
            'grilledtilapia': { key: 'nilabakar', raw: 'nila' },
            'grilledpomfret': { key: 'bawalbakar', raw: 'bawal' }
        };

        const recipe = ingredients[type];
        if (!recipe) return m.reply(`❌ *Unknown Dish:* "${type}" is not on the menu.`);

        const rawMaterial = recipe.raw;
        const resultKey = recipe.key;

        // Check Inventory
        if (user[rawMaterial] < count * 2 || user.coal < count) {
            return m.reply(`❗ *Missing Ingredients*\n\nTo cook *${count}x ${type}*, you need:\n• ${count * 2} ${rawMaterial}\n• ${count} coal`);
        }

        // Deduct & Add
        user[rawMaterial] -= count * 2;
        user.coal -= count;
        user[resultKey] = (user[resultKey] || 0) + count;

        await m.react('🍳');

        // Success UI (Mini Card)
        const sWidth = 600, sHeight = 250;
        const sCanvas = createCanvas(sWidth, sHeight);
        const sCtx = sCanvas.getContext('2d');

        sCtx.fillStyle = '#0f0f12';
        sCtx.fillRect(0, 0, sWidth, sHeight);
        sCtx.strokeStyle = '#00ff88';
        sCtx.lineWidth = 5;
        sCtx.strokeRect(10, 10, sWidth - 20, sHeight - 20);

        sCtx.fillStyle = '#00ff88';
        sCtx.font = 'bold 35px sans-serif';
        sCtx.textAlign = 'center';
        sCtx.fillText('COOKING SUCCESSFUL', sWidth / 2, 80);

        sCtx.fillStyle = '#ffffff';
        sCtx.font = '22px monospace';
        sCtx.fillText(`Dish Prepared: ${count}x ${type.toUpperCase()}`, sWidth / 2, 140);
        sCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        sCtx.font = '16px sans-serif';
        sCtx.fillText(`Consumed: ${count * 2} ${rawMaterial} & ${count} Coal`, sWidth / 2, 180);

        const sBuffer = sCanvas.toBuffer('image/png');
        await conn.sendMessage(m.chat, { image: sBuffer, caption: `✅ *Order Ready!* You successfully cooked *${count}x ${type}* 🍽️` }, { quoted: m });

    } catch (e) {
        console.error(e);
        m.reply('⚠️ Kitchen Error: The stove is broken!');
    }
};

handler.help = ['cook <dish> <amount>'];
handler.tags = ['rpg'];
handler.command = /^(masak|cook)$/i;
handler.group = true;

export default handler;