function make_environment(env) {
    return new Proxy(env, {
        get(target, prop, receiver) {
            if (env[prop] !== undefined) {
                return env[prop].bind(env);
            }
            return (...args) => {
                throw new Error(`Not implemented: ${prop} ${args}`);
            }
        }
    });
}

function cstrLength(mem, ptr) {
  let len = 0;
  while (mem[ptr] != 0) {
    len++;
    ptr++;
  }
  return len;
}

function cstrToString(buf, charp) {
  const mem = new Uint8Array(buf);
  const len = cstrLength(mem, charp);
  const bytes = new Uint8Array(buf, charp, len);
  return new TextDecoder().decode(bytes);
}

function createCstr(wasm, str) {
  const nullTerminated = str + "\0";
  const encoded = new TextEncoder().encode(nullTerminated);
  const address = wasm.instance.exports.allocate(encoded.length);
  const arr = new Uint8Array(wasm.instance.exports.memory.buffer, address);
  arr.set(encoded);
  return address;
}

class MewWeb {
  wasm;
  elementTable;
  eventTable;

  constructor() {
    this.wasm = undefined;
    this.elementTable = [];
    this.eventTable = [];
  }

  async start() {
    this.wasm = await WebAssembly.instantiateStreaming(
      fetch("lib.wasm"),
      {
        env: make_environment(this)
      }
    );

    console.log(this.wasm);

    this.wasm.instance.exports.start();

    const app = document.querySelector("div.app");
  }

  log_puts(charp) {
    const str = cstrToString(this.wasm.instance.exports.memory.buffer, charp)
    console.log(str);
  }

  element_get(queryCstr) {
    const query = cstrToString(this.wasm.instance.exports.memory.buffer, queryCstr);
    const element = document.querySelector(query);
    if (!element) return -1;
    const index = this.elementTable.length;
    this.elementTable.push(element);
    return index;
  }

  element_create(elementCstr) {
    const name = cstrToString(this.wasm.instance.exports.memory.buffer, elementCstr);
    const element = document.createElement(name);
    const index = this.elementTable.length;
    this.elementTable.push(element);
    return index;
  }

  element_set_id(elementIndex, idCstr) {
    if (elementIndex >= this.elementTable.length) return;
    const element = this.elementTable[elementIndex];
    const id = cstrToString(this.wasm.instance.exports.memory.buffer, idCstr);
    element.id = id;
  }

  element_append_child(elementIndex, childIndex) {
    if (elementIndex >= this.elementTable.length) return;
    if (childIndex >= this.elementTable.length) return;
    const element = this.elementTable[elementIndex];
    const child = this.elementTable[childIndex];
    element.appendChild(child);
  }

  element_remove_child(elementIndex, childIndex) {
    if (elementIndex >= this.elementTable.length) return;
    if (childIndex >= this.elementTable.length) return;
    const element = this.elementTable[elementIndex];
    const child = this.elementTable[childIndex];
    element.removeChild(child);
  }

  element_set_inner_text(elementIndex, textCstr) {
    if (elementIndex >= this.elementTable.length) return;
    const element = this.elementTable[elementIndex];
    const text = cstrToString(this.wasm.instance.exports.memory.buffer, textCstr);
    element.innerText = text;
  }

  element_set_type(elementIndex, typeCstr) {
    if (elementIndex >= this.elementTable.length) return;
    const element = this.elementTable[elementIndex];
    const type = cstrToString(this.wasm.instance.exports.memory.buffer, typeCstr);
    element.type = type;
  }

  element_set_callback(elementIndex, eventCstr, callbackPtr, argPtr) {
    if (elementIndex >= this.elementTable.length) return;
    const element = this.elementTable[elementIndex];

    const event = cstrToString(this.wasm.instance.exports.memory.buffer, eventCstr);
    const callback = this.wasm.instance.exports.__indirect_function_table.get(callbackPtr);

    element.addEventListener(event, (e) => {
      const index = this.eventTable.length;
      this.eventTable.push(e);
      callback(index, argPtr);
    });
  }

  element_get_value(elementIndex) {
    if (elementIndex >= this.elementTable.length) return;
    const element = this.elementTable[elementIndex];
    return createCstr(this.wasm, element.value);
  }

  element_set_value(elementIndex, valueCstr) {
    if (elementIndex >= this.elementTable.length) return;
    const element = this.elementTable[elementIndex];
    element.value = cstrToString(this.wasm.instance.exports.memory.buffer, valueCstr);
  }

  event_prevent_default(eventIndex) {
    if (eventIndex >= this.eventTable.length) return;
    const event = this.eventTable[eventIndex];
    event.preventDefault();
  }
}

async function main() {
  const l = new MewWeb();
  await l.start();
}

main()
