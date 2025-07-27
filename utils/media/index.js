/* Copyright (C) 2025 Codex.
Licensed under the MIT License;
you may not use this file except in compliance with the License.
Codex - AstraWa Media Utils
*/

const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");

const MEDIA_DIR = path.join(__dirname, "../../media/temp");

function getRandomFileName(ext = '') {
    const random = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return path.join(MEDIA_DIR, `${random}.${ext}`);
}

function ensureMediaDir() {
    if (!fs.existsSync(MEDIA_DIR)) {
        fs.mkdirSync(MEDIA_DIR, { recursive: true });
    }
}

function ffmpegProcess(buffer, args = [], ext = '', ext2 = '') {
    return new Promise(async (resolve, reject) => {
        try {
            ensureMediaDir();
            
            const tmp = getRandomFileName(ext);
            const out = getRandomFileName(ext2);
            
            await fs.promises.writeFile(tmp, buffer);
            
            const { spawn } = require('child_process');
            spawn('ffmpeg', ['-y', '-i', tmp, ...args, out])
                .on('error', reject)
                .on('close', async (code) => {
                    try {
                        await fs.promises.unlink(tmp);
                        if (code !== 0) return reject(new Error(`FFmpeg exited with code ${code}`));
                        const result = await fs.promises.readFile(out);
                        await fs.promises.unlink(out);
                        resolve(result);
                    } catch (e) {
                        reject(e);
                    }
                });
        } catch (e) {
            reject(e);
        }
    });
}

function toAudio(buffer, ext) {
    return ffmpegProcess(buffer, ['-vn', '-ac', '2', '-b:a', '128k', '-ar', '44100', '-f', 'mp3'], ext || 'mp3', 'mp3');
}

function toPTT(buffer, ext) {
    return ffmpegProcess(
        buffer,
        ['-vn', '-c:a', 'libopus', '-b:a', '128k', '-vbr', 'on', '-compression_level', '10', '-f', 'opus'],
        ext || 'mp3',
        'ogg'
    );
}

module.exports = {
    toAudio,
    toPTT,
    ffmpegProcess
};