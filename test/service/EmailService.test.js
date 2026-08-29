jest.mock('@sendgrid/mail', () => ({
  setApiKey: jest.fn(),
  send: jest.fn(),
}));

const sendgridMail = require('@sendgrid/mail');
const EmailService = require('../../src/service/EmailService');

describe('EmailService.sendVerifyEmailMail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Regression test: this used to be a fire-and-forget call whose internal
  // .catch re-threw with nothing to catch it, producing an unhandled
  // promise rejection that crashes the whole Node process (see DIAGNOSIS.md).
  test('does not reject and does not throw when SendGrid fails', async () => {
    sendgridMail.send.mockRejectedValue(new Error('Unauthorized'));
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(
      EmailService.sendVerifyEmailMail({ to: 'user@example.com', token: 'abc123' })
    ).resolves.toBeUndefined();

    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  test('resolves cleanly when SendGrid succeeds', async () => {
    sendgridMail.send.mockResolvedValue();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await expect(
      EmailService.sendVerifyEmailMail({ to: 'user@example.com', token: 'abc123' })
    ).resolves.toBeUndefined();

    expect(sendgridMail.send).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'user@example.com' })
    );
    logSpy.mockRestore();
  });
});
