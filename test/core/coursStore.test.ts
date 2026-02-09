import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { jest } from "@jest/globals";

describe("coursStore", () => {
  let tmpDir: string;

  beforeEach(async () => {
    jest.resetModules();
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "coursstore-"));
    jest.spyOn(process, "cwd").mockReturnValue(tmpDir);
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch {}
  });

  test("clearStoreOnStartup creates store file with empty courses", async () => {
    const store = require("../../src/core/coursStore");
    await store.clearStoreOnStartup();
    const content = await fs.readFile(path.join(tmpDir, "data", "cours.json"), "utf-8");
    expect(JSON.parse(content)).toEqual({ courses: [] });
  });

  test("getAllStored returns empty array when no courses", async () => {
    const store = require("../../src/core/coursStore");
    const all = await store.getAllStored();
    expect(all).toEqual([]);
  });

  test("getAllStored returns empty array when courses is not an array", async () => {
    const store = require("../../src/core/coursStore");
    const filePath = path.join(tmpDir, "data", "cours.json");
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify({ courses: { bad: true } }), "utf-8");

    const all = await store.getAllStored();
    expect(all).toEqual([]);
  });

  test("addStored adds a course and avoids duplicates", async () => {
    const store = require("../../src/core/coursStore");
    const course = {
      group_id: "g1",
      day: "D",
      hours: "H",
      activity: "A",
      mode: "M",
      local: "L",
      teacher_id: "t1",
    } as any;

    await store.addStored(course);
    let all = await store.getAllStored();
    expect(all).toHaveLength(1);
    expect(all[0].group_id).toBe("g1");

    // adding same group_id again shouldn't duplicate
    await store.addStored(course);
    all = await store.getAllStored();
    expect(all).toHaveLength(1);
  });

  test("getStoredForTeacher filters by teacher_id", async () => {
    const store = require("../../src/core/coursStore");
    const a = { group_id: "gA", day: "", hours: "", activity: "", mode: "", local: "", teacher_id: "tA" } as any;
    const b = { group_id: "gB", day: "", hours: "", activity: "", mode: "", local: "", teacher_id: "tB" } as any;
    await store.addStored(a);
    await store.addStored(b);

    const tA = await store.getStoredForTeacher("tA");
    expect(tA).toHaveLength(1);
    expect(tA[0].group_id).toBe("gA");
  });

  test("getStoredByGroupId finds existing course or returns undefined", async () => {
    const store = require("../../src/core/coursStore");
    const course = { group_id: "gX", day: "", hours: "", activity: "Act", mode: "", local: "", teacher_id: "t" } as any;
    await store.addStored(course);

    const found = await store.getStoredByGroupId("gX");
    const notFound = await store.getStoredByGroupId("missing");

    expect(found?.group_id).toBe("gX");
    expect(notFound).toBeUndefined();
  });

  test("removeStored removes given group and leaves others", async () => {
    const store = require("../../src/core/coursStore");
    const a = { group_id: "gR1", day: "", hours: "", activity: "", mode: "", local: "", teacher_id: "t" } as any;
    const b = { group_id: "gR2", day: "", hours: "", activity: "", mode: "", local: "", teacher_id: "t" } as any;
    await store.addStored(a);
    await store.addStored(b);

    await store.removeStored("gR1");
    const all = await store.getAllStored();
    expect(all.map((c: any) => c.group_id)).toEqual(["gR2"]);

    // removing non-existing should not throw
    await expect(store.removeStored("nope")).resolves.toBeUndefined();
  });
});
