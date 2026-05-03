declare module 'v86' {
  export interface BusConnector {
    pair: BusConnector;

    register(
      name: string,
      fn: (frame: Uint8Array) => void,
      this_value: any
    ): void;
    unregister(name: string, fn: (frame: Uint8Array) => void): void;
    send(name: string, value: any): void;
    send_async(name: string, value: any): void;
  }

  export interface V86StarterOptions {
    wasm_path?: string;
    bios?: {
      url: string;
    };
    cdrom?: {
      url: string;
    };
    filesystem?: {};
    cmdline?: string;
    autostart?: boolean;
    disable_keyboard?: boolean;
  }

  export class V86 {
    bus: BusConnector;
    add_listener(event: string, listener: (data: any) => void): void;
    add_listener(
      event: 'serial0-output-byte',
      listener: (byte: number) => void
    ): void;
    remove_listener(event: string, listener: (data: any) => void): void;
    serial0_send(data: string): void;
    stop(): Promise<void>;
    destroy(): Promise<void>;
    restart(): Promise<void>;
    constructor(options: V86StarterOptions);
  }
}
