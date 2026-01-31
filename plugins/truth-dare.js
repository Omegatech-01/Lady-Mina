import { createCanvas } from 'canvas';

// --- THE MASSIVE DATABASE ---
const DATABASE = {
    truth: [
        // EMOTIONAL & DEEP
        "What is the biggest lie you've told your parents?", "Who is the 'one that got away' for you?",
        "What is your biggest fear about the future?", "Have you ever cried yourself to sleep recently?",
        "What is the most expensive mistake you've ever made?", "If you could erase one memory, what would it be?",
        "What is the most mean thing you've ever thought about a friend?", "Have you ever faked a smile to hide your pain?",
        // GROUP DRAMA
        "Who in this group chat do you trust the least?", "If the world was ending, which person here would you save first?",
        "Who is the most annoying person in this group?", "Have you ever screenshotted a message from this chat to gossip?",
        "Which person here has the best style?", "If you had to block one person here forever, who would it be?",
        "Who do you think is the 'fake' person in this group?", "Have you ever muted this chat because of one specific person?",
        // CRUSHES & ROMANCE
        "Who was your first crush?", "Have you ever cheated on a partner?",
        "What is your 'ick' when it comes to dating?", "Have you ever been rejected by someone you really liked?",
        "What is the most romantic thing someone has done for you?", "Have you ever stalked an ex on social media?",
        "If you had to marry a celebrity, who would it be?", "What is the longest you’ve gone without a crush?",
        // EMBARRASSING & WEIRD
        "What is the most embarrassing thing in your room right now?", "Have you ever walked into a glass door?",
        "What is the weirdest dream you've ever had?", "Have you ever been caught talking to yourself?",
        "What is the longest you've gone without showering?", "Have you ever accidentally sent a text about someone to that person?",
        "What’s the most childish thing you still do?", "Have you ever peed in a public pool?",
        "What is your most useless talent?", "What is the weirdest thing you've ever eaten?",
        "Have you ever lied about your age?", "What’s the most embarrassing song on your playlist?",
        "Have you ever tripped in public and pretended it didn't happen?", "What is your secret obsession?",
        "Have you ever talked to an animal like it was a human?", "What is the most cringy thing you did 5 years ago?",
        "Have you ever ghosted someone because they were 'too nice'?", "What's the last thing you searched on your browser?",
        "Have you ever pretended to be busy to avoid someone here?", "What's the most illegal thing you've done?",
        "What's a secret you've never told anyone here?", "Have you ever lied to get a discount?",
        "If you could be the opposite gender for a day, what's the first thing you'd do?", "What's the most trouble you've been in with the police?"
    ],
    dare: [
        // SOCIAL CHALLENGES
        "Text your crush 'I have a crush on your best friend' and send proof.", "Change your status to 'I am a loser' for 30 minutes.",
        "Voice note yourself singing the 'National Anthem' in a funny voice.", "Send a screenshot of your most recent search history.",
        "Post 'I'm getting married tomorrow' on your status.", "Text your mom 'I'm pregnant/I got someone pregnant' and show the reply.",
        "Call a random contact and try to sell them a 'magic rock'.", "Send the 10th photo in your gallery without context.",
        "Write 'LADY-TRISH IS QUEEN' on your hand and send a photo.", "Change your profile picture to a potato for 1 hour.",
        // ACTION & PHYSICAL
        "Do 20 pushups and send a video of the last 5.", "Eat a spoonful of hot sauce or mustard.",
        "Hold a mouthful of water and listen to a joke without spitting.", "Try to lick your elbow and send a video attempt.",
        "Do a freestyle rap about Omegatech for 30 seconds.", "Wear your shirt backward for the rest of the game.",
        "Spin around 10 times and try to walk in a straight line on video.", "Put an ice cube down your pants and keep it there for 1 min.",
        // WEIRD & FUNNY
        "Bark like a dog every time you reply to someone for 10 mins.", "Talk in a British accent for the next 3 voice notes.",
        "Send a video of you doing a 'silly walk'.", "Let the group choose a message for you to send to your ex.",
        "Smell your shoes and describe the scent in detail.", "Record yourself whispering a secret to a plant.",
        "Try to juggle 3 random items and send the result.", "Draw a face on your stomach and make it 'talk' on video.",
        "Send a voice note of you trying to beatbox badly.", "Text your best friend 'I never liked you' and then say 'JK' after 2 mins.",
        "Do a 30-second runway walk and send it.", "Wear a hat made of aluminum foil for 15 minutes.",
        "Send a message to a random group saying 'I know what you did'.", "Make a sandwich using only ingredients the group chooses.",
        "Say 'Omegatech is the tech god' in a voice note 10 times fast.", "Send a picture of your fridge right now.",
        "Go outside and yell 'I LOVE LADY-TRISH' (send voice note).", "Mimic a monkey for 20 seconds on video.",
        "Balance a spoon on your nose for 30 seconds.", "Send the most cringy sticker you have.",
        "Write 'I am a clown' on your status with a selfie.", "Do 50 jumping jacks and send a voice note of you panting."
    ]
};

