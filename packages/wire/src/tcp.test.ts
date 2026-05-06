import { describe, expect, it } from 'vitest';
import { serializeIPv4PseudoHeader } from './ipv4.js';
import {
  TCP_HEADER_MIN_LENGTH,
  type TcpSegment,
  parseTcpSegment,
  serializeTcpSegment,
} from './tcp.js';

describe('parseTcpSegment', () => {
  it('should parse a valid TCP segment', () => {
    const data = new Uint8Array([
      0x00,
      0x50, // sourcePort: 80
      0x01,
      0xbb, // destinationPort: 443
      0x00,
      0x00,
      0x00,
      0x01, // sequenceNumber: 1
      0x00,
      0x00,
      0x00,
      0x02, // acknowledgmentNumber: 2
      0x50,
      0x12, // dataOffset: 5 (20 bytes), flags: ACK, SYN
      0x04,
      0x00, // windowSize: 1024
      0x88,
      0xcf, // checksum: 0x88CF
      0x00,
      0x00, // urgentPointer: 0
      0xde,
      0xad,
      0xbe,
      0xef, // payload
    ]);

    const result = parseTcpSegment(
      data,
      serializeIPv4PseudoHeader({
        sourceIP: '192.168.1.1',
        destinationIP: '192.168.1.2',
        protocol: 'tcp',
        length: data.length,
      })
    );

    expect(result).toEqual({
      sourcePort: 80,
      destinationPort: 443,
      sequenceNumber: 1,
      acknowledgmentNumber: 2,
      dataOffset: 20,
      reserved: 0,
      flags: {
        urg: false,
        ack: true,
        psh: false,
        rst: false,
        syn: true,
        fin: false,
      },
      windowSize: 1024,
      urgentPointer: 0,
      options: new Uint8Array([]),
      payload: new Uint8Array([0xde, 0xad, 0xbe, 0xef]),
    });
  });

  it('should handle TCP options', () => {
    const data = new Uint8Array([
      0x00,
      0x50, // sourcePort: 80
      0x01,
      0xbb, // destinationPort: 443
      0x00,
      0x00,
      0x00,
      0x01, // sequenceNumber: 1
      0x00,
      0x00,
      0x00,
      0x02, // acknowledgmentNumber: 2
      0x60,
      0x12, // dataOffset: 6 (24 bytes), flags: ACK, SYN
      0x04,
      0x00, // windowSize: 1024
      0x71,
      0x13, // checksum: 0x7113
      0x00,
      0x00, // urgentPointer: 0
      0x02,
      0x04,
      0x05,
      0xb4, // MSS option: 1460
      0xde,
      0xad,
      0xbe,
      0xef, // payload
    ]);

    const result = parseTcpSegment(
      data,
      serializeIPv4PseudoHeader({
        sourceIP: '192.168.1.1',
        destinationIP: '192.168.1.2',
        protocol: 'tcp',
        length: data.length,
      })
    );

    expect(result).toEqual({
      sourcePort: 80,
      destinationPort: 443,
      sequenceNumber: 1,
      acknowledgmentNumber: 2,
      dataOffset: 24,
      reserved: 0,
      flags: {
        urg: false,
        ack: true,
        psh: false,
        rst: false,
        syn: true,
        fin: false,
      },
      windowSize: 1024,
      urgentPointer: 0,
      options: new Uint8Array([0x02, 0x04, 0x05, 0xb4]),
      payload: new Uint8Array([0xde, 0xad, 0xbe, 0xef]),
    });
  });

  it('should handle an empty payload', () => {
    const data = new Uint8Array([
      0x00,
      0x50, // sourcePort: 80
      0x01,
      0xbb, // destinationPort: 443
      0x00,
      0x00,
      0x00,
      0x01, // sequenceNumber: 1
      0x00,
      0x00,
      0x00,
      0x02, // acknowledgmentNumber: 2
      0x50,
      0x10, // dataOffset: 5 (20 bytes), flags: ACK
      0x04,
      0x00, // windowSize: 1024
      0x26,
      0x73, // checksum: 0x2673
      0x00,
      0x00, // urgentPointer: 0
    ]);

    const result = parseTcpSegment(
      data,
      serializeIPv4PseudoHeader({
        sourceIP: '192.168.1.1',
        destinationIP: '192.168.1.2',
        protocol: 'tcp',
        length: data.length,
      })
    );

    expect(result).toEqual({
      sourcePort: 80,
      destinationPort: 443,
      sequenceNumber: 1,
      acknowledgmentNumber: 2,
      dataOffset: 20,
      reserved: 0,
      flags: {
        urg: false,
        ack: true,
        psh: false,
        rst: false,
        syn: false,
        fin: false,
      },
      windowSize: 1024,
      urgentPointer: 0,
      options: new Uint8Array([]),
      payload: new Uint8Array([]),
    });
  });

  it('should throw an error if segment is too short', () => {
    const data = new Uint8Array([0x00, 0x50, 0x01]); // Only 3 bytes

    expect(() => parseTcpSegment(data)).toThrow('tcp segment too short');
  });

  it('should throw an error if data offset is invalid', () => {
    const data = new Uint8Array([
      0x00,
      0x50, // sourcePort: 80
      0x01,
      0xbb, // destinationPort: 443
      0x00,
      0x00,
      0x00,
      0x01, // sequenceNumber: 1
      0x00,
      0x00,
      0x00,
      0x02, // acknowledgmentNumber: 2
      0x30,
      0x10, // dataOffset: 3 (12 bytes - invalid), flags: ACK
      0x04,
      0x00, // windowSize: 1024
      0x50,
      0x72, // checksum: 0x5072
      0x00,
      0x00, // urgentPointer: 0
    ]);

    expect(() => parseTcpSegment(data)).toThrow('invalid tcp data offset');
  });
});

