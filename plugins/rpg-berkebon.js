import { createCanvas, loadImage } from 'canvas';

const timeout = 1800000; // 30 minutes

let handler = async (m, { usedPrefix, conn, command }) => {
    const user = global.db.data.users[m.sender];
    const { bibitapel, bibitanggur, bibitmangga, bibitpisang, bibitjeruk } = user;

    // 1. SEED REQUIREMENT CHECK
    const seeds = [
        { name: 'Apple Seeds', count: bibitapel || 0 },
        { name: 'Grape Seeds', count: bibitanggur || 0 },
        { name: 'Mango Seeds', count: bibitmangga || 0 },
        { name: 'Banana Seeds', count: bibitpisang || 0 },
        { name: 'Orange Seeds', count: bibitjeruk || 0 }
    ];

    const missingSeeds = seeds.filter(s => s.count < 500);

    if (missingSeeds.length > 0) {
        return m.reply(`*⚠️ INSUFFICIENT SEEDS* ⚠️\n\nYou need at least *500* of each seed type to start harvesting.\n\n*Required:* \n${seeds.map(s => `• ${s.name}: ${s.count}/500`).join('\n')}\n\n_Buy more in the ${usedPrefix}shop_`);
    }

    // 2. COOLDOWN CHECK
    const now = Date.now();
    const lastHarvest = user.lastberkebon || 0;
    const diff = lastHarvest + timeout;

    if (now < diff) {
        return m.reply(`🕒 *GREENHOUSE COOLING* 🕒\n\nYour plants are still growing. Please wait:\n*${msToTime(diff - now)}*`);
    }

    // 3. HARVEST LOGIC
    const [pisangP, anggurP, manggaP, jerukP, apelP] = Array.from({ length: 5 }, () => Math.floor(Math.random() * 500));

    // Update Fruits
    user.pisang = (user.pisang || 0) + pisangP;
    user.anggur = (user.anggur || 0) + anggurP;
    user.mangga = (user.mangga || 0) + manggaP;
    user.jeruk = (user.jeruk || 0) + jerukP;
    user.apel = (user.apel || 0) + apelP;

    // Deduct Seeds
    user.bibitapel -= 500;
    user.bibitanggur -= 500;
    user.bibitmangga -= 500;
    user.bibitpisang -= 500;
    user.bibitjeruk -= 500;

    user.tiketcoin = (user.tiketcoin || 0) + 1;
    user.lastberkebon = now;

    await m.react('🌱');

    // 4. --- CANVAS DRAWING (Harvest Dashboard) ---
    const width = 850, height = 500;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background: Deep Nature Green
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#0a2e0a');
    grad.addColorStop(1, '#020d02');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Header
    ctx.fillStyle = '#00ff88';
    ctx.font = 'bold 50px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HARVEST REPORT', width / 2, 80);

    // Draw Stats Boxes
    const drawFruit = (name, count, emoji, x, y) => {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.beginPath();
        ctx.roundRect(x, y, 220, 100, 15);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 255, 136, 0.2)';
        ctx.stroke();

        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffffff';
        ctx.font = '40px serif';
        ctx.fillText(emoji, x + 20, y + 65);
        
        ctx.font = 'bold 28px sans-serif';
        ctx.fillStyle = '#00ff88';
        ctx.fillText(`+${count}`, x + 85, y + 55);
        
        ctx.font = '14px sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillText(name.toUpperCase(), x + 85, y + 80);
    };

    // Grid Positions
    drawFruit('Apples', apelP, '🍎', 80, 150);
    drawFruit('Mangos', manggaP, '🥭', 315, 150);
    drawFruit('Grapes', anggurP, '🍇', 550, 150);
    drawFruit('Bananas', pisangP, '🍌', 200, 270);
    drawFruit('Oranges', jerukP, '🍊', 435, 270);

    // Bonus Section
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('🎫 BONUS RECEIVED: 1 TICKET COIN', width / 2, 420);

    // Footer
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = '18px sans-serif';
    ctx.fillText('LADY-TRISH FARMING • OMEGATECH SYSTEMS', width / 2, height - 30);

    // 5. SEND RESPONSE
    const buffer = canvas.toBuffer('image/png');
    
    let caption = `*👨‍🌾 HARVEST SUCCESSFUL!*

Congratulations *${conn.getName(m.sender)}*! You have successfully harvested your greenhouse.

🍎 Apples: +${apelP}
🥭 Mangos: +${manggaP}
🍇 Grapes: +${anggurP}
🍌 Bananas: +${pisangP}
🍊 Oranges: +${jerukP}

🎫 Ticket Coin: +1

_Use *${usedPrefix}inventory* to see your current stock._`;

    await conn.sendMessage(m.chat, { image: buffer, caption: caption }, { quoted: m });

    // 6. READY ALERT
    setTimeout(() => {
        conn.reply(m.chat, `🌱 *Greenhouse Alert:* The plants have matured! Time to harvest again!`, m);
    }, timeout);
};

handler.help = ['harvest'];
handler.tags = ['rpg'];
handler.command = /^(berkebun|harvest|farm)$/i;
handler.group = true;

export default handler;

function msToTime(ms) {
    let s = Math.floor((ms / 1000) % 60);
    let m = Math.floor((ms / (1000 * 60)) % 60);
    let h = Math.floor((ms / (1000 * 60 * 60)) % 24);
    return `${h}h ${m}m ${s}s`;
}