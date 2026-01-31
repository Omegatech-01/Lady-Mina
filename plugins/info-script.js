let handler = async (m) => {
    try {
        const raw = await fetch('https://api.github.com/repos/Omegatech-01/Lady-trish');
        if (!raw.ok) return m.reply('Failed to fetch repository info');
        const res = await raw.json();

        m.reply(`*Script Information*\n
✨ *Name:* ${res.name}
👤 *Owner:* ${res.owner.login ?? '-'}
⭐ *Stars:* ${res.stargazers_count ?? 0}
🍴 *Forks:* ${res.forks ?? 0}
📅 *Created on:* ${toTime(res.created_at)}
♻️ *Last updated:* ${toTime(res.updated_at)}
🚀 *Last pushed:* ${toTime(res.pushed_at)}
🔗 *Link:* ${res.html_url}
`);
    } catch (err) {
        console.error(err);
        return m.reply('Please try again later.');
    }
};

handler.help = ['script'];
handler.tags = ['info'];
handler.command = ['sc', 'script', 'repo'];

export default handler;

function toTime(time) {
    const ts = new Date(time).getTime();
    const now = Date.now();
    const diff = Math.floor((now - ts) / 1000);

    const m = Math.floor(diff / 60);
    const h = Math.floor(diff / 3600);
    const d = Math.floor(diff / 86400);
    const mn = Math.floor(diff / 2592000);
    const y = Math.floor(diff / 31536000);

    if (diff < 60) return `\( {diff} second \){diff !== 1 ? 's' : ''} ago`;
    if (m < 60) return `\( {m} minute \){m !== 1 ? 's' : ''} ago`;
    if (h < 24) return `\( {h} hour \){h !== 1 ? 's' : ''} ago`;
    if (d < 30) return `\( {d} day \){d !== 1 ? 's' : ''} ago`;
    if (mn < 12) return `\( {mn} month \){mn !== 1 ? 's' : ''} ago`;
    return `\( {y} year \){y !== 1 ? 's' : ''} ago`;
}