describe('serializeTcpSegment', () => {
  it('should serialize a TCP segment without options', () => {
    const segment: TcpSegment = {
      sourcePort: 80,
      destinationPort: 443,
      sequenceNumber: 1,
      acknowledgmentNumber: 2,
      dataOffset: 20,
      reserved: 0,
      flags: {
        urg: false,
        ack: true,
        psh: false,
        rst: false,
        syn: true,
        fin: false,
      },
      windowSize: 1024,
      urgentPointer: 0,
      options: new Uint8Array([]),
      payload: new Uint8Array([0xde, 0xad, 0xbe, 0xef]),
    };

    const pseudoHeader = {
      sourceIP: '192.168.1.1',
      destinationIP: '192.168.1.2',
      protocol: 'tcp',
      length: TCP_HEADER_MIN_LENGTH + segment.payload.length,
    } as const;

    const result = serializeTcpSegment(segment, pseudoHeader);

    // Parse the serialized segment to verify
    const parsed = parseTcpSegment(
      result,
      serializeIPv4PseudoHeader(pseudoHeader)
    );
    expect(parsed).toEqual(segment);
  });

  it('should serialize a TCP segment with options', () => {
    const segment: TcpSegment = {
      sourcePort: 80,
      destinationPort: 443,
      sequenceNumber: 1,
      acknowledgmentNumber: 2,
      dataOffset: 24,
      reserved: 0,
      flags: {
        urg: false,
        ack: true,
        psh: false,
        rst: false,
        syn: true,
        fin: false,
      },
      windowSize: 1024,
      urgentPointer: 0,
      options: new Uint8Array([0x02, 0x04, 0x05, 0xb4]), // MSS option: 1460
      payload: new Uint8Array([0xde, 0xad, 0xbe, 0xef]),
    };

    const pseudoHeader = {
      sourceIP: '192.168.1.1',
      destinationIP: '192.168.1.2',
      protocol: 'tcp',
      length:
        TCP_HEADER_MIN_LENGTH + segment.options.length + segment.payload.length,
    } as const;

    const result = serializeTcpSegment(segment, pseudoHeader);

    // Parse the serialized segment to verify
    const parsed = parseTcpSegment(
      result,
      serializeIPv4PseudoHeader(pseudoHeader)
    );
    expect(parsed).toEqual(segment);
  });

  it('should calculate correct checksum when pseudo-header is provided', () => {
    const segment: TcpSegment = {
      sourcePort: 80,
      destinationPort: 443,
      sequenceNumber: 1,
      acknowledgmentNumber: 2,
      dataOffset: 20,
      reserved: 0,
      flags: {
        urg: false,
        ack: true,
        psh: false,
        rst: false,
        syn: false,
        fin: false,
      },
      windowSize: 1024,
      urgentPointer: 0,
      options: new Uint8Array([]),
      payload: new Uint8Array([]),
    };

    const pseudoHeader = {
      sourceIP: '192.168.1.1',
      destinationIP: '192.168.1.2',
      protocol: 'tcp',
      length: TCP_HEADER_MIN_LENGTH,
    } as const;

    const result = serializeTcpSegment(segment, pseudoHeader);

    // Verify that parsing with checksum validation doesn't throw
    expect(() =>
      parseTcpSegment(result, serializeIPv4PseudoHeader(pseudoHeader))
    ).not.toThrow();
  });
});
