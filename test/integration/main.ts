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
  page.add(Widgets.put_markdown("# Markdown Test\nText Body"));
  page.add(Widgets.put_table([["1", "2", "3"], ["4", "5", "6", "7"], ["8", "9", "10"]], ["abc", "def", "hij"]));
  page.add(Widgets.put_table([["1", undefined, "3"], ["4", Widgets.span("5", 2, 1), "6", "7"], ["8", "9", "10"]]));
  page.add(Widgets.put_radio("radio_group", [{value: 1, label: "Letter A"}, {value: 2, label: "Letter B"}, {value: 3, label: "Letter C"}], "Choice:", 3));
  page.add(Widgets.put_select("select_group", [{value: 1, label: "Letter A"}, {value: 2, label: "Letter B"}, {value: 3, label: "Letter C"}], "Select:", 2));
  page.add(Widgets.put_checkbox("checkbox_group", [{value: 1, label: "Letter A"}, {value: 2, label: "Letter B"}, {value: 3, label: "Letter C"}], "Check:", 3));
  page.add(Widgets.pin_input("number", "number_input","Number 2:", 2));
  page.add(Widgets.pin_input("number", "number_input_any","Any Number:"));
  page.add(Widgets.pin_input("text", "text_input","Text:", "Something"));  
  page.add(Widgets.pin_input("password", "secret_input","Secret:", "Something"));  
  
  await sleep(10);
// TODO
}

const handler = async (req: Request): Promise<Response> => {
  return handleRequest(req, "Integration Test", pageApp);
}


Deno.serve({ port }, handler);
