import { describe, expect, it } from "vitest";
import { buildGameData } from "@/features/lifesim/data";
import { ageUp, applyForJob, buyLicense, enroll, goOutdoors, jobCheck, moveCity, newLife, rentHome, takeHunterSafety } from "@/features/lifesim/engine/life";
import type { Life } from "@/features/lifesim/engine/types";

const data = buildGameData();
const start = (seed = 42, metro = "jacksonville") => newLife(data, { name: "Test", gender: "female", metro, seed });

describe("life sim engine", () => {
  it("builds a game snapshot from the real data for all six metros", () => {
    expect(data.metros).toHaveLength(6);
    for (const m of data.metros) {
      expect(m.jobs.length).toBeGreaterThan(150);
      expect(m.rent.br1).toBeGreaterThan(1000);
      expect(m.spots.length).toBeGreaterThanOrEqual(3);
      expect(m.trips.length).toBeGreaterThan(5);
    }
    expect(data.lifeTable.male).toHaveLength(120);
    expect(JSON.stringify(data).length).toBeLessThan(900_000);
  });

  it("is deterministic for a seed", () => {
    let a = start(7);
    let b = start(7);
    for (let i = 0; i < 20; i++) {
      a = ageUp(data, a).life;
      b = ageUp(data, b).life;
    }
    expect(a).toEqual(b);
  });

  it("gates jobs by real entry education", () => {
    const l = start();
    const nurse = data.metros[0]!.jobs.find((j) => j.soc === "29-1141")!;
    expect(nurse.education).toBe(5);
    expect(jobCheck(l, nurse).ok).toBe(false);
    const cashier = data.metros[0]!.jobs.find((j) => j.soc === "41-2011")!;
    expect(jobCheck(l, cashier).ok).toBe(true);
  });

  it("a full life eventually ends, with money, jobs and school along the way", () => {
    let l: Life = start(123);
    l = enroll(l, "aa").life;
    const entry = data.metros[0]!.jobs.filter((j) => j.education <= 1 && j.experienceYears === 0);
    for (let i = 0; i < 130 && l.alive; i++) {
      if (!l.job) for (const j of entry.slice(0, 6)) if (!l.job && l.actionsLeft > 0) l = applyForJob(data, l, j.soc).life;
      if (l.home.kind === "parents" && l.age > 22) l = rentHome(data, l, 1).life;
      l = ageUp(data, l).life;
    }
    expect(l.alive).toBe(false);
    expect(l.causeOfDeath).toBeTruthy();
    expect(l.education).toBeGreaterThanOrEqual(2);
    expect(l.workYears).toBeGreaterThan(0);
    expect(l.lastYear).not.toBeNull();
  });

  it("fishing and hunting require Florida licenses and hunter safety", () => {
    let l = start(5, "tallahassee");
    l.cash = 5000;
    const lake = data.metros.find((m) => m.slug === "tallahassee")!.spots.find((s) => s.name === "Lake Talquin")!;
    expect(goOutdoors(data, l, lake.name, "fish").ok).toBe(false);
    l = buyLicense(data, l, "fishing").life;
    const r = goOutdoors(data, l, lake.name, "fish");
    expect(r.ok).toBe(true);
    expect(r.message).toMatch(/Lake Talquin/);

    const forest = "Apalachicola National Forest";
    expect(buyLicense(data, l, "hunting").ok).toBe(false); // born 2008 → hunter safety required
    l = takeHunterSafety(l).life;
    l = buyLicense(data, l, "hunting").life;
    expect(goOutdoors(data, l, forest, "hunt").ok).toBe(true);
  });

  it("moving costs money and changes the rent to the new city's HUD rent", () => {
    let l = start();
    l.cash = 10000;
    l = moveCity(data, l, "miami").life;
    expect(l.metro).toBe("miami");
    expect(l.home).toEqual({ kind: "rent", bedrooms: 0, monthlyRent: data.metros.find((m) => m.slug === "miami")!.rent.studio });
    expect(l.cash).toBeLessThan(10000 - 2000);
  });
});
