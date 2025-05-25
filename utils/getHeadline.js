import puppeteer from 'puppeteer';
import fs from 'fs';
// type Quote = {
//     Title: string;
//     Body: string;
//     Source_url: string;
// }
export const getHeadline = async () => {
    try {
        // Start a Puppeteer session
        const browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
        });
        const page = await browser.newPage();

        // Navigate to the page
        await page.goto("https://peoplesbalita.com/halalan/", {
            waitUntil: "domcontentloaded",
        });
        // const button = ''
        // Wait for the button to be available and click it
        await page.waitForSelector('.button-holder > a:nth-child(1)', { timeout: 5000 });
        await page.waitForTimeout(3000);
        await page.click('.button-holder > a:nth-child(1)');
        const photoSelector = 'body > div.page-wrapper > div.content-container > div.main-center-holder.float-left > div > div.home-content-container > div.single-news-holder > div.par-holder > p:nth-child(1) > img';

        // Extract data
        const photos = await page.$$eval(photoSelector, img => img.map(image => image.src));
        let savedPhoto = '';
        if (photos && photos.length > 0) {
            for (let i = 0; i < photos.length; i++) {
                const imagePage = await page.goto(photos[i]); // Access each URL in the array
                const fileName = `img_${photos[i].split("/").pop() + i + 1}.jpg`; // Generate a unique filename for each image
                await fs.promises.writeFile('assets/'+fileName, await imagePage.buffer()); // Use fs.promises for async/await
                savedPhoto = 'assets/' + fileName;
            }
            
        }
        const quotes = await page.evaluate(() => {
            const title = document.querySelector("body > div.page-wrapper > div.content-container > div.main-center-holder.float-left > div > div.home-content-container > div.single-news-holder > div.news-title > h1")?.innerText || "No title found";
            const body = document.querySelector("#yiv4317336956ymail_android_signature")?.innerText || "No context found";
            // const source_url = saved // Replace with the actual URL if needed
            return { title, body };
        });
        quotes.source_url = savedPhoto; // Add the image URL to the quotes object
        // console.log(photos);

        // Close the browser
        await browser.close();

        return JSON.stringify(quotes);
    } catch (error) {
        console.error("Error during Puppeteer script execution:", error);
        throw error; // Re-throw the error to ensure the function's return type is consistent
    }
};
