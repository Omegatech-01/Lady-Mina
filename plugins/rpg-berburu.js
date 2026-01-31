import { createCanvas } from 'canvas';

let handler = async (m, { conn, usedPrefix }) => {
    const user = global.db.data.users[m.sender];
    const cooldown = 500000; // ~8 minutes
    const now = Date.now();
    const lastHunt = user.lastberburu || 0;
    const diff = now - lastHunt;

    // --- 1. COOLDOWN CHECK ---
    if (diff < cooldown) {
        return m.reply(`*⚠️ EXHAUSTED ⚠️*\n\nYou are too tired from the previous hunt. Please rest for: ${clockString(cooldown - diff)}`);
    }

    // --- 2. HUNTING LOGIC ---
    // Generate random catches for 12 animals (1-9 each)
    const catchList = Array.from({ length: 12 }, () => Math.floor(Math.random() * 9) + 1);
    
    // Animal Labels for the UI
    const animals = [
        { name: 'Bull', emoji: '🐂', key: 'banteng' },
        { name: 'Tiger', emoji: '🐅', key: 'harimau' },
        { name: 'Elephant', emoji: '🐘', key: 'gajah' },
        { name: 'Goat', emoji: '🐐', key: 'kambing' },
        { name: 'Panda', emoji: '🐼', key: 'panda' },
        { name: 'Crocodile', emoji: '🐊', key: 'buaya' },
        { name: 'Buffalo', emoji: '🐃', key: 'kerbau' },
        { name: 'Cow', emoji: '🐮', key: 'sapi' },
        { name: 'Monkey', emoji: '🐒', key: 'monyet' },
        { name: 'Boar', emoji: '🐗', key: 'babihutan' },
        { name: 'Pig', emoji: '🐖', key: 'babi' },
        { name: 'Chicken', emoji: '🐓', key: 'ayam' }
    ];

    // Update Database
    animals.forEach((animal, i) => {
        user[animal.key] = (user[animal.key] || 0) + catchList[i];
    });
    user.lastberburu = now;

    // --- 3. STORYTELLING UX (Delayed Messages) ---
    m.reply('🏹 *Entering the deep forest...*');
    
    setTimeout(() => {
        conn.reply(m.chat, '🌿 *Spotted movement in the bushes! Tracking the target...*', m);
    }, 4000);

    setTimeout(() => {
        conn.reply(m.chat, '🎯 *BOOM! Precision hit! You engaged the targets in a fierce battle...*', m);
    }, 8000);

    setTimeout(async () => {
        // --- 4. CANVAS DRAWING (Hunting Trophy Card) ---
        const width = 800, height = 600;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Background: Dark Forest Green Gradient
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#0a1a0a');
        grad.addColorStop(1, '#020502');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Header
        ctx.fillStyle = '#00ff88';
        ctx.font = 'bold 50px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('HUNTING TROPHY', width / 2, 80);

        // Draw Grid
        const cols = 3;
        const rows = 4;
        const padding = 40;
        const cellW = (width - (padding * 2)) / cols;
        const cellH = (height - 200) / rows;

        ctx.textAlign = 'center';
        ctx.font = '22px monospace';

        animals.forEach((animal, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = padding + (col * cellW) + (cellW / 2);
            const y = 160 + (row * cellH);

            // Item Box
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.beginPath();
            ctx.roundRect(x - 100, y - 40, 200, 80, 10);
            ctx.fill();

            // Text
            ctx.fillStyle = '#ffffff';
            ctx.font = '35px serif';
            ctx.fillText(animal.emoji, x - 60, y + 12);
            
            ctx.font = 'bold 25px sans-serif';
            ctx.fillStyle = '#00ff88';
            ctx.fillText(`x${catchList[i]}`, x + 40, y + 12);
            
            ctx.font = '14px sans-serif';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fillText(animal.name.toUpperCase(), x, y + 55);
        });

        // Footer
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = '18px sans-serif';
        ctx.fillText('LADY-TRISH RPG • OMEGATECH SYSTEMS', width / 2, height - 30);

        const buffer = canvas.toBuffer('image/png');
        
        let caption = `*🏆 HUNTING RESULTS*
        
You successfully tracked and captured several animals. Your warehouse has been updated.

🐾 *Total Captured:* ${catchList.reduce((a, b) => a + b, 0)} Animals
📖 *Note:* Type *${usedPrefix}inventory* to see your full collection.`;

        await conn.sendMessage(m.chat, { image: buffer, caption: caption }, { quoted: m });

    }, 12000); // Reduced total time from 20s to 12s for better UX
};

handler.help = ['hunt'];
handler.tags = ['rpg'];
handler.command = /^(berburu|hunt)$/i;
handler.group = true;

export default handler;

function clockString(ms) {
    let d = Math.floor(ms / 86400000);
    let h = Math.floor((ms % 86400000) / 3600000);
    let m = Math.floor((ms % 3600000) / 60000);
    let s = Math.floor((ms % 60000) / 1000);
    return `${d}d ${h}h ${m}m ${s}s`;
}