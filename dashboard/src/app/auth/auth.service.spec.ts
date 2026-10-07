import { describe, expect, it } from 'vitest';
import { describeSignInError } from './auth.service';

describe('describeSignInError', () => {
  it('names the real cause and what to do', () => {
    expect(describeSignInError({ code: 'auth/popup-blocked' })).toContain('Allow pop-ups');
    expect(describeSignInError({ code: 'auth/operation-not-allowed' })).toContain('enable the Google provider');
    expect(describeSignInError({ code: 'auth/configuration-not-found' })).toContain('Authentication');
    expect(describeSignInError({ code: 'auth/unauthorized-domain' })).toContain('Authorized domains');
    expect(describeSignInError({ code: 'auth/popup-closed-by-user' })).toContain('closed');
  });

  it('shows the code when it is not one we know', () => {
    expect(describeSignInError({ code: 'auth/weird' })).toContain('(auth/weird)');
    expect(describeSignInError(new Error('x'))).toBe('Sign-in did not finish. Try again.');
  });
});
