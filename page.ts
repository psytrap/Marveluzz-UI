import { CallbackRegistry } from "./callback-registery.ts"

// TODO strict command Object interface definitions

export class Page {
    private socket: WebSocket;
    private callbacks: CallbackRegistry;
    constructor(socket: WebSocket) {
        this.socket = socket;
        this.callbacks = new CallbackRegistry();
        socket.onmessage = (event: MessageEvent) => {
            console.log(`Message from client: ${event.data}`);
            this.handleMessage(event);
            // Echo the message back to the client
            //socket.send(`Server received: ${event.data}`);
        };
    }    
    
    add({ command, callback }: { command: Object, callback?: () => void }): void { 
      if (callback) {
        const callback_id = this.addCallback(command.spec.scope, callback);
        command.spec.callback_id = callback_id;
      }
      this.socket.send(JSON.stringify(command));
    }
  
    addCallback(scope: string, callback: () => void): number {
      return this.callbacks.register(scope, callback);
    }
  
    async pin<T>(name: string): Promise<T> {
      const command = {
        "command": "pin_value",
        "task_id": undefined,
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
        this.socket.send(JSON.stringify(command));
      });
    }  
  
    handleMessage(event: MessageEvent): void {
      const data = JSON.parse(event.data);
      //console.log(data);
  
      if (data.event === "callback") {
        const callback_id = data.task_id
        if (typeof callback_id !== "number") {
          throw new TypeError("task_id must be a number");
        }
        this.callbacks.trigger(callback_id);
      } else if (data.event === "js_yield") {
        // Empty
      }
    }

}