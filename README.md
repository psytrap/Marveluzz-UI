# Marveluzz UI

Early Alpha - Very basic implementation even lacking a general design for error handling

A basic server-side only reactive webframework that is simple and easy to use. 

# Use cases

* Prototyping Webapps
* Scripting and tooling
* Tinkering & Education

# Features

* Supports imperative programming style
* All server-side application, with the session management encapsulated.
* Async implementation.
* Support for plain Deno server and the Oak middleware.

# Example
Here is how simple an webapp with server-side interaction can look like:
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

# TODO

* Node support + glitch demo
* Simplify examples
* PyWebio Github submodule
* Github automation
* Feature completeness
* Better scope handling, callback registery
* TS code based scopes
* Better naming scheme for widgets -> interactive
* Many more TODOs...