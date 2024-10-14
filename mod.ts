// Copyright 2024 the Marveluzz authors. All rights reserved. MIT license.

/**
 * A basic server-side only reactive webframework that is simple and easy to use. 
 * 
 * Marveluzz is derived from the Python library [PyWebIO](https://www.pyweb.io/) and ported to server-side JS.
 * 
 * Here is how simple an webapp with server-side interaction can look like:
 * 
 * ```ts
 * import { handleRequest, Page, Widgets } from "jsr:@marveluzz-ui/marveluzz-ui";
 *  
 *const port: number = 8080;
 *
 *function callback()
 *{
 *  console.log("Thankyou for clicking!");
 *}
 *
 *async function pageApp(page: Page) {
 *  page.add(Widgets.put_text("Hello World!"));
 *  page.add(Widgets.put_button("Click me!", callback));
 *  await page.wait_for_close();
 *}
 *
 *const handler = async (req: Request): Promise<Response> => {
 *  return handleRequest(req, "Simple Test App", pageApp);
 *}
 *
 *Deno.serve({ port }, handler);
 *```
 * 
 */

 import { join, fromFileUrl } from "jsr:@std/path@1.0.6";
 import { Page } from "./page.ts";
import { Widgets } from "./widgets.ts"

export { Page, Widgets }

const baseUrl = new URL(".", import.meta.url);
let indexHtmlTemplate: string;
if (baseUrl.protocol === "file:") {
    const __dirname = fromFileUrl(baseUrl);
    const filePath = join(__dirname, "assets", "index.html.template");
    const decoder = new TextDecoder("utf-8");
    indexHtmlTemplate = decoder.decode(await Deno.readFile(filePath));
} else {
    const response = await fetch(new URL("assets/index.html.template", import.meta.url).href);
    indexHtmlTemplate = await response.text();
}

/**
 * Routine used to handle HTTP request interacting with the Marveluzz UI.
 * @param request
 * The data structure containing the HTTP request.
 * @param pageTitle
 * Title shown by the browser tab defined by the HTML tag <title>.
 * @param pageCallback
 * The callback function implementing the Marveluzz UI based app.
 * @returns
 * The data structure containing the HTTP response.
 */
export const handleRequest = async (request: Request, pageTitle: string, pageCallback: (page: Page) => Promise<void>): Promise<Response> => {
    const url = new URL(request.url);
    if (url.searchParams.get("app") === "index") {
        return wsHandler(request, pageCallback);
    } else {
        const indexHtmlContent = indexHtmlTemplate.replace("__MARVELUZZ_UI__PAGE_TITLE__", pageTitle);
        return new Promise((resolve, reject) => {
            resolve(new Response(indexHtmlContent, {
                status: 200,
                headers: {
                    "content-type": "text/html; charset=utf-8",
                },
            }));
        });

    }
}



/**
 * Internal handler for the Websocket connection initiated by the client side JS framework.
 * @param request
 * The HTTP request
 * @param pageCallback
 * Callback to the Marveluzz UI based app
 * @returns 
 * The HTTP respones
 */

async function wsHandler(request: Request, pageCallback: (page: Page) => Promise<void>): Promise<Response> {
    const { response, socket } = Deno.upgradeWebSocket(request);
    const page = new Page(socket);
    socket.onopen = async () => {
        console.log("WebSocket connection opened");
        await pageCallback(page); // This will access the correct socket // catch errors / needs to be tested
        socket.close();
        console.log("Page closed!");
    };

    socket.onclose = () => {
        console.log("WebSocket connection closed");
    };

    socket.onerror = (err) => {
        console.error("WebSocket error:", err);
    };

    return response;
}

