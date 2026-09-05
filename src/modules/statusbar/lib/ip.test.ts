import { describe, expect, it, vi } from "vitest";
import { fetchLocalIp, fetchPublicIp, isValidIp } from "./ip";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

describe("isValidIp", () => {
  it("validates standard IPv4 addresses", () => {
    expect(isValidIp("192.168.1.1")).toBe(true);
    expect(isValidIp("8.8.8.8")).toBe(true);
    expect(isValidIp("1.1.1.1")).toBe(true);
    expect(isValidIp("255.255.255.255")).toBe(true);
  });

  it("validates IPv6 addresses", () => {
    expect(isValidIp("2001:0db8:85a3:0000:0000:8a2e:0370:7334")).toBe(true);
    expect(isValidIp("2001:db8::1")).toBe(true);
    expect(isValidIp("::1")).toBe(true);
  });

  it("rejects invalid IP addresses", () => {
    expect(isValidIp("")).toBe(false);
    expect(isValidIp("abc.def.ghi.jkl")).toBe(false);
    expect(isValidIp("256.0.0.1")).toBe(false);
    expect(isValidIp("1.2.3.4.5")).toBe(false);
    expect(isValidIp("hello world")).toBe(false);
  });
});

describe("fetchPublicIp", () => {
  it("fetches IPv4 address successfully from primary endpoint", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ ip: "203.0.113.195" }),
    });

    const ip = await fetchPublicIp(
      undefined,
      mockFetch as unknown as typeof fetch,
    );
    expect(ip).toBe("203.0.113.195");
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("falls back to secondary endpoint if primary fails", async () => {
    const mockFetch = vi
      .fn()
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ip: "198.51.100.42" }),
      });

    const ip = await fetchPublicIp(
      undefined,
      mockFetch as unknown as typeof fetch,
    );
    expect(ip).toBe("198.51.100.42");
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("throws error if all endpoints fail", async () => {
    const mockFetch = vi
      .fn()
      .mockRejectedValue(new Error("Network unreachable"));

    await expect(
      fetchPublicIp(undefined, mockFetch as unknown as typeof fetch),
    ).rejects.toThrow("Network unreachable");
  });

  it("throws error if response contains invalid IP format", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ip: "not-an-ip" }),
    });

    await expect(
      fetchPublicIp(undefined, mockFetch as unknown as typeof fetch),
    ).rejects.toThrow();
  });
});

describe("fetchLocalIp", () => {
  it("returns the IP from Tauri invoke", async () => {
    const { invoke } = await import("@tauri-apps/api/core");
    (invoke as ReturnType<typeof vi.fn>).mockResolvedValueOnce("192.168.1.42");

    const ip = await fetchLocalIp();
    expect(ip).toBe("192.168.1.42");
    expect(invoke).toHaveBeenCalledWith("net_local_ip");
  });

  it("throws when invoke returns an invalid IP", async () => {
    const { invoke } = await import("@tauri-apps/api/core");
    (invoke as ReturnType<typeof vi.fn>).mockResolvedValueOnce("not-an-ip");

    await expect(fetchLocalIp()).rejects.toThrow("Invalid IP received from system");
  });

  it("propagates IPC errors from invoke", async () => {
    const { invoke } = await import("@tauri-apps/api/core");
    (invoke as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("IPC error"),
    );

    await expect(fetchLocalIp()).rejects.toThrow("IPC error");
  });
});
