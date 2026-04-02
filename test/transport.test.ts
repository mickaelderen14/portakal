import { describe, expect, it } from "vitest";
import { chunkedWrite, writeWithRetry, BLE_UUIDS, USB_VENDOR_IDS } from "../src/transport";
import type { PrinterTransport, ConnectionState } from "../src/transport";

function createMockTransport(opts: { failCount?: number } = {}): PrinterTransport & {
  written: Uint8Array[];
  connectCalls: number;
} {
  let failsRemaining = opts.failCount ?? 0;
  const mock = {
    state: "connected" as ConnectionState,
    written: [] as Uint8Array[],
    connectCalls: 0,
    async connect() {
      mock.connectCalls++;
      mock.state = "connected";
    },
    async disconnect() {
      mock.state = "disconnected";
    },
    async write(data: Uint8Array) {
      if (failsRemaining > 0) {
        failsRemaining--;
        throw new Error("Write failed");
      }
      mock.written.push(new Uint8Array(data));
    },
    async read() {
      return new Uint8Array(0);
    },
  };
  return mock;
}

describe("chunkedWrite", () => {
  it("writes small data in one chunk", async () => {
    const transport = createMockTransport();
    const data = new Uint8Array([1, 2, 3, 4, 5]);
    await chunkedWrite(transport, data, { chunkSize: 512, chunkDelay: 0 });
    expect(transport.written).toHaveLength(1);
    expect(transport.written[0]).toEqual(data);
  });

  it("splits large data into chunks", async () => {
    const transport = createMockTransport();
    const data = new Uint8Array(100);
    await chunkedWrite(transport, data, { chunkSize: 30, chunkDelay: 0 });
    expect(transport.written).toHaveLength(4); // 30+30+30+10
    expect(transport.written[0].length).toBe(30);
    expect(transport.written[3].length).toBe(10);
  });

  it("preserves all data across chunks", async () => {
    const transport = createMockTransport();
    const data = new Uint8Array(50);
    for (let i = 0; i < 50; i++) data[i] = i;

    await chunkedWrite(transport, data, { chunkSize: 20, chunkDelay: 0 });

    const reassembled: number[] = [];
    for (const chunk of transport.written) {
      reassembled.push(...chunk);
    }
    expect(reassembled).toEqual(Array.from(data));
  });

  it("handles empty data", async () => {
    const transport = createMockTransport();
    await chunkedWrite(transport, new Uint8Array(0), { chunkSize: 20 });
    expect(transport.written).toHaveLength(0);
  });
});

describe("writeWithRetry", () => {
  it("writes successfully on first attempt", async () => {
    const transport = createMockTransport();
    const data = new Uint8Array([1, 2, 3]);
    await writeWithRetry(transport, data, { maxRetries: 3, initialDelay: 1 });
    expect(transport.written).toHaveLength(1);
  });

  it("retries on failure and succeeds", async () => {
    const transport = createMockTransport({ failCount: 2 });
    const data = new Uint8Array([1, 2, 3]);
    await writeWithRetry(transport, data, { maxRetries: 3, initialDelay: 1 });
    expect(transport.written).toHaveLength(1);
  });

  it("throws after max retries exceeded", async () => {
    const transport = createMockTransport({ failCount: 10 });
    const data = new Uint8Array([1]);
    await expect(
      writeWithRetry(transport, data, { maxRetries: 2, initialDelay: 1 }),
    ).rejects.toThrow("Write failed");
  });

  it("reconnects if disconnected", async () => {
    const transport = createMockTransport();
    (transport as any).state = "disconnected";
    const data = new Uint8Array([1]);
    await writeWithRetry(transport, data, { maxRetries: 1, initialDelay: 1 });
    expect(transport.connectCalls).toBe(1);
  });
});

describe("constants", () => {
  it("BLE_UUIDS has standard service UUID", () => {
    expect(BLE_UUIDS.service).toBe("49535343-fe7d-4ae5-8fa9-9fafd205e455");
  });

  it("USB_VENDOR_IDS has major manufacturers", () => {
    expect(USB_VENDOR_IDS.epson).toBe(0x04b8);
    expect(USB_VENDOR_IDS.star).toBe(0x0519);
    expect(USB_VENDOR_IDS.zebra).toBe(0x0a5f);
    expect(USB_VENDOR_IDS.tsc).toBe(0x1203);
    expect(USB_VENDOR_IDS.bixolon).toBe(0x1504);
    expect(USB_VENDOR_IDS.citizen).toBe(0x1d90);
  });
});
