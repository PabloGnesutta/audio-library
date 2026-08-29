const EmailFactory = require('../../src/factory/EmailFactory');

describe('EmailFactory.generate', () => {
  test('wraps the given inner html in a full document with the given title', () => {
    const html = EmailFactory.generate('<p>Hello</p>', 'Welcome Email');
    expect(html).toContain('<title>Welcome Email</title>');
    expect(html).toContain('<p>Hello</p>');
    expect(html).toContain('<!DOCTYPE html>');
  });
});
