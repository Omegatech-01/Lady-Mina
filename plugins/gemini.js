const { execSync } = require('child_process');
const fs = require('fs');

const config = {
    imageURL: "", // La URL de la imágen
    localFile: "input.jpeg",
    templateID: "", // El ID de la plantilla, Ej: 0169f492-a75e-4bb1-9a65-6e69ebb3cfd3
    cookie: "_ga=GA1.1.443276906.1768409554; _ga_0SLPB0CK4W=GS2.1.s1768409554$o1$g1$t1768412421$j60$l0$h0"
};

const commonHeaders = [
    ['authority', 'viggle.ai'],
    ['accept', 'application/json, text/plain, */*'],
    ['accept-language', 'es-US,es;q=0.9,en-US;q=0.8'],
    ['origin', 'https://viggle.ai'],
    ['referer', 'https://viggle.ai/meme'],
    ['sec-ch-ua', '"Not/A)Brand";v="8", "Chromium";v="126", "Android WebView";v="126"'],
    ['sec-ch-ua-mobile', '?1'],
    ['sec-ch-ua-platform', '"Android"'],
    ['sec-fetch-dest', 'empty'],
    ['sec-fetch-mode', 'cors'],
    ['sec-fetch-site', 'same-origin'],
    ['user-agent', 'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro Build/UQ1A.231205.015; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/126.0.6478.122 Mobile Safari/537.36'],
    ['x-requested-with', 'mark.via.gp'],
    ['cookie', config.cookie]
];

function runCurl(url, method, isMultipart = false, data = null) {
    let headerStr = commonHeaders.map(h => `-H '${h[0]}: ${h[1]}'`).join(' ');
    let command = `curl -s -X ${method} "${url}" ${headerStr}`;

    if (method === 'POST' && data) {
        if (isMultipart) {
            for (const key in data) {
                if (key === 'file') {
                    command += ` -F "${key}=@${data[key]};type=image/jpeg"`;
                } else {
                    command += ` -F "${key}=${data[key]}"`;
                }
            }
        } else {
            command += ` -H 'content-type: application/json' -d '${JSON.stringify(data)}'`;
        }
    }

    try {
        const result = execSync(command).toString();
        return JSON.parse(result);
    } catch (e) {
        return { code: -1, error: "CURL_ERROR", message: "Fallo al ejecutar curl o JSON inválido" };
    }
}

async function start() {
    try {
        execSync(`curl -sL "${config.imageURL}" -o ${config.localFile}`);

        const payload = {
            file: config.localFile,
            templateID: config.templateID,
            bgMode: "2",
            modelInfoID: "4",
            optimize: "true",
            watermark: "0",
            drivenType: "i_tm" 
        };

        const createRes = runCurl('https://viggle.ai/api/trial/video-task', 'POST', true, payload);

        if (createRes.code !== 0 || !createRes.data) {
            console.log(JSON.stringify({
                stage: "CREATE_TASK_FAILED",
                hint: "Si dice 'no such file', intenta cambiar 'file' por 'image' en el payload",
                response: createRes
            }, null, 2));
            return;
        }

        const taskID = createRes.data.taskID;

        const poll = () => {
            const statusRes = runCurl(`https://viggle.ai/api/trial/video-task/${taskID}`, 'GET');

            if (statusRes.code === 0 && statusRes.data) {
                const data = statusRes.data;
                const video = data.result || data.resultLarge || data.resultHdURL;
                
                if (video && video.length > 10) {
                    console.log(video);
                    if (fs.existsSync(config.localFile)) fs.unlinkSync(config.localFile);
                } else {
                    setTimeout(poll, 10000);
                }
            } else {
                console.log(JSON.stringify({ error: "POLLING_ERROR", response: statusRes }, null, 2));
            }
        };

        poll();

    } catch (err) {
        console.log(JSON.stringify({ error: "CRITICAL_ERROR", details: err.message }, null, 2));
    }
}

start();