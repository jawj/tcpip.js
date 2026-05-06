import { type IPv4PseudoHeader, serializeIPv4PseudoHeader } from './ipv4.js';
import { calculateChecksum } from './util.js';

export type TcpSegment = {
  sourcePort: number;
  destinationPort: number;
  sequenceNumber: number;
  acknowledgmentNumber: number;
  dataOffset: number;
  reserved: number;
  flags: {
    urg: boolean;
    ack: boolean;
    psh: boolean;
    rst: boolean;
    syn: boolean;
    fin: boolean;
  };
  windowSize: number;
  urgentPointer: number;
  options: Uint8Array;
  payload: Uint8Array;
};

export const TCP_HEADER_MIN_LENGTH = 20;

/**
 * Parses a TCP segment into an object.
 *
 * Optionally verifies the TCP checksum if an IP pseudo-header is provided
 * (required for TCP checksum verification).
 */
export function parseTcpSegment(
  data: Uint8Array,
  pseudoHeader?: Uint8Array
): TcpSegment {
  if (data.length < TCP_HEADER_MIN_LENGTH) {
    throw new Error('tcp segment too short');
  }

  const dataView = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const checksum = dataView.getUint16(16);

  // If the IP pseudo-header is provided, verify the TCP checksum
  if (pseudoHeader) {
    // Create buffer for checksum verification (pseudo-header + TCP segment)
    const checksumBuffer = new Uint8Array(pseudoHeader.length + data.length);
    checksumBuffer.set(pseudoHeader);
    checksumBuffer.set(data, pseudoHeader.length);

    if (
      calculateChecksum(checksumBuffer, pseudoHeader.length + 16) !== checksum
    ) {
      throw new Error('invalid tcp checksum');
    }
  } else {
    console.warn(
      'no pseudo header provided: tcp checksum verification skipped'
    );
  }

  const dataOffset = (dataView.getUint8(12) >> 4) * 4;
  if (dataOffset < TCP_HEADER_MIN_LENGTH) {
    throw new Error('invalid tcp data offset');
  }

  const flagsByte = dataView.getUint8(13);
  const options = data.subarray(TCP_HEADER_MIN_LENGTH, dataOffset);
  const payload = data.subarray(dataOffset);

  return {
    sourcePort: dataView.getUint16(0),
    destinationPort: dataView.getUint16(2),
    sequenceNumber: dataView.getUint32(4),
    acknowledgmentNumber: dataView.getUint32(8),
    dataOffset: dataOffset,
    reserved: (dataView.getUint8(12) & 0x0e) >> 1,
    flags: {
      urg: (flagsByte & 0x20) !== 0,
      ack: (flagsByte & 0x10) !== 0,
      psh: (flagsByte & 0x08) !== 0,
      rst: (flagsByte & 0x04) !== 0,
      syn: (flagsByte & 0x02) !== 0,
      fin: (flagsByte & 0x01) !== 0,
    },
    windowSize: dataView.getUint16(14),
    urgentPointer: dataView.getUint16(18),
    options,
    payload,
  };
}

/**
 * Serializes a TCP segment object into a Uint8Array.
 *
 * Optionally calculates the TCP checksum if an IP pseudo-header is provided
 * (required for TCP checksum calculation).
 * If no IP pseudo-header is provided, the checksum field will be set to 0.
 */
export function serializeTcpSegment(
  segment: TcpSegment,
  pseudoHeader?: IPv4PseudoHeader
): Uint8Array {
  const headerLength = TCP_HEADER_MIN_LENGTH + segment.options.length;
  const buffer = new Uint8Array(headerLength + segment.payload.length);
  const dataView = new DataView(
    buffer.buffer,
    buffer.byteOffset,
    buffer.byteLength
  );

  dataView.setUint16(0, segment.sourcePort);
  dataView.setUint16(2, segment.destinationPort);
  dataView.setUint32(4, segment.sequenceNumber);
  dataView.setUint32(8, segment.acknowledgmentNumber);

  // Data offset and reserved bits
  dataView.setUint8(12, ((headerLength / 4) << 4) | (segment.reserved << 1));

  // Flags
  const flags =
    (segment.flags.urg ? 0x20 : 0) |
    (segment.flags.ack ? 0x10 : 0) |
    (segment.flags.psh ? 0x08 : 0) |
    (segment.flags.rst ? 0x04 : 0) |
    (segment.flags.syn ? 0x02 : 0) |
    (segment.flags.fin ? 0x01 : 0);
  dataView.setUint8(13, flags);

  dataView.setUint16(14, segment.windowSize);
  dataView.setUint16(16, 0); // Initial checksum of 0
  dataView.setUint16(18, segment.urgentPointer);

  // Copy options and payload
  buffer.set(segment.options, TCP_HEADER_MIN_LENGTH);
  buffer.set(segment.payload, headerLength);

  if (pseudoHeader) {
    const pseudoHeaderBuffer = serializeIPv4PseudoHeader(pseudoHeader);
    const checksumBuffer = new Uint8Array(
      pseudoHeaderBuffer.length + buffer.length
    );
    checksumBuffer.set(pseudoHeaderBuffer);
    checksumBuffer.set(buffer, pseudoHeaderBuffer.length);

    const checksum = calculateChecksum(
      checksumBuffer,
      pseudoHeaderBuffer.length + 16
    );
    dataView.setUint16(16, checksum);
  }

  return buffer;
}
