import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { spawn, type ChildProcess } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "node:net";
import { io, type Socket } from "socket.io-client";
import { initializeGame, performTakeTokens } from "@/lib/gameLogic";
import { DEAD_MANS_DRAW_RING_CONFIG } from "@/lib/deadMansDraw";

const serverUrl = () => `http://127.0.0.1:${port}`;
const sockets: Socket[] = [];
let server: ChildProcess;
let dataDir: string;
let port: number;

function event<T>(socket: Socket, name: string, timeoutMs = 4000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.off(name, received);
      reject(new Error(`Timed out waiting for ${name}`));
    }, timeoutMs);
    const received = (value: T) => {
      clearTimeout(timeout);
      resolve(value);
    };
    socket.once(name, received);
  });
}

async function post(path: string, body: object) {
  const response = await fetch(`${serverUrl()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}

async function connectPlayer(index: number) {
  const phone = `0912000000${index}`;
  const otp = await post("/auth/otp/request", { phone });
  expect(otp.status).toBe(200);
  const registered = await post("/auth/register", {
    username: `Player${index}`,
    phone,
    code: otp.body.devCode,
  });
  expect(registered.status).toBe(200);
  const socket = io(serverUrl(), {
    auth: { token: registered.body.token },
    transports: ["websocket"],
    reconnection: false,
  });
  sockets.push(socket);
  await event(socket, "connect");
  return { socket, token: registered.body.token, playerId: `player-${index.toString().padStart(8, "0")}` };
}

beforeAll(async () => {
  port = await new Promise<number>((resolve, reject) => {
    const probe = createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      if (!address || typeof address === "string") return reject(new Error("No port"));
      probe.close(() => resolve(address.port));
    });
  });
  dataDir = mkdtempSync(join(tmpdir(), "guilds-rooms-"));
  server = spawn(process.execPath, ["server.js"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_ENV: "test",
      PORT: String(port),
      DATABASE_URL: "",
      ALLOW_DEV_OTP: "1",
      SPLENDOR_DATA_DIR: dataDir,
      AUTH_SECRET: "integration-test-secret-that-is-long-enough",
    },
    stdio: "ignore",
  });
  for (let attempt = 0; attempt < 80; attempt++) {
    if (server.exitCode !== null) throw new Error(`Server exited: ${server.exitCode}`);
    try {
      if ((await fetch(`${serverUrl()}/health`)).ok) return;
    } catch { /* Starting. */ }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Server did not start");
}, 15_000);

afterAll(async () => {
  for (const socket of sockets) socket.disconnect();
  if (server && server.exitCode === null) {
    const exited = new Promise<void>((resolve) => server.once("exit", () => resolve()));
    server.kill();
    await exited;
  }
  if (dataDir) rmSync(dataDir, { recursive: true, force: true });
});

describe("Dead Man's Draw rules", () => {
  it("removes the retired ring from the available pool", () => {
    expect(DEAD_MANS_DRAW_RING_CONFIG.map((ring) => ring.id)).not.toContain("madam-margot");
  });
});

describe("independent online matches", () => {
  it("isolates two simultaneous two-player rooms and recovers a seat", async () => {
    const players = await Promise.all([1, 2, 3, 4].map(connectPlayer));
    async function match(a: typeof players[number], b: typeof players[number]) {
      const foundA = event<{ roomId: string }>(a.socket, "match-found");
      const foundB = event<{ roomId: string }>(b.socket, "match-found");
      for (const player of [a, b]) player.socket.emit("find-match", {
        playerCount: 2,
        playerId: player.playerId,
        gameId: "splendor",
        turnTime: 15,
      });
      const [resultA, resultB] = await Promise.all([foundA, foundB]);
      expect(resultA.roomId).toBe(resultB.roomId);
      for (const player of [a, b]) {
        const joined = event(player.socket, "players-updated");
        player.socket.emit("join-room", { roomId: resultA.roomId, playerId: player.playerId });
        await joined;
      }
      return resultA.roomId;
    }
    const roomA = await match(players[0], players[1]);
    const stateA = initializeGame(2);
    const startedA = event<{ playersInGame: { id: string }[] }>(players[0].socket, "game-started");
    players[0].socket.emit("start-game", { roomId: roomA, gameState: stateA, turnTime: 15 });
    const startedRoomA = await startedA;
    const duplicateMatch = event(players[0].socket, "match-error");
    players[0].socket.emit("find-match", {
      playerCount: 2, playerId: players[0].playerId, gameId: "splendor", turnTime: 15,
    });
    await duplicateMatch;

    // The second pair searches only after the first match is already live.
    const roomB = await match(players[2], players[3]);
    expect(roomA).not.toBe(roomB);
    const stateB = initializeGame(2);
    const startedB = event(players[2].socket, "game-started");
    players[2].socket.emit("start-game", { roomId: roomB, gameState: stateB, turnTime: 15 });
    await startedB;
    const actor = players.find((player) => player.playerId === startedRoomA.playersInGame[0].id)!;
    const observer = players.find((player) => player.playerId === startedRoomA.playersInGame[1].id)!;

    const otherRoomUpdate = vi.fn();
    players[2].socket.on("game-state-updated", otherRoomUpdate);
    const rejectedJoin = event(players[2].socket, "join-room-error");
    players[2].socket.emit("join-room", { roomId: roomA, playerId: players[2].playerId });
    await rejectedJoin;
    const updatedA = event(observer.socket, "game-state-updated");
    const nextA = performTakeTokens(stateA, ["diamond"]);
    actor.socket.emit("sync-game-state", {
      roomId: roomA,
      playerId: actor.playerId,
      gameState: nextA,
    });
    expect(await updatedA).toMatchObject(nextA);
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(otherRoomUpdate).not.toHaveBeenCalled();

    players[0].socket.disconnect();
    const restored = io(serverUrl(), {
      auth: { token: players[0].token },
      transports: ["websocket"],
      reconnection: false,
    });
    sockets.push(restored);
    await event(restored, "connect");
    const snapshot = event(restored, "game-state-updated");
    restored.emit("join-room", { roomId: roomA, playerId: players[0].playerId });
    expect(await snapshot).toMatchObject(nextA);

    const publicUsers = await (await fetch(`${serverUrl()}/users`)).json();
    expect(publicUsers.users).toHaveLength(4);
    expect(publicUsers.users[0]).not.toHaveProperty("phone");
    expect((await fetch(`${serverUrl()}/social`)).status).toBe(401);

    const disconnected = event(restored, "disconnect");
    const loggedOut = await fetch(`${serverUrl()}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${players[0].token}` },
    });
    expect(loggedOut.ok).toBe(true);
    expect((await fetch(`${serverUrl()}/auth/me`, {
      headers: { Authorization: `Bearer ${players[0].token}` },
    })).status).toBe(401);
    await disconnected;
  }, 20_000);
});
