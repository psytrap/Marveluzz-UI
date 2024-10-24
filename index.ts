import { join } from "path";
import { readFile } from "fs/promises";
import { ServerResponse } from 'http';
import * as ws from 'ws';

import { Page } from "./page";
import { Widgets } from "./widgets";
import { WebSocketAdapter } from "./websocket-adapter";

export { Page, Widgets };

const baseUrl = new URL(".", import.meta.url);
let indexHtmlTemplate: string;

if (baseUrl.protocol === "file:") {
    const __dirname = baseUrl.pathname;
    const filePath = join(__dirname, "assets", "index.html.template");
    indexHtmlTemplate = await readFile(filePath, "utf-8");
} else {
    const response = await fetch(
        new URL("assets/index.html.template", import.meta.url).href
    );
    indexHtmlTemplate = await response.text();
}

export function isWebSocketRequest(url: string) {
    if (url === "/?app=index&session=NEW") {
        return true;
    } else {
        return false;
    }
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
export function pageTemplate(
    res: ServerResponse, pageTitle: string,
): void {
    const indexHtmlContent = indexHtmlTemplate.replace(
        "__MARVELUZZ_UI__PAGE_TITLE__",
        pageTitle
    );
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(indexHtmlContent);
}

/**
 * Internal handler for the Websocket connection initiated by the client side JS framework.
 * @param socket
 * A NodeJS ws WebSocket
 * @param pageCallback
 * Callback to the Marveluzz UI based app
 * @returns
 * The HTTP respones
 */
export async function webSocketHandler(
    socket: ws.WebSocket,
    pageCallback: (page: Page) => Promise<void>
): Promise<void> {
    // This needs to be adapted to your specific Node.js WebSocket library
    // Here's an example using the 'ws' library:
    const adapter = new WebSocketAdapter(socket)
    const page = new Page(adapter);
    await pageCallback(page);
    socket.close();
    console.log("Page closed!");
}


