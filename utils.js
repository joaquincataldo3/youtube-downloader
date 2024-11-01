import puppeteer from 'puppeteer';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

export const getYoutubeCookies = async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://accounts.google.com/signin/v2/identifier');
    await page.type('input[type="email"]', process.env.YOUTUBE_EMAIL);
    await page.click('#identifierNext');
    await page.waitForSelector('input[type="password"]', { visible: true });
    await page.type('input[type="password"]', process.env.YOUTUBE_PASSWORD);
    await page.click('#passwordNext');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    // Step 2: Redirect to YouTube to get YouTube cookies
    await page.goto('https://www.youtube.com', { waitUntil: 'networkidle0' });
    
    // Step 3: Get cookies for YouTube
    const youtubeCookies = await page.cookies();
    await browser.close();
    return youtubeCookies;
}

export const writeNetscapeCookiesFile = (youtubeCookies) => {
    let cookieFileContent = `# Netscape HTTP Cookie File\n# This file is generated by yt-dlp. Do not edit.\n\n`;
    youtubeCookies.forEach(cookie => {
        const domain = cookie.domain.startsWith('.') ? cookie.domain : `.${cookie.domain}`;
        const includeSubdomains = cookie.domain.startsWith('.') ? 'TRUE' : 'FALSE';
        const secure = cookie.secure ? 'TRUE' : 'FALSE';
        const expires = cookie.expires > 0 ? Math.floor(cookie.expires) : 0;

        cookieFileContent += `${domain}\t${includeSubdomains}\t${cookie.path}\t${secure}\t${expires}\t${cookie.name}\t${cookie.value}\n`;
    });

    fs.writeFileSync('youtube-cookies.txt', cookieFileContent, 'utf-8');
    console.log('YouTube cookies saved in Netscape format.');
};
  