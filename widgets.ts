

const ROOT_SCOPE: string = "pywebio-scope-ROOT";

type EmptyString = "";

// TODO export in addition to internal use
interface outputInterface {
    type: string,
    position: number,
    scope: string,
    callback_id?: number,
    dom_id?: string,
    style?: string,
    content?: string,
    contents?: [],
    input?: {
        "type": string,
        "label": string,
        "name": string,
        "value": number | string
    }
    buttons?: [{
        label: string
    }]
}

export interface outputCommandInterface {
    command: string,
    task_id: EmptyString,
    spec: outputInterface
}


interface createWidgetsInterface {
    command: outputCommandInterface,
    callback?: () => void
}

export class Widgets {
    static put_grid_scope(flow: "row" | "column", name: string, scope: string | undefined = undefined, position: number = -1): createWidgetsInterface { // content: [createWidgetsInterface],
        let type = "scope";
        scope = this.scope(scope);
        const command: outputCommandInterface = {
            "command": "output",
            "task_id": "",
            "spec": {
                "type": type,
                "scope": scope,
                "position": position,
                "dom_id": name,
                "style": `display: grid; gap: 10px; grid-auto-flow: ${flow};`, // TODO Workaround: inline style
                "contents": []
            }
        }
        return { command: command };
    }

    static put_text(text: string, scope: string | undefined = undefined, position: number = -1): createWidgetsInterface {
        return this.put_output("text", text, scope, position)
    }

    static put_scope(name: string, scope: string | undefined = undefined, position: number = -1): createWidgetsInterface {
        let type = "scope";
        scope = this.scope(scope);
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
        return { command: command };
    }

    static pin_input(type: string,
        name: string,
        label: string,
        scope: string | undefined = undefined,
        position: number = -1) : createWidgetsInterface {
        const output_type = "pin";
        scope = this.scope(scope);
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
                    "name": name,
                    "value": 3
                }//,
                //"content": []
            }
        };
        return { command: command };
    }

    static put_button(name: string, callback: () => void, scope: string | undefined = undefined, position: number = -1): createWidgetsInterface {
        let type = "buttons";
        scope = this.scope(scope);
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

    private static put_output(type: string, content: string, scope: string | undefined = undefined, position: number = -1): createWidgetsInterface {
        scope = this.scope(scope);
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

    private static scope(scope: string | undefined): string {
        if (scope === undefined || scope === "") { // TODO how to handle "" correctly?
            return `#${ROOT_SCOPE}`;
        } else {
            return `#${scope}`;
        }

    }
}