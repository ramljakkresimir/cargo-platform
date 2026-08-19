import { registerDecorator, ValidationOptions } from 'class-validator';

// A short denylist of the passwords that show up at the top of every breach-corpus
// frequency analysis. Not a substitute for a full breach-database check (e.g.
// Have I Been Pwned's k-anonymity API) — just a cheap, dependency-free filter for the
// most obviously weak choices, per the "reject extremely common passwords if practical"
// requirement without pulling in a large wordlist package.
const COMMON_PASSWORDS = new Set([
  '123456',
  '123456789',
  '12345678',
  '12345',
  '1234567',
  'password',
  'password1',
  'password123',
  'qwerty',
  'qwerty123',
  'letmein',
  'welcome',
  'admin',
  'admin123',
  'iloveyou',
  '111111',
  '000000',
  '123123',
  'abc123',
  'monkey',
  'dragon',
  'football',
  'baseball',
  'trustno1',
  '1q2w3e4r',
  'sunshine',
  'master',
  'shadow',
  'superman',
  'princess',
  '654321',
  '123321',
  'qazwsx',
  'michael',
  'jennifer',
  'starwars',
  'passw0rd',
  'login',
  'changeme',
]);

export function IsNotCommonPassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isNotCommonPassword',
      target: object.constructor,
      propertyName,
      options: {
        message: 'This password is too common — please choose a different one',
        ...validationOptions,
      },
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string') return true;
          return !COMMON_PASSWORDS.has(value.toLowerCase());
        },
      },
    });
  };
}
