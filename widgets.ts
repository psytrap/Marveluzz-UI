

const ROOT_SCOPE: string = "pywebio-scope-ROOT";

type EmptyString = "";

// TODO export in addition to internal use
interface spanInterface {
    [key: string]: { row?: number; col?: number }
}

interface outputInterface {
    type: string,
    position: number,
    scope?: string,
    callback_id?: number,
    dom_id?: string,
    style?: string,
    content?: string,
    contents?: [],
    span?: spanInterface,
    input?: {
        "type": string,
        "label": string,
        "name": string,
        options?: { value: number | string, label: string }[],
        value?: number | string,
        rows?: number
    },
    buttons?: [{
        label: string
    }],
    data?: string[][]
}

export interface outputCommandInterface {
    command: string,
    task_id: EmptyString,
    spec: outputInterface
}

export interface outputCtlCommandInterface {
    command: string,
    task_id: EmptyString,
    spec: scopeInterface
}

export interface scopeInterface {
    set_scope?: string,
    position?: number,
    if_exist?: string,
    container?: string,
    clear?: string,
    remove?: string
}

export interface createWidgetsInterface {
    command: outputCommandInterface,
    callback?: () => void
}

type spanElement = { row: number; column: number; text: string };
type header = (string | spanElement | undefined)[];
type table = (string | spanElement | undefined)[][];



export class Widgets {
    static span(text, columns = 1, rows = 1): spanElement {
        return { "text": text, "row": rows, "column": columns };
    }
    static put_table(table: table, header: header | undefined = undefined, scope: string | undefined = undefined, position: number = -1): createWidgetsInterface {
        let span: spanInterface = {};
        let stringTable: string[][] = [];

        if (header !== undefined) {
            let headerRow: string[] = [];
            header.forEach((element, index) => {
                if (typeof element === "string") {
                    headerRow.push(element);
                } else if (element !== undefined) {
                    span[`0,${index}`] = { "row": element.row, "col": element.column };
                    headerRow.push(element.text);
                } else {
                    headerRow.push("");
                }
            });
            stringTable.push(headerRow);
        } else {
            stringTable.push([]);
        }
        table.forEach((row, rowIndex) => {
            let stringRow: string[] = [];
            row.forEach((element, colIndex) => {
                if (typeof element === "string") {
                    stringRow.push(element);
                } else if (element !== undefined) {
                    span[`${rowIndex + 1},${colIndex}`] = { "row": element.row, "col": element.column };
                    stringRow.push(element.text);
                } else {
                    stringRow.push("");
                }
            });
            stringTable.push(stringRow);
        });

        const command: outputCommandInterface = {
            "command": "output",
            "task_id": "",
            "spec": {
                "type": "table",
                "scope": scope,
                "position": position,
                "data": stringTable,
                "span": span
            }
        };


        return { command: command };
    }
    static put_markdown(md_content: string, scope: string | undefined = undefined, position: number = -1): createWidgetsInterface {
        return this.put_output("markdown", md_content, scope, position);
    }
    static put_text(text: string, scope: string | undefined = undefined, position: number = -1): createWidgetsInterface {
        return this.put_output("text", text, scope, position);
    }
    static put_scope(name: string | undefined, flow: "row" | "column" | undefined = undefined, scope: string | undefined = undefined, position: number = -1): createWidgetsInterface { // content: [createWidgetsInterface],
        let type = "scope";
        const command: outputCommandInterface = {
            "command": "output",
            "task_id": "",
            "spec": {
                "type": type,
                "scope": scope,
                "position": position,
                "dom_id": name,
                "contents": []
            }
        }
        if ( flow !== undefined) {
            command.spec.style = `display: grid; gap: 10px; grid-auto-flow: ${flow};`; // TODO Workaround: inline style
        }
        return { command: command };
    }

