import { createCanvas, loadImage } from 'canvas';

let handler = async (m, { conn, args, participants, usedPrefix, command }) => {
    let users = Object.entries(global.db.data.users).map(([key, value]) => {
        return { ...value, jid: key };
    });

    let sortedExp = users.map(toNumber('exp')).sort(sort('exp'));
    let sortedMoney = users.map(toNumber('money')).sort(sort('money'));
    let sortedLevel = users.map(toNumber('level')).sort(sort('level'));

    let usersExp = sortedExp.map(v => v.jid);
    let topTen = sortedExp.slice(0, 10);

    await m.react('🏆');

    const width = 900, height = 800;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, width, height);

    // Header
    ctx.fillStyle = '#00d2ff';
    ctx.font = 'bold 50px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GLOBAL RANKINGS', width / 2, 80);

    let yPos = 180;
    for (let i = 0; i < topTen.length; i++) {
        const user = topTen[i];
        const isMe = user.jid === m.sender;
        const name = (conn.getName(user.jid) || 'Citizen').slice(0, 20);

        ctx.fillStyle = isMe ? 'rgba(0, 210, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)';
        ctx.beginPath();
        ctx.roundRect(50, yPos, width - 100, 50, 10);
        ctx.fill();

        ctx.textAlign = 'left';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillStyle = i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : '#ffffff';
        ctx.fillText(`${i + 1}.`, 80, yPos + 33);

        ctx.fillStyle = '#ffffff';
        ctx.fillText(name.toUpperCase(), 140, yPos + 33);

        ctx.textAlign = 'right';
        ctx.fillStyle = '#00d2ff';
        ctx.fillText(`${user.exp.toLocaleString()} XP`, 820, yPos + 33);
        yPos += 58;
    }

    const myRank = usersExp.indexOf(m.sender) + 1;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 25px sans-serif';
    ctx.fillText(`YOUR RANK: #${myRank} OUT OF ${usersExp.length}`, width / 2, height - 55);

    const buffer = canvas.toBuffer('image/png');
    
    let text = `*🏆 LADY-TRISH RANKINGS*\n\n` +
               `📊 *Power:* ${sortedExp.slice(0, 5).map((v, i) => `\n${i+1}. ${conn.getName(v.jid)} - ${v.exp} XP`).join('')}\n\n` +
               `💰 *Wealth:* ${sortedMoney.slice(0, 5).map((v, i) => `\n${i+1}. ${conn.getName(v.jid)} - $${v.money}`).join('')}\n\n` +
               `_Check ${usedPrefix}profile for your stats._`;

    await conn.sendMessage(m.chat, { image: buffer, caption: text }, { quoted: m });
};

handler.help = ['leaderboard'];
handler.tags = ['rpg'];
handler.command = /^(leaderboard|lb)$/i;
handler.group = true;

export default handler;

function sort(property, ascending = true) {
    if (property) return (...args) => args[ascending & 1][property] - args[!ascending & 1][property];
    else return (...args) => args[ascending & 1] - args[!ascending & 1];
}
function toNumber(property, _default = 0) {
    if (property) return (a, i, b) => { return { ...b[i], [property]: a[property] === undefined ? _default : a[property] }; };
    else return (a) => (a === undefined ? _default : a);
}