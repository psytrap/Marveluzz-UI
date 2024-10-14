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
  return handleRequest(req, "Simple Marveluzz UI App", pageApp);
}

Deno.serve({ port }, handler);
