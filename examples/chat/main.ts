import { EventEmitter } from 'https://deno.land/x/event/mod.ts';
import { handleRequest, Page, Widgets } from "jsr:@marveluzz-ui/marveluzz-ui";
import { sleep } from "https://deno.land/x/sleep/mod.ts"

const port: number = 8080;

function username_callback(usernameEvent: EventEmitter) {
    usernameEvent.emit("username");
}
function message_callback(messageEvent: EventEmitter) {
    messageEvent.emit("message");
}

const globalEmitter = new EventEmitter();
async function waitForGlobalEvent(eventName: string) {
    return new Promise(resolve => {
        globalEmitter.once(eventName, resolve);
    });
}

async function pageApp(page: Page) {
    // step #1 prompt username
    const eventEmitter = new EventEmitter();
    async function waitForLocalEvent(eventName: string) {
        return new Promise(resolve => {
            eventEmitter.once(eventName, resolve);
        });
    }
    page.add(Widgets.put_scope("username_scope", "column"));
    page.add(Widgets.pin_input("text", "username", "Enter your username:"));
    page.add(Widgets.put_button("Submit", () => { username_callback(eventEmitter) }));
    page.setFocus("username");
    await waitForLocalEvent("username");
    const username = await page.getValue("username")
    console.log(`New user: ${username}`);
    globalEmitter.emit("message", `"${username}" entered the room.`);

    // step #2 add message prompt
    page.removeScope("username_scope");
    page.useScope();
    page.add(Widgets.put_scope("message_scope", "column"));
    page.add(Widgets.pin_input("text", "message", ""));
    page.add(Widgets.put_button("Send", () => { message_callback(eventEmitter) }));
    page.useScope();
    eventEmitter.on("message", async () => {
        const message = await page.getValue("message");
        page.setValue("message", "");
        page.setFocus("message");
        globalEmitter.emit("message", `${username}: ${message}`);
    });
    // step #3 add chatbox with events
    page.add(Widgets.put_scope("chat_scope"));
    let global_listener = async (message) => {
        if (typeof message === "string") {
            console.log(`Client: ${username} - ${message}`);
            page.add(Widgets.put_text(`${message}`, "chat_scope", 0));
        }
    }
    globalEmitter.on("message", global_listener);
    page.setFocus("message");
    // finally wait till client closes the page
    await page.wait_for_close();
    globalEmitter.off("message", global_listener); // global listener uses page.add(). We have to make sure it isn't used after the socket is closed.
}

const handler = async (req: Request): Promise<Response> => {
    return handleRequest(req, "Marveluzz Chat", pageApp);
}

Deno.serve({ port }, handler);
