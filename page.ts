import { CallbackRegistry } from "./callback-registery.ts"
import { outputCommandInterface, Widgets } from "./widgets.ts"


class TreeNode<T> {
  parent: TreeNode<T> | undefined;
  item: T;
  children: TreeNode<T>[];

  constructor(item: T, parent: TreeNode<T> | undefined = undefined) {
    this.item = item;
    this.children = [];
    this.parent = parent;
  }

  addChild(child: TreeNode<T>): void {
    this.children.push(child);

  }
  get(): T {
    return this.item;
  }


  findChild(item: T): TreeNode<T> | undefined {
    if (this.equals(item)) {
      return this;
    }
    for (const child of this.children) {
      if (child.equals(item)) {
        return child; // Return the matched child
      } else {
        const foundInDescendants = child.findChild(item); // Recursively search in descendants
        if (foundInDescendants) {
          return foundInDescendants; // Return the match found in descendants
        }
      }
    }
    return undefined; // Return undefined if no match is found and returned
  }

  equals(item: T): boolean {
    return item === this.item;
  }

  remove() {
    if (this.parent !== undefined) {
      // remove from Callback registery
      this.parent.removeChild(this.item);
    }
  }

  removeChild(item: T) { //}, callback: () => void) {
    this.children = this.children.filter(child => {
      if (child.equals(item)) {
        return false;
      } else {
        return true;
      }
    });
  }

  removeAllChildren(): void {
    for (const child of this.children) {
      child.removeAllChildren();
      child.remove();
    }
  }
}

// Scope management? Callbacks
const SCOPE_PREFIX: string = "pywebio-scope-";

export class Page {

  private socket: WebSocket;
  private callbacks: CallbackRegistry;
  private scopeRoot: TreeNode<string>; // TODO ?
  private currentScope: TreeNode<string>;

  constructor(socket: WebSocket) {
    this.scopeRoot = new TreeNode<string>("ROOT");
    this.currentScope = this.scopeRoot;
    this.socket = socket;
    this.callbacks = new CallbackRegistry();
    socket.onmessage = (event: MessageEvent) => {
      //console.log(`Message from client: ${event.data}`);
      this.handleMessage(event);
    };
  }

  add({ command, callback }: { command: outputCommandInterface, callback?: () => void }): void {
    //console.log(command);
    let scope: string;
    if (command.spec.scope === undefined) { // We manage scope here we ensure command.spec.scope exists
      scope = command.spec.scope = this.currentScope.get();
    } else {
      const matchedScope = this.scopeRoot.findChild(command.spec.scope);
      if (matchedScope === undefined) {
        return; // Just ignore if scope does not exist - In the future there might be 
      }
      scope = matchedScope.get();
    }

    if (callback) {
      const callback_id = this.addCallback(command.spec.scope, callback);
      command.spec.callback_id = callback_id;
    }

    // type scope specific handling
    const type = command.spec.type;
    if (type === "scope" && command.spec.dom_id !== undefined) { // pre-process scope command
      const find_scope = this.scopeRoot.findChild(command.spec.dom_id);
      if (find_scope !== undefined) {
        this.currentScope = find_scope; // TODO inconsitent in case scope exist but with a different context scope -> add check
        return // just update the current scope
      }
      const context_scope = this.scopeRoot.findChild(scope);
      this.currentScope = new TreeNode<string>(command.spec.dom_id)
      context_scope?.addChild(this.currentScope);
      command.spec.dom_id = Page.scope2dom(command.spec.dom_id);
    } else {
      if (type === "scope") {
        return;
      }
    }
    command.spec.scope = "#" + Page.scope2dom(scope);
    //console.log(command);
    this.socket.send(JSON.stringify(command));
  }

  useScope(name: string | undefined = undefined) {
    if (name === undefined) {
      this.currentScope = this.scopeRoot;
    } else {
      const find_scope = this.scopeRoot.findChild(name);
      if (find_scope === undefined) {
        return;
      } else {
        this.currentScope = find_scope;
      }
    }
    this.add(Widgets.put_scope(this.currentScope.get(), undefined))
  }

  removeScope(name: string) { // TODO, clear: boolean = false) {
    const find_scope = this.scopeRoot.findChild(name);
    if (find_scope === undefined) {
      return // TODO Error handling?
    }
    find_scope.remove();
    if (this.scopeRoot.findChild(this.currentScope.get()) === undefined) {
      // TODO bug remove doesn't reset scope
      this.currentScope = this.scopeRoot; // reset currentScope if currentScope has been removed
    }

    const command = Widgets.remove_scope("#" + Page.scope2dom(name));
    //console.log(command);
    this.socket.send(JSON.stringify(command));

  }

  addCallback(scope: string, callback: () => void): number {
    return this.callbacks.register(scope, callback);
  }

  setValue<T>(name: string, value: T) {
    //send_msg('pin_update', spec=dict(name=name, attributes={"value": value}))
    const command = {
      command: "pin_update",
      task_id: "",
      spec: {
        name: name,
        attributes: {
          value: value
        }
      }
    };
    this.socket.send(JSON.stringify(command));
  }

  async getValue<T>(name: string): Promise<T> {
    const command = {
      "command": "pin_value",
      "task_id": "",
      "spec": {
        "name": name
      }
    };
    return new Promise((resolve, reject) => {
      const messageHandler = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event === "js_yield") {
            this.socket.removeEventListener('message', messageHandler);
            resolve(data.data.value);
          }
        } catch (error) {
          this.socket.removeEventListener('message', messageHandler);
          reject(error);
        }
      };
      this.socket.addEventListener("message", messageHandler);
      //console.log(command);
      this.socket.send(JSON.stringify(command));
    });
  }

  handleMessage(event: MessageEvent): void {
    const data = JSON.parse(event.data);
    //console.log(data);

    if (data.event === "callback") {
      const callback_id = data.task_id
      if (typeof callback_id !== "number") {
        throw new TypeError("task_id/callback_id must be a number");
      }
      this.callbacks.trigger(callback_id);
    } else if (data.event === "js_yield") {
      // Empty
    }
  }
  
  setFocus(name: string) {
    const command = {
      command: "run_script",
      task_id: "",
      spec: {
        code: `document.querySelector('[id^="${name}-"]').focus();`, // a bit hacky but works
        eval: false
      }
    }
    this.socket.send(JSON.stringify(command));
  }

  async wait_for_close(): Promise<CloseEvent> {
    return new Promise((resolve) => {
      let close_listener = (event: CloseEvent) => {
        this.socket.removeEventListener("close", close_listener);
        resolve(event);

      }

      this.socket.addEventListener('close', close_listener);
    });
  }
  private static scope2dom(scope: string): string {
    return SCOPE_PREFIX + scope;
  }

}



/*

TODO - Future way to implement scope handling

class ResourceContext {
  private resourceStack: string[] = [];

  push(resource: string) {
      this.resourceStack.push(resource);
      console.log(`Acquired resource: ${resource}`);
  }

  pop() {
      const resource = this.resourceStack.pop();
      if (resource) {
          console.log(`Released resource: ${resource}`);
      }
  }

  // Helper method to mimic "with" behavior
  use(resource: string, callback: () => void) {
      this.push(resource);
      try {
          callback();
      } finally {
          this.pop();
      }
  }
}

// Usage
const context = new ResourceContext();

context.use('Resource1', () => {
  console.log('Using Resource1');
  // Do something with Resource1

  // You could even nest resources
  context.use('Resource2', () => {
      console.log('Using Resource2');
      // Do something with Resource2
  });

  // Resource2 is released automatically here
});

// Resource1 is released automatically here
*/
