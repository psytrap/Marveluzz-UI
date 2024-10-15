import { Application } from "jsr:@oak/oak/application";
import { Router } from "jsr:@oak/oak/router";
import { handleRequest, Page, Widgets } from "../../mod.ts";
import { sleep } from "https://deno.land/x/sleep/mod.ts"


const port: number = 8080;

function callback() {
  console.log("Thankyou for clicking!");
}

async function pageApp(page: Page) {
  page.add(Widgets.put_text("TEXT"));
  page.add(Widgets.put_button("Click me!", callback));
  page.add(Widgets.put_text("TEXT"));
  page.add(Widgets.put_input("number", "number_input", "Number:"));
  page.add(Widgets.put_scope("COLUMN_TEST", "column"));
  page.add(Widgets.put_input("number", "number_input_a", "Number:", 99));
  page.add(Widgets.put_input("number", "number_input_b", "Number:", undefined, "COLUMN_TEST"));
  page.useScope();
  page.add(Widgets.put_markdown("# Markdown Test\nText Body"));
  page.add(Widgets.put_table([["1", "2", "3"], ["4", "5", "6", "7"], ["8", "9", "10"]], ["abc", "def", "hij"]));
  page.add(Widgets.put_table([["1", undefined, "3"], ["4", Widgets.span("5", 2, 1), "6", "7"], ["8", "9", "10"]]));
  page.add(Widgets.put_radio("radio_group", [{ value: 1, label: "Letter A" }, { value: 2, label: "Letter B" }, { value: 3, label: "Letter C" }], "Choice:", 3));
  page.add(Widgets.put_select("select_group", [{ value: 1, label: "Letter A" }, { value: 2, label: "Letter B" }, { value: 3, label: "Letter C" }], "Select:", 2));
  page.add(Widgets.put_checkbox("checkbox_group", [{ value: 1, label: "Letter A" }, { value: 2, label: "Letter B" }, { value: 3, label: "Letter C" }], "Check:", 3));
  page.add(Widgets.put_input("number", "number_input_value", "Number 2:", 2));
  page.add(Widgets.put_input("number", "number_input_any", "Any Number:"));
  page.add(Widgets.put_input("text", "text_input", "Text:", "Something"));
  page.add(Widgets.put_input("password", "secret_input", "Secret:", "Something"));
  page.add(Widgets.put_scope("REMOVE"));
  page.add(Widgets.put_text("will be removed"))
  page.useScope();
  page.add(Widgets.put_text("will not be removed"))
  await sleep(3);
  page.removeScope("REMOVE");
  page.add(Widgets.put_textarea("textarea", "Eingabebox:"));
  page.add(Widgets.put_image(evil));
  console.log("setvalue(666)")
  page.setValue<number>("number_input", 666);
  console.log(await page.getValue<number>("number_input"));

  // TODO get set Radio/Combo/Checkbox

  await sleep(10);
}

const handler = async (req: Request): Promise<Response> => {
  return handleRequest(req, "Integration Test", pageApp);
}


Deno.serve({ port }, handler);



const evil: string = "data:image/jpeg;base64,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"