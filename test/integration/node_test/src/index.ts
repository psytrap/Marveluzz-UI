import express from 'express';
import * as ws from 'ws';

import { pageTemplate, webSocketHandler, Page, Widgets, isWebSocketRequest } from "marveluzz-node";

const app = express();
const server = app.listen(8080, () => {
  console.log('Server listening on port 8080');
});
const wss = new ws.WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  if (isWebSocketRequest(request?.url || "")) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

function callback() {
  console.log("Thankyou for clicking!");
}

async function pageCallback(page: Page) {
  page.add(Widgets.put_text("Hello World!"));
  page.add(Widgets.put_button("Click me!", callback));
  await page.wait_for_close();
}

wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');
  webSocketHandler(ws, pageCallback);

  ws.on('close', () => {
    console.log('Client disconnected from WebSocket');
  });
});

app.get('/', (req, res) => {
  pageTemplate(res, "Marveluzz-Node");
});

console.log('http://localhost:8080');