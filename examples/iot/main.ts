import { EventEmitter } from 'https://deno.land/x/event/mod.ts';
import { Application, Router, route, websockets } from "https://deno.land/x/oak/mod.ts";
import { Session } from "https://deno.land/x/oak_sessions@v4.0.5/mod.ts";
import { OAuth2Client } from "https://deno.land/x/oauth2_client/mod.ts";
import { handleRequest, Page, Widgets } from "jsr:@marveluzz-ui/marveluzz-ui";

import { delay } from "https://deno.land/std/async/mod.ts";


const access_id = 44663346; // from https://api.github.com/users/<username>

const oauth2Client = new OAuth2Client({
  clientId: "<YOUR CLIENT ID>", // TODO
  clientSecret: "<YOUR CLIENT SECRET>",
  authorizationEndpointUri: "https://github.com/login/oauth/authorize",
  tokenUri: "https://github.com/login/oauth/access_token",
  resourceEndpointHost: "https://api.github.com",
  redirectUri: "https://marveluzz-iot.deno.dev/oauth2/callback",  
  defaults: {
    scope: "read:user",
  },
});

type AppState = {
  session: Session;
};

let current_session = undefined; // avoid complex session managment

const globalEmitter = new EventEmitter();

async function pageApp(page: Page) {
  page.add(Widgets.pin_input("text", "connections_status", "Connections status", "Undefined State"));  

  page.add(Widgets.put_markdown("# Outputs"));
  page.add(Widgets.put_scope("outputs", "column"));
  for (let i = 0; i < 8; i++) {
    const output = `output${i}`;
    page.useScope("outputs");  
    page.add(Widgets.put_scope(output, "row"));
    page.add(Widgets.pin_input("text", output, "", "Undefined State"));
    page.add(Widgets.put_button("On", () => { globalEmitter.emit("command", output, true) }));
    page.add(Widgets.put_button("Off", () => { globalEmitter.emit("command", output, false) }));
  }
  page.useScope();
  page.add(Widgets.put_markdown("# Inputs"));
  page.add(Widgets.put_scope("inputs", "column"));
  for (let i = 0; i < 8; i++) {
    const input = `input${i}`;
    page.useScope("inputs");  
    page.add(Widgets.put_scope(input, "row"));
    page.add(Widgets.pin_input("text", input, "", "Undefined State"));  
  }
  let global_listener = async (status) => {
    // TODO more type checking
    for (let i = 0; i < 8; i++) {
      const input = `input${i}`;
      if(status.inputs[i] === true) {
        page.setValue<string>(input, "On");
      } else {
        page.setValue<string>(input, "Off");
      }
    }
    for (let i = 0; i < 8; i++) {
      const output = `output${i}`;
      if(status.outputs[i] === true) {
        page.setValue<string>(output, "On");
      } else {
        page.setValue<string>(output, "Off");
      }
    }
  }
  let connection_listener = async (connection_status) => {
    if (typeof connection_status === "boolean") {
      if (connection_status === true) {
        page.setValue<string>("connections_status", "connected");
      } else {
        page.setValue<string>("connections_status", "dis-connected");
      }
    }
  }

  // TODO global state if available
  globalEmitter.on("connection", connection_listener);  
  globalEmitter.on("status", global_listener);
  await page.wait_for_close();
  globalEmitter.off("status", global_listener);
  globalEmitter.off("connection", connection_listener);
}


const router = new Router();
router.get("/", route( async (req, ctx) => {
    console.log("/");
    const session = await ctx.state.session;
    const sessionId = session.sid;
  if (sessionId !== current_session) {
    return new Response(null, { 
      status: 302, // Or 303 if appropriate
      headers: new Headers({ 'Location': '/login' })
    });
  }
  return handleRequest(req, "Marveluzz IoT", pageApp);
}));

router.get("/login", async (ctx) => {
  console.log("/login");
  const { uri, codeVerifier } = await oauth2Client.code.getAuthorizationUri();
  ctx.state.session.flash("codeVerifier", codeVerifier);  
  console.log(uri);
  // Redirect the user to the authorization endpoint
  ctx.response.redirect(uri);  
});

router.get("/oauth2/callback", async (ctx) => {
  console.log("callback: " + ctx.request.url);
  const codeVerifier = ctx.state.session.get("codeVerifier");
  if (typeof codeVerifier !== "string") {
    throw new Error("invalid codeVerifier");
  }
  console.log(codeVerifier);
  const tokens = await oauth2Client.code.getToken(ctx.request.url, {
    codeVerifier,
  });
  // console.log("tokens: " + JSON.stringify(tokens));

  // Use the access token to make an authenticated API request
  const userResponse = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
    },
  });
  const { login } = await userResponse.json();
  const usersResponse = await fetch(`https://api.github.com/users/${login}`, {
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
    },
  });
  const {id: id} = await usersResponse.json();
  
  if (id === access_id) {
    ctx.response.body = `Hello, ${login}! You'll be redirected in a few seconds...`;
    const session = await ctx.state.session;
    const sessionId = session.sid;
    current_session = sessionId;
    // setTimeout(() => { // TODO use timeout
      ctx.response.redirect("/"); 
    //}, 3000); // 3000 milliseconds = 3 seconds
  } else {
    ctx.response.body = `Access denied for ${login}!`;
  }
});

