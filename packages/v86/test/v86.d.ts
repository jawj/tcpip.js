declare module 'v86' {
  export interface BusConnector {
    pair: BusConnector;

    register(
      name: string,
      fn: (frame: Uint8Array) => void,
      // biome-ignore lint/suspicious/noExplicitAny: matches v86 API
      this_value: any
    ): void;
    unregister(name: string, fn: (frame: Uint8Array) => void): void;
    // biome-ignore lint/suspicious/noExplicitAny: matches v86 API
    send(name: string, value: any): void;
    // biome-ignore lint/suspicious/noExplicitAny: matches v86 API
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
    // biome-ignore lint/complexity/noBannedTypes: matches v86 API
    filesystem?: {};
    cmdline?: string;
    autostart?: boolean;
    disable_keyboard?: boolean;
  }

  export class V86 {
    bus: BusConnector;
    // biome-ignore lint/suspicious/noExplicitAny: matches v86 API
    add_listener(event: string, listener: (data: any) => void): void;
    add_listener(
      event: 'serial0-output-byte',
      listener: (byte: number) => void
    ): void;
    // biome-ignore lint/suspicious/noExplicitAny: matches v86 API
    remove_listener(event: string, listener: (data: any) => void): void;
    serial0_send(data: string): void;
    stop(): Promise<void>;
    destroy(): Promise<void>;
    restart(): Promise<void>;
    constructor(options: V86StarterOptions);
  }
}
