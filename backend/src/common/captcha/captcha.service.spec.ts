import axios from 'axios';
import { CaptchaService } from './captcha.service';
import { ConfigService } from '@nestjs/config';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

function makeConfig(values: Record<string, string>): ConfigService {
  return {
    get: jest.fn((key: string) => values[key]),
  } as unknown as ConfigService;
}

describe('CaptchaService', () => {
  afterEach(() => jest.resetAllMocks());

  it('bypasses verification when no secret key is configured outside production', async () => {
    const service = new CaptchaService(makeConfig({}));
    await expect(service.verify('any-token')).resolves.toBe(true);
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.Mocked axios.post is a mock function reference, not a bound class method
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('fails closed when no secret key is configured in production', async () => {
    const service = new CaptchaService(makeConfig({ NODE_ENV: 'production' }));
    await expect(service.verify('any-token')).resolves.toBe(false);
  });

  it('rejects a missing token when a secret key is configured', async () => {
    const service = new CaptchaService(
      makeConfig({ TURNSTILE_SECRET_KEY: 'secret' }),
    );
    await expect(service.verify(undefined)).resolves.toBe(false);
    // eslint-disable-next-line @typescript-eslint/unbound-method -- jest.Mocked axios.post is a mock function reference, not a bound class method
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('returns true when Turnstile reports success', async () => {
    mockedAxios.post.mockResolvedValue({ data: { success: true } });
    const service = new CaptchaService(
      makeConfig({ TURNSTILE_SECRET_KEY: 'secret' }),
    );
    await expect(service.verify('good-token')).resolves.toBe(true);
  });

  it('returns false when Turnstile reports failure', async () => {
    mockedAxios.post.mockResolvedValue({
      data: { success: false, 'error-codes': ['invalid-input-response'] },
    });
    const service = new CaptchaService(
      makeConfig({ TURNSTILE_SECRET_KEY: 'secret' }),
    );
    await expect(service.verify('bad-token')).resolves.toBe(false);
  });

  it('fails closed on a network error', async () => {
    mockedAxios.post.mockRejectedValue(new Error('timeout'));
    const service = new CaptchaService(
      makeConfig({ TURNSTILE_SECRET_KEY: 'secret' }),
    );
    await expect(service.verify('some-token')).resolves.toBe(false);
  });
});
