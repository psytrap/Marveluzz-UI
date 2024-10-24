/*
import Koa from 'koa';
import Router from 'koa-router';
import path from 'path';
import { handleRequest, Page, Widgets } from "marveluzz-node";


const app = new Koa();
const router = new Router();   

const port = 8080;


// Define a route for the home page
router.get('/', async (ctx) => {
  ctx.body = await handleRequest(ctx.req, "Integration Test", pageApp);
});

app.use(router.routes()).use(router.allowedMethods());

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

function callback()
{
  console.log("Thankyou for clicking!");
}

async function pageApp(page: Page) {
  page.add(Widgets.put_text("TEXT"));
  page.add(Widgets.put_button("Click me!", callback));
  page.wait_for_close();
}

*/