let activeConnection: boolean = false;


const limitConnections = async (ctx: Context, next: () => Promise<unknown>) => {
  if (activeConnection) {
    ctx.throw(409, "Only one connection allowed at a time");
    return;
  }

  await next();
};

router.get("/ws", limitConnections, async (ctx) => {
  if (!ctx.isUpgradable) {
    ctx.throw(501, "Not Upgradeable");
  }
  const sock = await ctx.upgrade();
  activeConnection = true;
  sock.onopen = () => {
    console.log("IoT WebSocket connection opened");
    globalEmitter.emit("connection", true);
  };
  sock.onmessage = (event) => {
    console.log("IoT Message received:", event.data);
    globalEmitter.emit("status", JSON.parse(event.data));
  };
  let command_listener = async (output, state) => {
    console.log(output, state);
    sock.send(JSON.stringify({[output]: state})); // TODO check open state
  }
  globalEmitter.on("command", command_listener);

  await new Promise((resolve) => { // await close
    sock.onclose = () => {
      console.log("IoT WebSocket connection closed");
      globalEmitter.emit("connection", false);
     activeConnection = false;

      resolve(); // Resolve the Promise when the 'onclose' event is triggered
    };
  });
  globalEmitter.off("command", command_listener);

});

async function pageTestApp(page: Page) {
  page.add(Widgets.put_button("Test IO pattern", async () => { 
    "ws://localhost:80/ws"
    const endpoint = "wss://marveluzz-iot.deno.dev/ws"; // Replace with your WebSocket server endpoint
    try {
      const sock = new WebSocket(endpoint);
      sock.onopen = async () => {
        console.log("Test WebSocket connection opened");
        sock.send(JSON.stringify({
          inputs: [false, true, false, true, false, true, false, true],
          outputs: [true, false, true, false, true, false, true, false] }));
        await delay(3000);
        sock.send(JSON.stringify({
          inputs: [true, false, true, false, true, false, true, false],
          outputs: [false, true, false, true, false, true, false, true] }));
        await delay(3000);
        sock.send(JSON.stringify({
          inputs: [false, true, false, true, false, true, false, true],
          outputs: [true, false, true, false, true, false, true, false] }));
      };
      sock.onclose = () => {
        page.add(Widgets.put_text("IO pattern connection closed"));        
        console.log("Test WebSocket connection closed");
      };
      await delay(10 * 1000); // TODO replace by await onclose
      sock.close();
    } catch (err) {
      console.error("WebSocket connection error:", err);
    }
  }));
  page.add(Widgets.put_button("Test Websocket command", async () => { 
    // not working: "ws://localhost:80/ws"
    const endpoint = "wss://marveluzz-iot.deno.dev/ws";
    try {
      const sock = new WebSocket(endpoint);
      sock.onopen = async () => {
        console.log("Test WebSocket connection opened");
        sock.send(JSON.stringify({
          inputs: [false, true, false, true, false, true, false, true],
          outputs: [true, false, true, false, true, false, true, false] }));
      };
      sock.onmessage = (event) => {
        console.log("Test Message received:", event.data);
        page.add(Widgets.put_text(JSON.stringify(event.data)));
      };
      sock.onclose = (closeEvent) => {
        page.add(Widgets.put_text(`Command connection closed: ${closeEvent.reason}, ${closeEvent.code}`));
        console.log(`Test WebSocket connection closed: ${closeEvent.reason}`);
      };
      await delay(10 * 1000); // TODO replace by await onclose
      sock.close();
    } catch (err) {
      console.error("WebSocket connection error:", err);
    }
  }));

  await page.wait_for_close();
}
router.get("/selftest", route( async (req, ctx) => {
    const session = await ctx.state.session;
    const sessionId = session.sid;
  if (sessionId !== current_session) {
    return new Response(null, { 
      status: 302, // Or 303 if appropriate
      headers: new Headers({ 'Location': '/login' })
    });
  }
  return handleRequest(req, "Marveluzz IoT Sef-Test", pageTestApp);
}));

const app = new Application<AppState>();
app.use(Session.initMiddleware());
app.use(router.allowedMethods(), router.routes());

await app.listen({ port: 80 });