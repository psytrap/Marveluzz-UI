import { Application } from "jsr:@oak/oak/application";
import { Router } from "jsr:@oak/oak/router";
import { handleRequest, Page, Widgets } from "jsr:@smoothie-ui/smoothie-ui";

import { sleep } from "https://deno.land/x/sleep/mod.ts"


const port: number = 8080;

function callback()
{
  console.log("Thankyou for clicking!");
}

async function pageApp(page: Page) {
  //page.add(Widgets.put_scope("TEST"));
  page.add(Widgets.put_text("TEXT")); // , "TEST"));
  page.add(Widgets.put_button("Click me!", callback));
  await sleep(10);
// TODO
}

const handler = async (req: Request): Promise<Response> => {
  return handleRequest(req, "Integration Test", pageApp);
}


Deno.serve({ port }, handler);
