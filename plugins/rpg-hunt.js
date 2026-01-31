import { createCanvas } from 'canvas';

let handler = async (m, { conn, usedPrefix }) => {
    let monsters = [
        { area: 1, name: 'Goblin' }, { area: 1, name: 'Slime' }, { area: 1, name: 'Wolf' },
        { area: 2, name: 'Nymph' }, { area: 2, name: 'Skeleton' }, { area: 2, name: 'Wolf' },
        { area: 3, name: 'Baby Demon' }, { area: 3, name: 'Ghost' }, { area: 3, name: 'Zombie' },
        { area: 4, name: 'Imp' }, { area: 4, name: 'Witch' }, { area: 4, name: 'Zombie' },
        { area: 5, name: 'Ghoul' }, { area: 5, name: 'Giant Scorpion' }, { area: 5, name: 'Unicorn' },
        { area: 6, name: 'Baby Robot' }, { area: 6, name: 'Sorcerer' }, { area: 6, name: 'Unicorn' },
        { area: 7, name: 'Cecaelia' }, { area: 7, name: 'Giant Piranha' }, { area: 7, name: 'Mermaid' },
        { area: 8, name: 'Giant Crocodile' }, { area: 8, name: 'Nereid' }, { area: 8, name: 'Mermaid' },
        { area: 9, name: 'Demon' }, { area: 9, name: 'Harpy' }, { area: 9, name: 'Killer Robot' },
        { area: 10, name: 'Dullahan' }, { area: 10, name: 'Manticore' }, { area: 10, name: 'Killer Robot' },
        { area: 11, name: 'Baby Dragon' }, { area: 11, name: 'Young Dragon' }, { area: 11, name: 'Scaled Baby Dragon' }
    ];

    let player = global.db.data.users[m.sender];
    let cooldown = 1200000; // 20 Minutes
    let lastHunt = player.lasthunt || 0;
    let diff = Date.now() - lastHunt;

    // --- 1. COOLDOWN CHECK ---
    if (diff < cooldown) {
        return m.reply(`🕒 *RECOVERING* 🕒\n\nYou are too wounded to hunt. Please wait:\n*${clockString(cooldown - diff)}*`);
    }

    // --- 2. BATTLE LOGIC ---
    let target = monsters[Math.floor(Math.random() * monsters.length)];
    let damage = Math.floor(Math.random() * 100);
    let money = Math.floor(Math.random() * 100000);
    let exp = Math.floor(Math.random() * 10000);

    player.health -= damage;
    player.lasthunt = Date.now();

    const isDead = player.health <= 0;

    // --- 3. CANVAS DRAWING (Battle Report) ---
    const width = 850, height = 450;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = isDead ? '#1a0000' : '#020205';
    ctx.fillRect(0, 0, width, height);

    // Header
    ctx.fillStyle = isDead ? '#ff0000' : '#00d2ff';
    ctx.font = 'bold 50px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(isDead ? 'FATAL DEFEAT' : 'HUNT VICTORIOUS', width / 2, 70);

    // Monster Info Box
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.roundRect(50, 110, 750, 100, 15);
    ctx.fill();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(`TARGET: ${target.name.toUpperCase()}`, 80, 155);
    ctx.font = '20px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText(`AREA: ${target.area} | DAMAGE TAKEN: -${damage} HP`, 80, 185);

    // Outcome Section
    if (isDead) {
        ctx.fillStyle = '#ff4d4d';
        ctx.font = 'bold 35px sans-serif';
        ctx.fillText('ACCESS TERMINATED: PLAYER DIED', 80, 280);
        ctx.font = '20px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('Penalty: -1 Level, -5 Sword Durability', 80, 320);
    } else {
        ctx.fillStyle = '#00ff88';
        ctx.font = 'bold 30px sans-serif';
        ctx.fillText('REWARDS ACQUIRED:', 80, 270);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '22px monospace';
        ctx.fillText(`• Money  : +$${money.toLocaleString()}`, 80, 310);
        ctx.fillText(`• XP     : +${exp.toLocaleString()}`, 80, 345);
        ctx.fillText(`• Health : ${player.health} HP Remaining`, 80, 380);
    }

    // Footer
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = '18px sans-serif';
    ctx.fillText('LADY-TRISH HUNTER ENGINE • OMEGATECH SYSTEMS', width / 2, 430);

    // --- 4. DATA UPDATE & RESPONSE ---
    const buffer = canvas.toBuffer('image/png');
    let caption = '';

    if (isDead) {
        caption = `💀 *YOU WERE KILLED!* 💀\n\nThe *${target.name}* was too strong for you. You collapsed in battle.`;
        if (player.level > 0) {
            player.level -= 1;
            player.exp = Math.max(0, player.exp - exp);
            if (player.sword > 0) player.sword -= 5;
            caption += `\n\n*PENALTY:* Level -1, Sword Durability -5.`;
        }
        player.health = 100; // Respawn
    } else {
        player.money += money;
        player.exp += exp;
        player.tiketcoin = (player.tiketcoin || 0) + 1;
        
        caption = `⚔️ *MONSTER SLAIN!* ⚔️\n\nYou successfully tracked and defeated the *${target.name}* in Area ${target.area}.\n\n💰 +$${money.toLocaleString()} Money\n✨ +${exp.toLocaleString()} XP\n🎫 +1 Ticketcoin`;
    }

    await conn.sendMessage(m.chat, { image: buffer, caption: caption }, { quoted: m });
};

handler.help = ['hunter'];
handler.tags = ['game'];
handler.command = /^(hunter|hunt)$/i;
handler.group = true;

export default handler;

function clockString(ms) {
    let h = Math.floor(ms / 3600000);
    let m = Math.floor(ms / 60000) % 60;
    let s = Math.floor(ms / 1000) % 60;
    return `${h}h ${m}m ${s}s`;
}