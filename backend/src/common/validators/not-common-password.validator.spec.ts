import { validate } from 'class-validator';
import { IsNotCommonPassword } from './not-common-password.validator';

class Fixture {
  @IsNotCommonPassword()
  password: string;
}

describe('IsNotCommonPassword', () => {
  it('rejects a well-known common password', async () => {
    const fixture = new Fixture();
    fixture.password = 'password123';

    const errors = await validate(fixture);
    expect(errors).toHaveLength(1);
  });

  it('is case-insensitive', async () => {
    const fixture = new Fixture();
    fixture.password = 'PaSsWoRd';

    const errors = await validate(fixture);
    expect(errors).toHaveLength(1);
  });

  it('accepts a non-common password', async () => {
    const fixture = new Fixture();
    fixture.password = 'a-fairly-unique-passphrase-42';

    const errors = await validate(fixture);
    expect(errors).toHaveLength(0);
  });
});
