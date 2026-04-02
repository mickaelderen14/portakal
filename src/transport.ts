/**
 * Transport layer abstractions for printer communication.
 * portakal is transport-agnostic — these are interfaces and utilities,
 * not implementations. Users provide their own transport (TCP, USB, BLE, etc.)
 * or use the provided adapters.
 */

/** Printer connection state */
export type ConnectionState = "disconnected" | "connecting" | "connected" | "error";

/** Transport interface — implement this for your transport */
export interface PrinterTransport {
  /** Current connection state */
  readonly state: ConnectionState;

  /** Connect to the printer */
  connect(): Promise<void>;

  /** Disconnect from the printer */
  disconnect(): Promise<void>;

  /** Write data to the printer */
  write(data: Uint8Array): Promise<void>;

  /** Read data from the printer (for status queries) */
  read(timeout?: number): Promise<Uint8Array>;
}

/** Options for chunked write (prevents buffer overflow on BLE/slow printers) */
export interface ChunkOptions {
  /** Chunk size in bytes (default: 512 for BLE, 4096 for TCP) */
  chunkSize?: number;
  /** Delay between chunks in ms (default: 10 for BLE, 0 for TCP) */
  chunkDelay?: number;
}

/** Options for reconnection */
export interface ReconnectOptions {
  /** Maximum retry attempts (default: 3) */
  maxRetries?: number;
  /** Initial delay in ms (default: 1000, doubles each retry) */
  initialDelay?: number;
  /** Maximum delay in ms (default: 10000) */
  maxDelay?: number;
}

/**
 * Write data in chunks with optional delay between chunks.
 * Prevents buffer overflow on BLE printers and slow serial connections.
 */
export async function chunkedWrite(
  transport: PrinterTransport,
  data: Uint8Array,
  options: ChunkOptions = {},
): Promise<void> {
  const chunkSize = options.chunkSize ?? 512;
  const chunkDelay = options.chunkDelay ?? 10;

  for (let offset = 0; offset < data.length; offset += chunkSize) {
    const chunk = data.slice(offset, offset + chunkSize);
    await transport.write(chunk);
    if (chunkDelay > 0 && offset + chunkSize < data.length) {
      await delay(chunkDelay);
    }
  }
}

/**
 * Write with automatic reconnection on failure.
 */
export async function writeWithRetry(
  transport: PrinterTransport,
  data: Uint8Array,
  options: ReconnectOptions = {},
): Promise<void> {
  const maxRetries = options.maxRetries ?? 3;
  const initialDelay = options.initialDelay ?? 1000;
  const maxDelay = options.maxDelay ?? 10000;

  let lastError: Error | undefined;
  let currentDelay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (transport.state !== "connected") {
        await transport.connect();
      }
      await transport.write(data);
      return;
    } catch (err) {
      lastError = err as Error;
      if (attempt < maxRetries) {
        await delay(currentDelay);
        currentDelay = Math.min(currentDelay * 2, maxDelay);
      }
    }
  }

  throw lastError ?? new Error("Write failed after retries");
}

/**
 * Create a TCP raw socket transport configuration.
 * Users implement the actual connection using their preferred TCP library.
 */
export interface TCPConfig {
  host: string;
  port?: number; // default: 9100 (standard), 1024 for SATO
  timeout?: number; // connection timeout in ms
}

/**
 * Create a USB transport configuration.
 * Users implement the actual connection using WebUSB, node-usb, etc.
 */
export interface USBConfig {
  vendorId: number;
  productId?: number;
  interfaceNumber?: number;
  endpointNumber?: number;
}

/**
 * Create a BLE transport configuration.
 * Includes MTU negotiation parameters to solve the half-printing problem.
 */
export interface BLEConfig {
  /** BLE service UUID (default: common thermal printer service) */
  serviceUUID?: string;
  /** BLE write characteristic UUID */
  writeCharacteristicUUID?: string;
  /** BLE notify characteristic UUID */
  notifyCharacteristicUUID?: string;
  /** Request MTU size (default: 512) */
  requestMTU?: number;
  /** Chunk size for write (default: negotiated MTU - 3) */
  chunkSize?: number;
  /** Delay between chunks in ms (default: 20) */
  chunkDelay?: number;
}

/** Well-known BLE UUIDs for common thermal printers */
export const BLE_UUIDS = {
  /** Common generic thermal printer service */
  service: "49535343-fe7d-4ae5-8fa9-9fafd205e455",
  /** Write characteristic */
  write: "49535343-8841-43f4-a8d4-ecbe34729bb3",
  /** Notify characteristic */
  notify: "49535343-1e4d-4bd9-ba61-23c647249616",
  /** Nordic UART service (alternative) */
  nordicService: "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
  /** Nordic UART TX (write) */
  nordicWrite: "6e400002-b5a3-f393-e0a9-e50e24dcca9e",
  /** Nordic UART RX (notify) */
  nordicNotify: "6e400003-b5a3-f393-e0a9-e50e24dcca9e",
};

/** Well-known USB Vendor IDs for thermal printer manufacturers */
export const USB_VENDOR_IDS = {
  epson: 0x04b8,
  star: 0x0519,
  citizen: 0x1d90,
  bixolon: 0x1504,
  zebra: 0x0a5f,
  tsc: 0x1203,
  hprt: 0x6868,
  snbc: 0x0dd4,
} as const;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
