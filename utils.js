import puppeteer from 'puppeteer-extra';
import Stealth from 'puppeteer-extra-plugin-stealth';
import randomUserAgent from 'random-useragent';
import dotenv from 'dotenv';
import { v2 as cloudinary} from 'cloudinary';
dotenv.config();
cloudinary.config({ 
    cloud_name: process.env.DEV_CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.DEV_CLOUDINARY_API_KEY, 
    api_secret: process.env.DEV_CLOUDINARY_API_SECRET 
  });
puppeteer.use(Stealth())
export const getYoutubeCookies = async () => {
    try{
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setUserAgent(randomUserAgent.getRandom());
        await page.setViewport({ width: 1280, height: 800 });
        console.log('redirecting to google...')
        await page.goto('https://accounts.google.com/signin/v2/identifier');
        console.log('waiting  5 seconds')
        await delay(5000)
        console.log('typing email...')
        await page.type('input[type="email"]', process.env.YOUTUBE_EMAIL);
        await page.mouse.move(Math.random() * 1000, Math.random() * 1000);
        console.log('waiting  7 seconds')
        await delay(3000)
        console.log('clicking next....')
        await page.click('#identifierNext');
        setTimeout(async () => {
            const screenshot6 = await page.screenshot()
            cloudinary.uploader.upload_stream(
                (error, result) => {
                  if (error) {
                    console.error('Error uploading to Cloudinary:', error);
                  } else {
                    console.log('Upload successful:', result);
                  }
                }
              ).end(screenshot6);
        }, 20000);
        console.log('waiting for password')
        await page.waitForSelector('input[type="password"]', { visible: true, timeout: 60000 });
        console.log('got password...')
        console.log('typing password...')
        await page.type('input[type="password"]', process.env.YOUTUBE_PASSWORD);
        const screenshot3 = await page.screenshot(); // Capture screenshot as Buffer
        // Upload to Cloudinary
        // cloudinary.uploader.upload_stream(
        //   (error, result) => {
        //     if (error) {
        //       console.error('Error uploading to Cloudinary:', error);
        //     } else {
        //       console.log('Upload successful:', result);
        //     }
        //   }
        // ).end(screenshot3);
        console.log('clicking next...')
        await page.click('#passwordNext');
        console.log('waiting for network...')
        await page.waitForNavigation({ waitUntil: 'networkidle0' });
        console.log('redirecting to youtube...')
        await page.goto('https://www.youtube.com', { waitUntil: 'networkidle0' });
        console.log('getting cookies...')
        const youtubeCookies = await page.cookies();
        console.log('successfully obtained cookies...')
        await browser.close();
        return youtubeCookies;
    } catch(e) {
        console.log('error obtaining cookies ' + e)
    }
}

export const formatCookiesToNetscape = (youtubeCookies) => {
    let cookieFileContent = `# Netscape HTTP Cookie File\n# This file is generated by yt-dlp. Do not edit.\n\n`;
    youtubeCookies.forEach(cookie => {
        const domain = cookie.domain.startsWith('.') ? cookie.domain : `.${cookie.domain}`;
        const includeSubdomains = cookie.domain.startsWith('.') ? 'TRUE' : 'FALSE';
        const secure = cookie.secure ? 'TRUE' : 'FALSE';
        const expires = cookie.expires > 0 ? Math.floor(cookie.expires) : 0;

        cookieFileContent += `${domain}\t${includeSubdomains}\t${cookie.path}\t${secure}\t${expires}\t${cookie.name}\t${cookie.value}\n`;
    });
    return cookieFileContent;
}

function delay(time) {
  return new Promise(function(resolve) { 
      setTimeout(resolve, time)
  });
}