let handler = async (m, { conn, usedPrefix, command }) => {
    const type = command.toLowerCase().includes('truth') ? 'truth' : 'dare';
    const levels = ['SOFT', 'HARD', 'EXTREME'];
    const level = levels[Math.floor(Math.random() * levels.length)];
    
    const theme = {
        truth: { color: '#00D2FF', label: 'TRUTH', bg: '#000814' },
        dare: { color: '#FF0055', label: 'DARE', bg: '#1a0005' }
    }[type];
    
    const content = DATABASE[type][Math.floor(Math.random() * DATABASE[type].length)];
    const target = m.mentionedJid[0] ? m.mentionedJid[0] : m.sender;

    // --- CANVAS ENGINE ---
    const canvas = createCanvas(800, 500);
    const ctx = canvas.getContext('2d');

    // Background & Glow
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, 800, 500);

    // Dynamic Gradient Border
    const grad = ctx.createLinearGradient(0,0, 800, 500);
    grad.addColorStop(0, theme.color);
    grad.addColorStop(1, '#ffffff');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 10;
    ctx.strokeRect(25, 25, 750, 450);

    // Level Tag
    ctx.fillStyle = theme.color;
    ctx.font = 'bold 20px Arial';
    ctx.fillText(`LEVEL: ${level}`, 60, 70);

    // Branding
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillText('LADY-TRISH PRO | OMEGATECH', 740, 70);

    // Main Label
    ctx.textAlign = 'center';
    ctx.font = 'bold 90px sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowBlur = 20;
    ctx.shadowColor = theme.color;
    ctx.fillText(theme.label, 400, 180);
    ctx.shadowBlur = 0;

    // Content
    ctx.font = '34px sans-serif';
    ctx.fillStyle = '#E0E0E0';
    wrapText(ctx, `"${content}"`, 400, 280, 650, 45);

    // Target
    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = theme.color;
    const name = `@${target.split('@')[0]}`;
    ctx.fillText(`CHALLENGER: ${name.toUpperCase()}`, 400, 440);

    const buffer = canvas.toBuffer();

    await conn.sendMessage(m.chat, { 
        image: buffer, 
        caption: `🎭 *LADY-TRISH: ${theme.label}* [${level}]\n\n` +
                  `👤 *Player:* ${name}\n` +
                  `🔥 *Challenge:* ${content}\n\n` +
                  `_Powered by Omegatech_`, 
        mentions: [target] 
    }, { quoted: m });
};

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        if (ctx.measureText(testLine).width > maxWidth && n > 0) {
            ctx.fillText(line, x, y);
            line = words[n] + ' ';
            y += lineHeight;
        } else { line = testLine; }
    }
    ctx.fillText(line, x, y);
}

handler.help = ['truth', 'dare'];
handler.tags = ['game'];
handler.command = /^(truth|dare)$/i;

export default handler;