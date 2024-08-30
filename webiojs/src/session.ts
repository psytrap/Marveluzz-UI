import {error_alert, randomid, ReliableSender} from "./utils";
import {state} from "./state";
import {t} from "./i18n";

export interface Command {
    command: string
    task_id: string
    spec: any
}

export interface ClientEvent {
    event: string,
    task_id: string,
    data: any
}


/*
* 会话
* 向外暴露的事件：on_session_create、on_session_close、on_server_message
* 提供的函数：start_session、send_message、close_session
* */
export interface Session {
    webio_session_id: string;

    on_session_create(callback: () => void): void;

    on_session_close(callback: () => void): void;

    on_server_message(callback: (msg: Command) => void): void;

    start_session(debug: boolean): void;

    send_message(msg: ClientEvent, onprogress?: (loaded: number, total: number) => void): void;

    send_buffer(data: Blob, onprogress?: (loaded: number, total: number) => void): void;

    close_session(): void;

    closed(): boolean;
}

function safe_poprun_callbacks(callbacks: (() => void)[], name = 'callback') {
    while (callbacks.length)
        try {
            callbacks.pop().call(this);
        } catch (e) {
            console.log('Error in %s: %s', name, e);
        }
}

export class WebSocketSession implements Session {
    ws: WebSocket;
    debug: boolean;
    webio_session_id: string = 'NEW';
    private _closed: boolean; // session logic closed (by `close_session` command)
    private _session_create_ts = 0;
    private _session_create_callbacks: (() => void)[] = [];
    private _session_close_callbacks: (() => void)[] = [];
    private _on_server_message: (msg: Command) => any = () => {
    };

    constructor(public ws_api: string, public app_name: string = 'index') {
        this.ws = null;
        this.debug = false;
        this._closed = false;
    }

    set_ws_api() {
        let url = new URL(this.ws_api);
        if (url.protocol !== 'wss:' && url.protocol !== 'ws:') {
            let protocol = url.protocol || window.location.protocol;
            url.protocol = protocol.replace('https', 'wss').replace('http', 'ws');
        }
        url.search = `?app=${this.app_name}&session=${this.webio_session_id}`;
        this.ws_api = url.href;
    }

    on_session_create(callback: () => any): void {
        this._session_create_callbacks.push(callback);
    };

    on_session_close(callback: () => any): void {
        this._session_close_callbacks.push(callback);
    }

    on_server_message(callback: (msg: Command) => any): void {
        this._on_server_message = callback;
    }

    start_session(debug: boolean = false): void {
        let that = this;

        this.set_ws_api();

        this._session_create_ts = Date.now();
        this.debug = debug;
        this.ws = new WebSocket(this.ws_api);
        this.ws.onopen = () => {
            safe_poprun_callbacks(this._session_create_callbacks, 'session_create_callback');
        };

        this.ws.onclose = function (evt) {
            if (!that._closed && that.webio_session_id != 'NEW') {  // not receive `close_session` command && enabled reconnection
                const session_create_interval = 5000;
                if (Date.now() - that._session_create_ts > session_create_interval)
                    that.start_session(that.debug);
                else
                    setTimeout(() => {
                        that.start_session(that.debug);
                    }, session_create_interval - Date.now() + that._session_create_ts);
            } else {
                that.close_session();
            }
        };
        this.ws.onmessage = function (evt) {
            let msg: Command = JSON.parse(evt.data);
            if (debug) console.info('>>>', JSON.parse(evt.data));
            that._on_server_message(msg);
        };
    }

    start_onprogress(onprogress?: (loaded: number, total: number) => void): void {
        let total = this.ws.bufferedAmount;
        let onprogressID = setInterval(() => {
            let loaded = total - this.ws.bufferedAmount;
            onprogress(loaded, total);
            if (this.ws.bufferedAmount == 0)
                clearInterval(onprogressID);
        }, 200);
    }

    send_message(msg: ClientEvent, onprogress?: (loaded: number, total: number) => void): void {
        if (this.closed())
            return error_alert(t("disconnected_with_server"));

        if (this.ws === null)
            return console.error('WebSocketWebIOSession.ws is null when invoke WebSocketWebIOSession.send_message. ' +
                'Please call WebSocketWebIOSession.start_session first');
        this.ws.send(JSON.stringify(msg));

        if (onprogress)
            this.start_onprogress(onprogress);

        if (this.debug) console.info('<<<', msg);
    }

    send_buffer(data: Blob, onprogress?: (loaded: number, total: number) => void): void {
        if (this.closed())
            return error_alert(t("disconnected_with_server"));

        if (this.ws === null)
            return console.error('WebSocketWebIOSession.ws is null when invoke WebSocketWebIOSession.send_message. ' +
                'Please call WebSocketWebIOSession.start_session first');

        this.ws.send(data);

        if (onprogress)
            this.start_onprogress(onprogress);

        if (this.debug) console.info('<<< Blob data...');
    }

    close_session(): void {
        this._closed = true;
        safe_poprun_callbacks(this._session_close_callbacks, 'session_close_callback');
        try {
            this.ws.close();
        } catch (e) {
        }
    }

    closed(): boolean {
        return this._closed || this.ws.readyState === WebSocket.CLOSED || this.ws.readyState === WebSocket.CLOSING;
    }
}


export class HttpSession implements Session {
    interval_pull_id: number = null;
    webio_session_id: string = '';
    debug = false;

    private sender: ReliableSender = null;
    private _executed_command_msg_id = -1;
    private _closed = false;
    private _session_create_callbacks: (() => void)[] = [];
    private _session_close_callbacks: (() => void)[] = [];
    private _on_server_message: (msg: Command) => void = () => {
    };


