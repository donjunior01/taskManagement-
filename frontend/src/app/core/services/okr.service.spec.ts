import { OkrService } from './okr.service';

/** Pure-logic unit tests for the OKR progress math (no HTTP, no TestBed). */
describe('OkrService progress math', () => {
  const svc = new OkrService(null as any);

  it('computes a key result\'s progress from start/current/target', () => {
    expect(svc.krProgress({ startValue: 0, targetValue: 100, currentValue: 50 } as any)).toBe(50);
    expect(svc.krProgress({ startValue: 20, targetValue: 120, currentValue: 70 } as any)).toBe(50);
  });

  it('clamps progress between 0 and 100', () => {
    expect(svc.krProgress({ startValue: 0, targetValue: 100, currentValue: 150 } as any)).toBe(100);
    expect(svc.krProgress({ startValue: 0, targetValue: 100, currentValue: -10 } as any)).toBe(0);
  });

  it('averages the key results for the objective progress', () => {
    const o = { keyResults: [
      { startValue: 0, targetValue: 100, currentValue: 100 }, // 100%
      { startValue: 0, targetValue: 100, currentValue: 0 },   // 0%
    ] } as any;
    expect(svc.objectiveProgress(o)).toBe(50);
  });

  it('returns 0 when an objective has no key results', () => {
    expect(svc.objectiveProgress({ keyResults: [] } as any)).toBe(0);
  });
});
