import { Application } from "jsr:@oak/oak/application";
import { Router } from "jsr:@oak/oak/router";
import { handleRequest, Page, Widgets } from "../../mod.ts";
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
  page.add(Widgets.put_text("TEXT")); // , "TEST"));
  page.add(Widgets.pin_input("number", "number_input","Number:"));
  page.add(Widgets.put_grid_scope("column", "COLUMN_TEST"));
  page.add(Widgets.pin_input("number", "number_input_a","Number:", "COLUMN_TEST"));
  page.add(Widgets.pin_input("number", "number_input_b","Number:", "COLUMN_TEST"));  
  await sleep(10);
// TODO
}

const handler = async (req: Request): Promise<Response> => {
  return handleRequest(req, "Integration Test", pageApp);
}


Deno.serve({ port }, handler);

/*

ui = new SmoothieUI();

ui.register("/integration", my_app)

ui.serve({port});
*/
/*

const router = new Router();
router
  .get("/", (context) => {
    context.response.body = "Hello world!";
  })
  .get("/book", (context) => {
    context.response.body = Array.from(books.values());
  })
  .get("/book/:id", (context) => {
    if (books.has(context?.params?.id)) {
      context.response.body = books.get(context.params.id);
    }
  });

const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 8000 });
*/
// Authentication?

