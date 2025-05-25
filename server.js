import { createRequestHandler } from "@react-router/express";
import compression from "compression";
import express from "express";
import morgan from "morgan";
import path from "path";
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

 // Start the scraping
//   getQuotes();
// go(); 
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
const port = process.env.PORT || 3000;
app.listen(port, () =>
  console.log(`Express server listening at http://localhost:${port}`)
);
