import express from 'express';
import bodyParser from 'body-parser';
import { formatCookiesToNetscape, getYoutubeCookies } from './utils.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post('/download', async (req, res, attempt = 1) => {
    
    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ message: 'URL is required.' });
    }

    try {
       const cookies = await getYoutubeCookies();
       const formatedCookies = formatCookiesToNetscape(cookies)
       return res.status(200).json({
            status: 'S',
            data: formatedCookies
       });
    } catch (error) {
        console.error('Error obtaining cookies:', error);
        return 
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});