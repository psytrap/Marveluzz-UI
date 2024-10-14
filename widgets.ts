

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
    /**
     * Create a table.
     * @param table
     * A 2D string list representing the table content.
     * @param header
     * A string list representing the headers of each column. No header shown if undefined.
     * @param scope
     * The Name of the scope it will be inserted. Current scope if undefined.
     * @param position
     * The position within the scope.
     * @returns
     * The command to create the widget.
     */
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
    /**
     * Configure a table element to span multiple rows or columns.
     * @param text 
     * @param columns 
     * @param rows 
     * @returns 
     */
    static span(text: string, columns = 1, rows = 1): spanElement {
        return { "text": text, "row": rows, "column": columns };
    }
    /**
     * Create page content based on Mark-Down syntax
     * @param md_content
     * The Mark-Down content
     * @param scope
     * @param position 
     * @returns 
     */
    static put_markdown(md_content: string, scope: string | undefined = undefined, position: number = -1): createWidgetsInterface {
        return this.put_output("markdown", md_content, scope, position);
    }
    /**
     * Add a basic text element to the page.
     * @param text 
     * @param scope 
     * @param position 
     * @returns 
     */
    static put_text(text: string, scope: string | undefined = undefined, position: number = -1): createWidgetsInterface {
        return this.put_output("text", text, scope, position);
    }
    /**
     * Create a scope element.
     * @param name 
     * The name of the scope
     * @param flow
     * The layout how elements get added to the scope.
     * @param scope
     * The parent scope
     * @param position 
     * @returns 
     */
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

    /**
     * Unused
     * @param name
     * @param scope 
     * @returns 
     */
    static use_scope(name: string, scope: string | undefined = undefined):  outputCtlCommandInterface {
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
    /**
     * Command to remove a scope.
     * @param name 
     * Name of the scope.
     * @returns 
     */
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

    /**
     * Create an interactive radio button element.
     * @param name
     * The name of the element used with the getter and setter functions
     * @param options
     * A list of selectable options
     * @param label
     * An anchor label
     * @param value
     * The initial value
     * @param scope 
     * @param position 
     * @returns 
     */

    static put_radio(name: string, options: { value: number, label: string }[], label: string, value: number, scope: string | undefined = undefined, position: number = -1): createWidgetsInterface {
        const type = "radio";
        return this.put_radio_select_checkbox(type, name, options, label, value, scope, position);
    }

    /**
     * Create an interactive pull-down select element.
     * @param name 
     * The name of the element used with the getter and setter functions
     * @param options
     * A list of selectable options
     * @param label 
     * An anchor label
     * @param value 
     * The initial value
     * @param scope 
     * @param position 
     * @returns 
     */
    static put_select(name: string, options: { value: number, label: string }[], label: string, value: number, scope: string | undefined = undefined, position: number = -1): createWidgetsInterface {
        const type = "select";
        return this.put_radio_select_checkbox(type, name, options, label, value, scope, position);
    }
    
    /**
     * Create an interactive list of checkboxes.
     * @param name 
     * The name of the element used with the getter and setter functions
     * @param options 
     * A list of selectable options
     * @param label 
     * An anchor label
     * @param value 
     * The inital value TODO multi-check, value not working as string?
     * @param scope 
     * @param position 
     * @returns 
     */
    static put_checkbox(name: string, options: { value: number, label: string }[], label: string, value: number, scope: string | undefined = undefined, position: number = -1): createWidgetsInterface {
        const type = "checkbox";
        return this.put_radio_select_checkbox(type, name, options, label, value, scope, position);
    }


    /**
     * Common base for radio/select/checkbox
     * @param type
     * @param name 
     * @param options 
     * @param label 
     * @param value 
     * @param scope 
     * @param position 
     * @returns 
     */
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
    /**
     * Create an interactive input field.
     * @param type
     * Type of intput: text, number, password
     * @param name
     * The name of the element used with the getter and setter functions
     * @param label 
     * An anchor label
     * @param value 
     * The inital value
     * @param scope 
     * @param position 
     * @returns 
     */
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
    /**
     * Similar to interactive input but with larger area
     * @param name 
     * @param label 
     * @param rows 
     * @param value 
     * @param scope 
     * @param position 
     * @returns 
     */
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

    /**
     * Create a button element.
     * @param name
     * Display name of the button.
     * @param callback
     * The callback function when the button is clicked.
     * @param scope 
     * @param position 
     * @returns 
     */
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

    /**
     * Create an image element
     * @param data
     * URL reference to the image, data URLs can be used as well.
     * @param title
     * The alternative title as by HTML 
     * @param scope 
     * @param position 
     * @returns 
     */
    static put_image(data: string, title: string = "Undefined", scope: string | undefined = undefined, position: number = -1): createWidgetsInterface {
        // TODO use data URL
        const html_tag = `<img src="${data}" alt="${title}" />`;
        const command : createWidgetsInterface = this.put_output("html", html_tag, scope, position);
        return command;
    }

    /**
     * TODO
     * @param type 
     * @param content 
     * @param scope 
     * @param position 
     * @returns 
     */
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

  
  // TODO Dialog

  // TODO pin_change_event -> callback
  // TODO put_loading
  // TODO slider
