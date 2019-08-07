import EventEmitter from 'eventemitter3';

class Socket extends EventEmitter {
  constructor(config) {
    super();
    this._config = config;
  }

  connect() {
    let socket;
    if (typeof WebSocket === 'undefined') {
      throw new Error(`'WebSocket' is undefined. Do you include any websocket polyfill?`);
    } else if (WebSocket.length === 1) {
      socket = new WebSocket(this._config.url);
    } else {
      const options = {};
      if (this._config.origin)
        options.origin = this._config.origin;
      socket = new WebSocket(this._config.url, options);
    }
    socket.addEventListener('open',  this.emit.bind(this, 'connect'));
    socket.addEventListener('close', this.emit.bind(this, 'disconnect'));
    socket.addEventListener('error', this.emit.bind(this, 'error'));

    let data = [];
    let timeoutHandler;
    socket.binaryType = "arraybuffer";
    socket.addEventListener('message', ({ data: currData }) => {
      clearTimeout(timeoutHandler);
      data.push(...new Uint8Array(currData));
      timeoutHandler = setTimeout(() => {
        this.emit('message', data);
        data = [];
      }, this._config.timeout);
      if (data.byteLength > this._config.blobSize) {
        throw new Error(`Receive message length(${data.byteLength}) greater than buffer size(${this._config.blobSize})`);
      }
    });

    this._socket = socket;
  }

  disconnect() {
    const socket = this._socket;
    socket.close();
  }

  send(str) {
    const socket = this._socket;
    if (socket.readyState == 1 /* OPEN */) {
      socket.send(str);
    }
  }
}

export default Socket;
