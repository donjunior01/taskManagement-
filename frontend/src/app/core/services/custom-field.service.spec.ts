import { CustomFieldService } from './custom-field.service';

/** Pure-logic unit tests for SELECT-field option parsing (no HTTP, no TestBed). */
describe('CustomFieldService option parsing', () => {
  const svc = new CustomFieldService(null as any);

  it('splits, trims and drops empty options', () => {
    expect(svc.optionList({ options: 'Low, High ,,Med ' } as any)).toEqual(['Low', 'High', 'Med']);
  });

  it('returns an empty array when there are no options', () => {
    expect(svc.optionList({ options: '' } as any)).toEqual([]);
    expect(svc.optionList({} as any)).toEqual([]);
  });
});
