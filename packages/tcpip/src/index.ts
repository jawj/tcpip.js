export { createStack, type NetworkStack } from './stack.js';
export type { DuplexStream, NetworkInterface } from './types.js';

export type {
  LoopbackInterface,
  LoopbackInterfaceOptions,
} from './bindings/loopback-interface.js';

export type {
  TunInterface,
  TunInterfaceOptions,
} from './bindings/tun-interface.js';

export type {
  TapInterface,
  TapInterfaceOptions,
} from './bindings/tap-interface.js';

export type {
  BridgeInterface,
  BridgeInterfaceOptions,
} from './bindings/bridge-interface.js';

export type {
  TcpConnection,
  TcpConnectionOptions,
  TcpListener,
  TcpListenerOptions,
} from './bindings/tcp.js';

export type {
  UdpDatagram,
  UdpSocket,
  UdpSocketOptions,
} from './bindings/udp.js';

export { connectStreams } from './util.js';
