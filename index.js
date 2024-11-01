import express from 'express';
import bodyParser from 'body-parser';
import ytdlp from 'yt-dlp-exec';
import { getYoutubeCookies, writeNetscapeCookiesFile } from './utils.js';
import fs from 'fs';
const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post('/download', async (req, res, attempt = 1) => {
    
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ message: 'URL is required.' });
    }

    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', 'attachment; filename="video.mp4"');

    try {

        const cookies = await getYoutubeCookies();

        writeNetscapeCookiesFile(cookies)

        // sleeping interval to avoid getting status 429
        const videoProcess = ytdlp.exec(url, {
            output: '-', 
            sleepInterval: 5, 
            cookies: './youtube-cookies.txt'
        });
     
        videoProcess.stdout.pipe(res);

        videoProcess.stderr.on('data', (data) => {
            console.log('stderr on')
            console.log(data.toString()) 
        });

        videoProcess.on('close', (code) => {
            console.log(`yt-dlp exited with code ${code}`);
             fs.unlink('./youtube-cookies.txt', (err) => {
                if (err) {
                    console.error('Error deleting cookies.txt:', err);
                } else {
                    console.log('cookies.txt deleted successfully.');
                }
            });
             if (code !== 0 && !res.headersSent) {
                return res.status(500).json({ message: 'Error downloading the video.' });
            }
            
        });
    } catch (error) {
        console.error('Error executing yt-dlp:', error);
        // limit the attemps to 3
        if (error.message.includes('HTTP Error 429') && attempt < 3) { 
            console.log(`Attempt ${attempt} failed. Retrying...`);
            downloadVideo(url, res, attempt + 1);
        } else {
            if (!res.headersSent) {
                return res.status(500).json({ message: 'Error executing yt-dlp.', error: error.message });
            }
        }
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});