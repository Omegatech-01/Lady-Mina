import { createCanvas, loadImage } from 'canvas';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { randomBytes } from 'crypto';

const execute = promisify(exec);

let handler = async (m, { conn, usedPrefix, command }) => {
    const q = m.quoted ? m.quoted : m;
    const mime = (q.msg || q).mimetype || '';

    if (!/image/.test(mime)) return m.reply(`*⚠️ Input Required:* Reply to a photo to simulate the 3D paper tear.`);

    const sessionId = randomBytes(3).toString('hex');
    const tmpDir = path.join(process.cwd(), 'tmp', `paper_${sessionId}`);
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    await m.react('📄');
    await m.reply('✨ *OmegaTech Physics Engine:* Simulating 3D paper-fold and fluid dynamics... (4.5s Render)');

    try {
        const imgBuffer = await q.download();
        const img = await loadImage(imgBuffer);

        const width = 600; 
        const height = Math.floor((img.height / img.width) * width);
        const fps = 30;
        const totalFrames = fps * 4.5; 

        const canvas = createCanvas(width, height + 200); // Extra height for falling
        const ctx = canvas.getContext('2d');

        // Create the Jagged "Tear Line"
        const jagged = [];
        const segments = 50;
        for (let i = 0; i <= segments; i++) {
            jagged.push((width / 2) + (Math.random() * 10 - 5));
        }

        for (let i = 0; i < totalFrames; i++) {
            const progress = i / totalFrames;
            
            // 1. Render Background (High-End Ocean)
            const bgGrad = ctx.createLinearGradient(0, 0, 0, height + 200);
            bgGrad.addColorStop(0, '#4facfe'); // Tropical Cyan
            bgGrad.addColorStop(1, '#00f2fe'); // Bright Azure
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, width, height + 200);

            // Animated Sun Caustics (Light ripples on water)
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            for (let j = 0; j < 10; j++) {
                const wy = (j * 100) + (progress * 50);
                ctx.beginPath();
                ctx.moveTo(0, wy % (height + 200));
                ctx.bezierCurveTo(width/2, (wy - 50) % (height + 200), width/2, (wy + 50) % (height + 200), width, wy % (height + 200));
                ctx.stroke();
            }

            // 2. Physics Constants
            const ripY = progress * height * 1.5; // Rip travels down
            const gravity = Math.pow(Math.max(0, progress - 0.4), 2) * 400;

            // Function to draw a 3D-Bending Half
            const drawHalf = (side) => {
                ctx.save();
                
                // Movement: Top pulls away more than bottom
                const baseShift = Math.pow(progress, 2) * 150;
                const direction = side === 'left' ? -1 : 1;
                
                ctx.translate((width / 2) + (baseShift * direction), (height / 2) + gravity);
                
                // Shadow on water
                ctx.shadowColor = 'rgba(0,0,0,0.2)';
                ctx.shadowBlur = 20;
                ctx.shadowOffsetX = 10;
                ctx.shadowOffsetY = 20;

                // Clipping Path (The Shape of the Torn Half)
                ctx.beginPath();
                if (side === 'left') {
                    ctx.moveTo(-width / 2, -height / 2);
                    for (let s = 0; s <= segments; s++) {
                        const yPos = (height / segments) * s;
                        const xPos = jagged[s];
                        // If rip hasn't reached this Y, keep it at center
                        const actualX = yPos > ripY ? (width / 2) : xPos;
                        ctx.lineTo(actualX - (width / 2), yPos - (height / 2));
                    }
                    ctx.lineTo(-width / 2, height / 2);
                } else {
                    ctx.moveTo(width / 2, -height / 2);
                    for (let s = 0; s <= segments; s++) {
                        const yPos = (height / segments) * s;
                        const xPos = jagged[s];
                        const actualX = yPos > ripY ? (width / 2) : xPos;
                        ctx.lineTo(actualX - (width / 2), yPos - (height / 2));
                    }
                    ctx.lineTo(width / 2, height / 2);
                }
                ctx.closePath();
                ctx.clip();

                // 3D Bending: Apply horizontal skew based on Y (Top bends more)
                const bendAngle = progress * 0.2 * direction;
                ctx.rotate(bendAngle * (1 - (ripY / height))); 

                ctx.drawImage(img, 0, 0, img.width, img.height, -width / 2, -height / 2, width, height);

                // Add fiber/torn edge highlight
                ctx.globalAlpha = 0.5;
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 3;
                ctx.stroke();
                
                ctx.restore();
            };

            drawHalf('left');
            drawHalf('right');

            // 3. Write Frame
            const framePath = path.join(tmpDir, `frame_${i.toString().padStart(3, '0')}.png`);
            fs.writeFileSync(framePath, canvas.toBuffer('image/png'));
        }

        // 4. Compile with high-quality settings
        const outputVideo = path.join(process.cwd(), 'tmp', `3d_tear_${sessionId}.mp4`);
        const ffmpegCmd = `ffmpeg -y -framerate ${fps} -i "${tmpDir}/frame_%03d.png" -c:v libx264 -pix_fmt yuv420p -b:v 2M -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" "${outputVideo}"`;
        await execute(ffmpegCmd);

        // 5. Final Delivery
        await conn.sendMessage(m.chat, { 
            video: fs.readFileSync(outputVideo), 
            caption: `*📄 3D PAPER SEPARATION COMPLETE*\n\n_The memory has been physically folded and discarded into the ocean of time._\n\n✨ *OmegaTech Physics v4.0*`,
            mimetype: 'video/mp4'
        }, { quoted: m });

        // Cleanup
        fs.unlinkSync(outputVideo);
        fs.rmSync(tmpDir, { recursive: true, force: true });

    } catch (e) {
        console.error(e);
        m.reply('❌ *System Error:* 3D Paper simulation failed. Check server RAM.');
        if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
    }
};

handler.help = ['tear'];
handler.tags = ['tools'];
handler.command = /^(tear|rip|breakup)$/i;

export default handler;