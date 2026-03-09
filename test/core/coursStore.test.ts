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

  test("viderStoreAuDemarrage creates store file with empty courses", async () => {
    const store = require("../../src/core/coursStore");
    await store.viderStoreAuDemarrage();
    const content = await fs.readFile(path.join(tmpDir, "data", "cours.json"), "utf-8");
    expect(JSON.parse(content)).toEqual({ courses: [] });
  });

  test("recupererCoursStockes returns empty array when no courses", async () => {
    const store = require("../../src/core/coursStore");
    const all = await store.recupererCoursStockes();
    expect(all).toEqual([]);
  });

  test("recupererCoursStockes returns empty array when courses is not an array", async () => {
    const store = require("../../src/core/coursStore");
    const filePath = path.join(tmpDir, "data", "cours.json");
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify({ courses: { bad: true } }), "utf-8");

    const all = await store.recupererCoursStockes();
    expect(all).toEqual([]);
  });

  test("ajouterCoursStocke adds a course and avoids duplicates", async () => {
    const store = require("../../src/core/coursStore");
    const course = {
      idGroupe: "g1",
      jour: "D",
      heure: "H",
      activite: "A",
      mode: "M",
      local: "L",
      idEnseignant: "t1",
    } as any;

    await store.ajouterCoursStocke(course);
    let all = await store.recupererCoursStockes();
    expect(all).toHaveLength(1);
    expect(all[0].idGroupe).toBe("g1");

    // adding same idGroupe again shouldn't duplicate
    await store.ajouterCoursStocke(course);
    all = await store.recupererCoursStockes();
    expect(all).toHaveLength(1);
  });

  test("recupererCoursStockesPourEnseignant filters by idEnseignant", async () => {
    const store = require("../../src/core/coursStore");
    const a = { idGroupe: "gA", jour: "", heure: "", activite: "", mode: "", local: "", idEnseignant: "tA" } as any;
    const b = { idGroupe: "gB", jour: "", heure: "", activite: "", mode: "", local: "", idEnseignant: "tB" } as any;
    await store.ajouterCoursStocke(a);
    await store.ajouterCoursStocke(b);

    const tA = await store.recupererCoursStockesPourEnseignant("tA");
    expect(tA).toHaveLength(1);
    expect(tA[0].idGroupe).toBe("gA");
  });

  test("add second course and it is assigned to the teacher", async () => {
    const store = require("../../src/core/coursStore");
    const a = { idGroupe: "g1", jour: "", heure: "", activite: "", mode: "", local: "", idEnseignant: "t1" } as any;
    const b = { idGroupe: "g2", jour: "", heure: "", activite: "", mode: "", local: "", idEnseignant: "t1" } as any;
    const other = { idGroupe: "g3", jour: "", heure: "", activite: "", mode: "", local: "", idEnseignant: "t2" } as any;

    await store.ajouterCoursStocke(a);
    await store.ajouterCoursStocke(b);
    await store.ajouterCoursStocke(other);

    const t1 = await store.recupererCoursStockesPourEnseignant("t1");
    expect(t1).toHaveLength(2);
    expect(t1.map((x: any) => x.idGroupe).sort()).toEqual(["g1", "g2"]);
  });

  test("recupererCoursStockeParIdGroupe finds existing course or returns undefined", async () => {
    const store = require("../../src/core/coursStore");
    const course = { idGroupe: "gX", jour: "", heure: "", activite: "Act", mode: "", local: "", idEnseignant: "t" } as any;
    await store.ajouterCoursStocke(course);

    const found = await store.recupererCoursStockeParIdGroupe("gX");
    const notFound = await store.recupererCoursStockeParIdGroupe("missing");

    expect(found?.idGroupe).toBe("gX");
    expect(notFound).toBeUndefined();
  });

  test("retirerCoursStocke removes given group and leaves others", async () => {
    const store = require("../../src/core/coursStore");
    const a = { idGroupe: "gR1", jour: "", heure: "", activite: "", mode: "", local: "", idEnseignant: "t" } as any;
    const b = { idGroupe: "gR2", jour: "", heure: "", activite: "", mode: "", local: "", idEnseignant: "t" } as any;
    await store.ajouterCoursStocke(a);
    await store.ajouterCoursStocke(b);

    await store.retirerCoursStocke("gR1");
    const all = await store.recupererCoursStockes();
    expect(all.map((c: any) => c.idGroupe)).toEqual(["gR2"]);

    // removing non-existing should not throw
    await expect(store.retirerCoursStocke("nope")).resolves.toBeUndefined();
  });
});


