import * as ws from 'ws';

interface NodeWebSocketEvent {
    type: string;
    data?: any;
    // Add other properties your Node.js events might have
}

// Define a utility type for event types
type EventType = 'message' | 'open' | 'close' | 'error';

export class WebSocketAdapter {
    private ws: ws.WebSocket;
    private listeners: { [type: string]: { listener: (event: Event) => void; eventType: string }[] } = {};


    constructor(ws: ws.WebSocket) {
        this.ws = ws;

        // Adapt 'ws' events to standard WebSocket events
        this.ws.on('open', () => this.dispatchEvent(new Event('open')));
        this.ws.on('message', (data) => this.dispatchEvent(new MessageEvent('message', { data }) as Event));
        this.ws.on('error', (error) => this.dispatchEvent(new Event('error')));
        this.ws.on('close', (code, reason) =>
            this.dispatchEvent(new Event('close')));
        /* TODO not supported by NodeJS, {
                code: code as number, // Assert code as number
                reason: reason ? reason.toString() : '' // Convert reason to string 
            }))
        );*/
    }

    send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
        if (data instanceof Blob) {
            // Convert Blob to ArrayBuffer before sending
            const reader = new FileReader();
            reader.onload = () => {
                this.ws.send(reader.result as ArrayBuffer);
            };
            reader.readAsArrayBuffer(data);
        } else {
            this.ws.send(data as any); // Use type assertion for other types
        }
    }

    close(code?: number, reason?: string): void {
        this.ws.close(code, reason);
    }

    // Basic event listener functionality
    addEventListener<T extends Event>(type: string, listener: (event: T) => void): void {
        if (!this.listeners[type]) {
            this.listeners[type] = [];
        }
        //this.listeners[type].push(listener);
        this.listeners[type].push({ listener: listener as (event: Event) => void, eventType: type });

        //if (type === 'message') {
        //  this.onmessage = listener as (this: WebSocket, ev: MessageEvent<any>) => any; 
        //} else {
        //this.ws.on(type, listener);
        // }
    }

    removeEventListener<T extends Event>(type: string, listener: (event: T) => void): void {
        if (this.listeners[type]) {
            this.listeners[type] = this.listeners[type].filter(l => (l.listener !== listener as (event: Event) => void && l.eventType !== type));
        }
    }


    /*
        private nodeEventToBrowserEvent(nodeEvent: NodeWebSocketEvent, type: EventType): Event {
            let browserEvent: Event;
    
            switch (type) {
                case 'message':
                    browserEvent = new MessageEvent(type, { data: nodeEvent.data });
                    break;
                case 'close':
                    // For close events, you might want to extract code and reason
                    const { code, reason } = nodeEvent as { code: number; reason: string };
                    browserEvent = new CloseEvent(type, { code, reason });
                    break;
                default:
                    // For other events, create a generic Event
                    browserEvent = new Event(type);
            }
    
            return browserEvent;
        }*/

    // Basic dispatchEvent for emitting events
    dispatchEvent(event: Event): boolean {
        const listeners = this.listeners[event.type];
        listeners.forEach(listener => listener.listener(event));
        return true;
    }
    // ... (rest of the class remains the same as before)
}