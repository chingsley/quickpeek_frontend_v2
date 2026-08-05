import { ASK_LIMITS, hasAskErrors, validateAskForm } from '@/utils/askValidation';

const valid = {
  title: 'Where is the best shawarma?',
  price: '10',
  detail: 'Looking for a great shawarma spot downtown.',
  acceptanceCriteria: 'Name and rough queue length.',
};

describe('validateAskForm', () => {
  it('accepts a valid form', () => {
    expect(validateAskForm(valid)).toEqual({});
    expect(hasAskErrors(validateAskForm(valid))).toBe(false);
  });

  it('flags a missing or too-short title', () => {
    expect(validateAskForm({ ...valid, title: '' }).title).toMatch(/title/i);
    expect(validateAskForm({ ...valid, title: 'abc' }).title).toMatch(/at least 5/);
    expect(validateAskForm({ ...valid, title: '     ' }).title).toBeTruthy();
  });

  it('flags price problems distinctly', () => {
    expect(validateAskForm({ ...valid, price: '' }).price).toMatch(/enter the amount/i);
    expect(validateAskForm({ ...valid, price: '0' }).price).toMatch(/greater than \$0/);
    expect(validateAskForm({ ...valid, price: '-3' }).price).toMatch(/greater than \$0/);
    expect(validateAskForm({ ...valid, price: '10001' }).price).toMatch(/cannot exceed \$10,000/);
    expect(validateAskForm({ ...valid, price: '10000' }).price).toBeUndefined();
  });

  it('flags short details and criteria', () => {
    expect(validateAskForm({ ...valid, detail: 'too short' }).detail).toMatch(/at least 10/);
    expect(validateAskForm({ ...valid, detail: '' }).detail).toBeTruthy();
    expect(validateAskForm({ ...valid, acceptanceCriteria: '' }).acceptanceCriteria).toMatch(
      /at least 5/,
    );
    expect(validateAskForm({ ...valid, acceptanceCriteria: 'ok' }).acceptanceCriteria).toMatch(
      /at least 5/,
    );
  });

  it('collects multiple errors at once', () => {
    const errors = validateAskForm({ title: '', price: '', detail: '', acceptanceCriteria: '' });
    expect(Object.keys(errors).sort()).toEqual([
      'acceptanceCriteria',
      'detail',
      'price',
      'title',
    ]);
    expect(hasAskErrors(errors)).toBe(true);
  });

  it('exposes the limits used by the form UI', () => {
    expect(ASK_LIMITS).toMatchObject({
      titleMin: 5,
      titleMax: 120,
      detailMin: 10,
      detailMax: 2000,
      criteriaMin: 5,
      criteriaMax: 1000,
      priceMax: 10000,
    });
  });
});
