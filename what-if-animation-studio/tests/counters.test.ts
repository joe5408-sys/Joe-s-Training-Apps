// Run: node tests/counters.test.ts   (Node >= 22.18 strips TS types natively)
import assert from "node:assert/strict";
import { formatClock, countdownValue, plankSeconds, swingCount, hookClockSeconds } from "../src/lib/clock.ts";

const checks: [string, () => void][] = [
  ["hook alarm 06:59:58 -> 06:59:59 -> 07:00:00 in the first second", () => {
    assert.deepEqual([0, 9, 10, 19, 20, 29].map((f) => formatClock(hookClockSeconds(f))),
      ["06:59:58", "06:59:58", "06:59:59", "06:59:59", "07:00:00", "07:00:00"]);
  }],
  ["loop pre-roll (S08 last frames) shows 06:59:57, one step before frame 0", () => {
    for (const f of [-18, -1]) assert.equal(formatClock(hookClockSeconds(f)), "06:59:57");
  }],
  ["plank timer 00:00..00:03 then holds", () => {
    assert.deepEqual([0, 20, 40, 60, 80, 99].map((f) => plankSeconds(f)), [0, 0, 1, 2, 3, 3]);
  }],
  ["pendulum count reaches exactly 5", () => {
    assert.deepEqual([10, 34, 58, 82, 106, 130, 400].map((f) => swingCount(f)), [0, 1, 2, 3, 4, 5, 5]);
  }],
  ["countdown timer deterministic + clamps at 0", () => {
    assert.equal(countdownValue(0, 3), 3);
    assert.equal(countdownValue(89, 3), 1);
    assert.equal(countdownValue(500, 3), 0);
    assert.equal(countdownValue(60, 0, 30, "up"), 2);
  }],
  ["formatClock wraps at midnight", () => assert.equal(formatClock(86400 + 61), "00:01:01")],
];
let fail = 0;
for (const [name, fn] of checks) {
  try { fn(); console.log("PASS", name); } catch (e) { fail++; console.log("FAIL", name, (e as Error).message); }
}
process.exit(fail ? 1 : 0);
