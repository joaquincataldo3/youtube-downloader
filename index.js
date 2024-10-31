const express = require('express');
const bodyParser = require('body-parser');
const ytdlp = require('yt-dlp-exec');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para parsear el cuerpo de las solicitudes JSON
app.use(bodyParser.json());

// Endpoint para descargar el video
app.post('/download', async (req, res, attempt = 1) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ message: 'URL is required.' });
    }

    // Configurar los encabezados para la respuesta
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', 'attachment; filename="video.mp4"');

    try {
        // Ejecutar yt-dlp y capturar la salida como stream
        const videoProcess = ytdlp.exec(url, {
            output: '-', // Redirige la salida estándar como stream
            sleepInterval: 5, 
            cookies: './cookies.txt',
            proxy: '179.41.8.151:80'
        });

        // Pipear el stream de video a la respuesta
        videoProcess.stdout.pipe(res);

        // Manejar errores en stderr
        videoProcess.stderr.on('data', (data) => {
            console.log('sdton')
            console.error(`Error: ${data.toString()}`);
            console.log(data.toString()) // Convierte el buffer a string
        });

        // Manejar el cierre del proceso
        videoProcess.on('close', (code) => {
            console.log(`yt-dlp exited with code ${code}`);
             if (code !== 0 && !res.headersSent) {
                return res.status(500).json({ message: 'Error downloading the video.' });
            }
        });
    } catch (error) {
        console.error('Error executing yt-dlp:', error);
        if (error.message.includes('HTTP Error 429') && attempt < 3) { // Limita los reintentos a 3
            console.log(`Attempt ${attempt} failed. Retrying...`);
            // Reintento después de 5 segundos
            downloadVideo(url, res, attempt + 1);
        } else {
            if (!res.headersSent) {
                return res.status(500).json({ message: 'Error executing yt-dlp.', error: error.message });
            }
        }
    }
});

// Levantar el servidor
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});