    constructor(public api_url: string, app_name = 'index', public pull_interval_ms = 1000) {
        let url = new URL(api_url, window.location.href);
        url.search = "?app=" + app_name;
        this.api_url = url.href;
        this.sender = new ReliableSender(this._send.bind(this));
    }

    on_session_create(callback: () => void): void {
        this._session_create_callbacks.push(callback);
    }

    on_session_close(callback: () => void): void {
        this._session_close_callbacks.push(callback);
    }

    on_server_message(callback: (msg: Command) => void): void {
        this._on_server_message = callback;
    }

    start_session(debug: boolean = false): void {
        this.debug = debug;
        this.webio_session_id = "NEW-" + randomid(24);
        this.pull();
        this.interval_pull_id = setInterval(() => {
            this.pull()
        }, this.pull_interval_ms);
    }

    pull() {
        let that = this;
        $.ajax({
            type: "GET",
            url: `${this.api_url}&ack=${this._executed_command_msg_id}`,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            headers: {"webio-session-id": this.webio_session_id},
            success: function (data: { commands: Command[][], seq: number, event: number, ack: number },
                               textStatus: string, jqXHR: JQuery.jqXHR) {
                safe_poprun_callbacks(that._session_create_callbacks, 'session_create_callback');
                that._on_request_success(data, textStatus, jqXHR);
                if (that.webio_session_id.startsWith("NEW-")) {
                    that.webio_session_id = that.webio_session_id.substring(4);
                }
            }
        })
    }

    private _on_request_success(data: { commands: Command[][], seq: number, ack: number },
                                textStatus: string, jqXHR: JQuery.jqXHR) {
        this.sender.ack(data.ack);

        let msg_start_idx = this._executed_command_msg_id - data.seq + 1;
        if (data.commands.length <= msg_start_idx)
            return;
        this._executed_command_msg_id = data.seq + data.commands.length - 1;

        let sid = jqXHR.getResponseHeader('webio-session-id');
        if (sid)
            this.webio_session_id = sid;

        for (let msgs of data.commands.slice(msg_start_idx)) {
            for (let msg of msgs) {
                if (this.debug) console.info('>>>', msg);
                this._on_server_message(msg);
            }
        }
    };

    send_message(msg: ClientEvent, onprogress?: (loaded: number, total: number) => void): void {
        if (this.debug) console.info('<<<', msg);
        this.sender.add_send_task({
            data: msg,
            json: true,
            onprogress: onprogress,
        })
    }

    send_buffer(data: Blob, onprogress?: (loaded: number, total: number) => void): void {
        if (this.debug) console.info('<<< Blob data...');
        this.sender.add_send_task({
            data: data,
            json: false,
            onprogress: onprogress,
        }, false)
    }

    _send(params: { [key: string]: any; }[], seq: number): Promise<void> {
        if (this.closed()) {
            this.sender.stop();
            error_alert(t("disconnected_with_server"));
            return Promise.reject();
        }
        let data: any, ajax_options: any;
        let json = params.some(p => p.json);
        if (json) {
            data = JSON.stringify(params.map(p => p.data));
            ajax_options = {
                contentType: "application/json; charset=utf-8",
            }
        } else {
            data = params[0].data;
            ajax_options = {
                cache: false,
                processData: false,
                contentType: 'application/octet-stream',
            }
        }
        return new Promise((resolve, reject) => {
            $.ajax({
                data: data,
                ...ajax_options,
                type: "POST",
                url: `${this.api_url}&ack=${this._executed_command_msg_id}&seq=${seq}`,
                dataType: "json",
                headers: {"webio-session-id": this.webio_session_id},
                success: this._on_request_success.bind(this),
                xhr: function () {
                    let xhr = new window.XMLHttpRequest();
                    // Upload progress
                    xhr.upload.addEventListener("progress", function (evt) {
                        if (evt.lengthComputable) {
                            params.forEach(p => {
                                if (p.onprogress) // only the first one
                                    p.onprogress(evt.loaded, evt.total);
                                p.onprogress = null;
                            });
                        }
                    }, false);
                    return xhr;
                },
                error: function () {
                    console.error('Http push event failed, will retry');
                }
            }).always(() => resolve());
        });
    }

    close_session(): void {
        this._closed = true;
        safe_poprun_callbacks(this._session_close_callbacks, 'session_close_callback');
        clearInterval(this.interval_pull_id);
        this.sender.stop();
    }

    closed(): boolean {
        return this._closed;
    }

    change_pull_interval(new_interval: number): void {
        clearInterval(this.interval_pull_id);
        this.pull_interval_ms = new_interval;
        this.interval_pull_id = setInterval(() => {
            this.pull()
        }, this.pull_interval_ms);
    }
}

/*
* Check given `backend_addr` is a http backend
* Usage:
*   // `http_backend` is a boolean to present whether or not a http_backend the given `backend_addr` is
*   is_http_backend('http://localhost:8080/io').then(function(http_backend){ });
* */
export function is_http_backend(backend_addr: string) {
    let url = new URL(backend_addr);
    let protocol = url.protocol || window.location.protocol;
    url.protocol = protocol.replace('wss', 'https').replace('ws', 'http');
    backend_addr = url.href;

    return new Promise(function (resolve, reject) {
        $.get(backend_addr, {test: 1}, undefined, 'html').done(function (data: string) {
            resolve(data === 'ok');
        }).fail(function (e: JQuery.jqXHR) {
            resolve(false);
        });
    });
}


// Send data to backend
export function pushData(data: any, callback_id: string) {
    if (state.CurrentSession === null)
        return console.error("can't invoke PushData when WebIOController is not instantiated");

    state.CurrentSession.send_message({
        event: "callback",
        task_id: callback_id,
        data: data
    });
}