    static use_scope(name: string, scope: string | undefined = undefined) {
        const command: outputCtlCommandInterface = {
            "command": "output_ctl",
            "task_id": "",
            "spec": {
                set_scope: name,
                container: scope
            }
        }
        return command;

    }
    static remove_scope(name: string | undefined): outputCtlCommandInterface {
        const command: outputCtlCommandInterface = {
            "command": "output_ctl",
            "task_id": "",
            "spec": {
                remove: name
            }
        }
        return command;
    }

    static put_radio(name: string, options: { value: number, label: string }[], label: string, value: number, scope: string | undefined = undefined, position: number = -1): createWidgetsInterface {
        const type = "radio";
        return this.put_radio_select_checkbox(type, name, options, label, value, scope, position);
    }

    static put_select(name: string, options: { value: number, label: string }[], label: string, value: number, scope: string | undefined = undefined, position: number = -1): createWidgetsInterface {
        const type = "select";
        return this.put_radio_select_checkbox(type, name, options, label, value, scope, position);
    }
    // TODO multi-check, value not working as string?
    static put_checkbox(name: string, options: { value: number, label: string }[], label: string, value: number, scope: string | undefined = undefined, position: number = -1): createWidgetsInterface {
        const type = "checkbox";
        return this.put_radio_select_checkbox(type, name, options, label, value, scope, position);
    }


    private static put_radio_select_checkbox(type: string, name: string, options: { value: number, label: string }[], label: string, value: number, scope: string | undefined = undefined, position: number = -1): createWidgetsInterface {
        const output_type = "pin";
        const command: outputCommandInterface = {
            "command": "output",
            "task_id": "",
            "spec": {
                "type": output_type,
                "scope": scope,
                "position": position,
                "input": {
                    "type": type,
                    "label": label,
                    "options": options,
                    "name": name, // DOM ID
                    "value": value
                }//,
                //"content": []
            }
        };
        return { command: command };
    }

    // type text,number,password
    static pin_input(type: "text" | "number" | "password",
        name: string,
        label: string,
        value: string | number | undefined = "", // TODO undefined?
        scope: string | undefined = undefined,
        position: number = -1): createWidgetsInterface {
        const output_type = "pin";
        const command: outputCommandInterface = {
            "command": "output",
            "task_id": "",
            spec: {
                "type": output_type,
                "scope": scope,
                "position": position,
                input: {
                    "type": type,
                    "label": label,
                    "name": name, // DOM ID
                    "value": value
                }//,
                //"content": []
            }
        };
        /*
        if (value !== undefined && command.spec !== undefined && command.spec.input !== undefined ) {
            command.spec.input.value = value;
        }*/
        return { command: command };
    }
    static pin_textarea(name: string, label: string, rows: number = 6, value: string = "", scope: string | undefined = undefined, position: number = -1): createWidgetsInterface {
        let type = "textarea";
        const command : outputCommandInterface = {
            "command": "output",
            "task_id": "",
            "spec": {
                "type": "pin",
                "scope": scope,
                "position": position,
                input: {
                    "type": type,
                    "name": name,
                    "label": label,
                    "value": value,
                    "rows": rows,
                }
            }
        };
        return {command: command};


    }

    static put_button(name: string, callback: () => void, scope: string | undefined = undefined, position: number = -1): createWidgetsInterface {
        let type = "buttons";
        const command: outputCommandInterface = {
            "command": "output",
            "task_id": "",
            "spec": {
                "type": type,
                "scope": scope,
                "position": position,
                "buttons": [{ "label": name }],
                "contents": []
            }
        };
        return { command: command, callback: callback };
    }

    static put_image(data: string, title: string = "Undefined", scope: string | undefined = undefined, position: number = -1): createWidgetsInterface {
        // TODO use data URL
        const html_tag = `<img src="${data}" alt="${title}" />`;
        const command : createWidgetsInterface = this.put_output("html", html_tag, scope, position);
        return command;
    }

    private static put_output(type: string, content: string, scope: string | undefined = undefined, position: number = -1): createWidgetsInterface {
        const command: outputCommandInterface = {
            "command": "output",
            "task_id": "",
            "spec": {
                "type": type,
                "scope": scope,
                "position": position,
                "content": content
            }
        };
        return { command: command };
    }

}