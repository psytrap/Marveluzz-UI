# Marveluzz UI

Early Alpha - Very basic implementation even lacking a general design for error handling

Simple and easy to use reactive webframework with all server-side logic.

Get it on:
* [Marveluzz UI on JSR](https://jsr.io/@marveluzz-ui)
* Node port on [npm](https://www.npmjs.com/package/marveluzz-node)

# Use cases

* Prototyping Webapps
* Scripting and tooling
* Tinkering & Education

# Features

* Supports imperative programming style
* All server-side logic, with the session management encapsulated.
* Async implementation.
* Support for plain Deno server and the Oak middleware.
* Single file, no generate step (Runs directly from Deno.com playground)

# Example

Check out the [Examples](/examples). Here is simple an webapp with server-side interaction can look like:
```ts
import { handleRequest, Page, Widgets } from "jsr:@marveluzz-ui/marveluzz-ui";
  
const port: number = 8080;

function callback()
{
  console.log("Thankyou for clicking!");
}

async function pageApp(page: Page) {
  page.add(Widgets.put_text("Hello World!"));
  page.add(Widgets.put_button("Click me!", callback));
  await page.wait_for_close();
}

const handler = async (req: Request): Promise<Response> => {
  return handleRequest(req, "Simple Test App", pageApp);
}

Deno.serve({ port }, handler);
```

## Node Port

```ts
import express from "express";
import * as ws from "ws";

import {
  pageTemplate,
  webSocketHandler,
  Page,
  Widgets,
  isWebSocketRequest,
} from "marveluzz-node";

const app = express();
const server = app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
const wss = new ws.WebSocketServer({ noServer: true });

server.on("upgrade", (request, socket, head) => {
  if (isWebSocketRequest(request?.url || "")) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
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

wss.on("connection", (ws) => {
  console.log("Client connected to WebSocket");
  webSocketHandler(ws, pageCallback);

  ws.on("close", () => {
    console.log("Client disconnected from WebSocket");
  });
});

app.get("/", (req, res) => {
  pageTemplate(res, "Marveluzz-Node");
});

```
# Credits

Marveluzz UI is based on [pyWebIO](https://www.pyweb.io/) and uses it's client webiojs.
