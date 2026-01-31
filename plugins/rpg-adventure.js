import { createCanvas, loadImage } from 'canvas';

let handler = async (m, { conn, usedPrefix, command }) => {
    try {
        const user = global.db.data.users[m.sender];
        const now = Date.now();
        const cooldown = 3600000; // 1 Hour
        const lastAdventure = user.lastadventure || 0;
        const diff = now - lastAdventure;

        // --- 1. HEALTH & COOLDOWN CHECKS ---
        if (user.health < 80) {
            return m.reply(`⚠️ *LOW HEALTH* ⚠️\n\nYou need at least *80 Health* to survive an adventure.\n\n❤️ Current Health: ${user.health}\n🧪 Use *${usedPrefix}heal* or buy potions with *${usedPrefix}buy potion* to recover.`);
        }

        if (diff < cooldown) {
            const timers = clockString(cooldown - diff);
            return m.reply(`🕒 *RESTING* 🕒\n\nYou are too exhausted to venture out. Please rest for:\n*${timers}*`);
        }

        // --- 2. ADVENTURE LOGIC (LOOT & DAMAGE) ---
        const healthLost = Math.floor(Math.random() * 61) + 20; // 20-80 damage
        const exp = Math.floor(Math.random() * 5000) + 1000;
        const money = Math.floor(Math.random() * 50000) + 5000;
        const trash = Math.floor(Math.random() * 1000);
        const emerald = Math.floor(Math.random() * 20);
        const diamond = Math.floor(Math.random() * 5);
        
        const potion = Math.random() > 0.7 ? Math.floor(Math.random() * 3) + 1 : 0;
        const common = Math.random() > 0.5 ? Math.floor(Math.random() * 2) + 1 : 0;
        const uncommon = Math.random() > 0.8 ? 1 : 0;
        const mythic = Math.random() > 0.95 ? 1 : 0;
        const legendary = Math.random() > 0.98 ? 1 : 0;

        const monster = pickRandom(['Ancient Giant', 'Grizzly Bear', 'Mountain Tiger', 'Shadow Demon', 'Orc Warlord']);

        // Update Database
        user.health -= healthLost;
        user.exp += exp;
        user.money += money;
        user.potion += potion;
        user.diamond += diamond;
        user.emerald += emerald;
        user.trash += trash;
        user.common += common;
        user.uncommon += uncommon;
        user.mythic += mythic;
        user.legendary += legendary;
        user.lastadventure = now;

        // --- 3. CANVAS DRAWING (Adventure Log) ---
        const width = 900, height = 550;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, width, height);

        // Header
        ctx.fillStyle = '#00d2ff';
        ctx.font = 'bold 50px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ADVENTURE LOG', width / 2, 70);

        // Monster Encounter Section
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.roundRect(50, 100, 800, 120, 20);
        ctx.fill();

        ctx.textAlign = 'left';
        ctx.fillStyle = '#ff4d4d';
        ctx.font = 'bold 25px sans-serif';
        ctx.fillText(`⚔️ BATTLE: ${monster.toUpperCase()}`, 80, 145);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px monospace';
        ctx.fillText(`Dmg Taken: -${healthLost} HP`, 80, 185);
        
        // Visual Health Bar
        ctx.fillStyle = '#333';
        ctx.fillRect(350, 168, 450, 20);
        ctx.fillStyle = '#ff4d4d';
        ctx.fillRect(350, 168, (user.health / 100) * 450, 20);

        // Loot Grid
        ctx.fillStyle = '#00ff88';
        ctx.font = 'bold 30px sans-serif';
        ctx.fillText('💰 LOOT ACQUIRED:', 50, 270);

        const lootX = 50, lootY = 320;
        ctx.font = '22px monospace';
        ctx.fillStyle = '#ffffff';
        
        ctx.fillText(`• Money   : +$${money.toLocaleString()}`, lootX, lootY);
        ctx.fillText(`• Exp     : +${exp} XP`, lootX, lootY + 40);
        ctx.fillText(`• Diamond : +${diamond}`, lootX, lootY + 80);
        ctx.fillText(`• Emerald : +${emerald}`, lootX, lootY + 120);

        ctx.fillText(`• Trash   : +${trash}`, lootX + 400, lootY);
        ctx.fillText(`• Potions : +${potion}`, lootX + 400, lootY + 40);
        ctx.fillText(`• Crates  : ${common + uncommon + mythic + legendary} Total`, lootX + 400, lootY + 80);
        
        if (mythic || legendary) {
            ctx.fillStyle = '#ffcc00';
            ctx.fillText(`🌟 RARE DROP DETECTED!`, lootX + 400, lootY + 120);
        }

        // Footer
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = '18px sans-serif';
        ctx.fillText('LADY-TRISH RPG ENGINE • POWERED BY OMEGATECH', width / 2, 510);

        // --- 4. SEND RESPONSE ---
        const buffer = canvas.toBuffer('image/png');
        
        let caption = `*⚔️ QUEST COMPLETED*
        
You ventured into the wild and encountered a *${monster}*. 
The battle was fierce, but you emerged victorious!

❤️ *Health:* -${healthLost} (Remaining: ${user.health})
💰 *Profit:* +$${money.toLocaleString()}
✨ *XP:* +${exp}

_Check your inventory to see your new crates and items!_`;

        await conn.sendMessage(m.chat, { image: buffer, caption: caption }, { quoted: m });

    } catch (e) {
        console.error(e);
        m.reply('⚠️ Adventure Error: The Quest Engine is currently offline.');
    }
};

handler.help = ['adventure'];
handler.tags = ['rpg'];
handler.command = /^(adventure|petualang)$/i;
handler.group = true;

export default handler;

function pickRandom(list) {
    return list[Math.floor(Math.random() * list.length)];
}

function clockString(ms) {
    let d = Math.floor(ms / 86400000);
    let h = Math.floor((ms % 86400000) / 3600000);
    let m = Math.floor((ms % 3600000) / 60000);
    let s = Math.floor((ms % 60000) / 1000);
    return `${d}d ${h}h ${m}m ${s}s`;
}