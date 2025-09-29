import { createRequestHandler } from "@react-router/express";
import compression from "compression";
import express from "express";
import morgan from "morgan";
import path from "path";
import cron from "node-cron";
import puppeteer from 'puppeteer';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getHeadlineQuotes, getHeadline } from './utils/getQuotes.js';



const viteDevServer =
  process.env.NODE_ENV === "production"
    ? undefined
    : await import("vite").then((vite) =>
        vite.createServer({
          server: { middlewareMode: true },
        })
      );

const reactRouterHandler = createRequestHandler({
  build: viteDevServer
    ? () => viteDevServer.ssrLoadModule("virtual:react-router/server-build")
    : await import("./build/server/index.js"),
});

const app = express();

app.use(compression());
app.disable("x-powered-by");

if (viteDevServer) {
  app.use(viteDevServer.middlewares);
} else {
  app.use(
    "/assets",
    express.static("build/client/assets", { immutable: true, maxAge: "1y" })
  );
}

app.use(express.static("build/client", { maxAge: "1h" }));
app.use(morgan("tiny"));

// CORS proxy endpoint for fetching WordPress images with authentication
app.get('/api/proxy-image', async (req, res) => {
  try {
    const imageUrl = req.query.url;
    const needsAuth = req.query.auth === 'true';

    if (!imageUrl) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    console.log('Proxying image request for:', imageUrl);
    console.log('Needs authentication:', needsAuth);

    // Prepare headers for WordPress authentication if needed
    const fetchHeaders = {};
    if (needsAuth) {
      const wpUsername = process.env.VITE_WP_APP_USERNAME;
      const wpPassword = process.env.VITE_WP_APP_PASSWORD;

      if (wpUsername && wpPassword) {
        const authString = Buffer.from(`${wpUsername}:${wpPassword}`).toString('base64');
        fetchHeaders['Authorization'] = `Basic ${authString}`;
        console.log('Added WordPress authentication headers');
      }
    }

    const response = await fetch(imageUrl, {
      headers: fetchHeaders
    });

    if (!response.ok) {
      console.error(`Failed to fetch image: ${response.status} - ${response.statusText}`);
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    console.log('Image fetched successfully, content-type:', response.headers.get('content-type'));

    // Set appropriate CORS headers
    res.set('Content-Type', response.headers.get('content-type') || 'image/jpeg');
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    // Stream the image data
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Error proxying image:', error);
    res.status(500).json({ error: 'Failed to fetch image', details: error.message });
  }
});

app.all("*", reactRouterHandler);


const go = async () => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const imagePath = path.join(__dirname, "assets", "panda.jpg");
    const imageBuffer = fs.readFileSync(imagePath);
    const postHeaders = new Headers();
    postHeaders.set("Content-Type", "image/jpeg");
    postHeaders.set(
        "Content-Disposition",
        "attachment; filename=" + imagePath.split("/").pop()
    );
    postHeaders.set(
        "Authorization",
        "Basic " + Buffer.from(`${process.env.VITE_WP_APP_USERNAME}:${process.env.VITE_WP_APP_PASSWORD}`)
        .toString("base64")
    );
    const imageId = await fetch(
        "https://peoplesbalita.com/wp-json/wp/v2/media",
        {
            method: "POST",
            headers: postHeaders,
            body: imageBuffer,
        }
    );
    const imageIdJson = await imageId.json();
    console.log(imageIdJson);
    //// start of the context
    const customFieldValue = imageIdJson.source_url;
    const contextHeaders = new Headers();
    contextHeaders.set("Content-Type", "application/json");
    contextHeaders.set(
        "Authorization",
        "Basic " + Buffer.from(`${process.env.VITE_WP_APP_USERNAME}:${process.env.VITE_WP_APP_PASSWORD}`)
        .toString("base64")
    );
    await fetch(
        "https://peoplesbalita.com/wp-json/wp/v2/posts",
        {
            method: "POST",
            headers: contextHeaders,
            body: JSON.stringify({
                title: "My Post Title",
                content: "My Post Content",
                status: "publish",
                categories: [51],
                meta: {
                    "article_thumb": customFieldValue,    
                }
            }),
        }
    );


};
async function render(){
    const headlineURL = 'https://www.philstar.com/headlines';
    console.log("Rendering...");
    // const quotes = await getHeadlineQuotes();
    const headline = await getHeadline(headlineURL);
    // const pbContent = JSON.parse(quotes);
    // if(headlineContent.title != "No title found"){
    //     //upload
        
    // }
    console.log(headline);
}
// render();
async function fetchAccessToken(){
  try {
    // const access = await getAccessToken();
    console.log("Access Data:", access);
    // const response = await fetch('https://graph.facebook.com/oauth/access_token', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     client_id: process.env.VITE_APP_ID,
    //     client_secret: process.env.VITE_SECRET_KEY,
    //     grant_type: 'fb_exchange_token',
    //     fb_exchange_token: process.env.VITE_FB_ACCESS_TOKEN
    //   })
    // });
    // const data = await response.json();
    // console.log("Access Token Response:", data);
    // return data.access_token;
  } catch (error) {
    console.error("Failed to fetch access token:", error);
    return null;
  }
}
// fetchAccessToken();
// cron.schedule('0 0 */59 * *', async () => {
//   console.log("Running scheduled job: go()");
//   // await go();
// });
const port = process.env.PORT || 3000;
app.listen(port, () =>
  console.log(`Express server listening at http://localhost:${port}`)
);
