import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as jwt from 'jsonwebtoken';
import { getJwtSecret } from '../auth.constants';
import { JwtAuthGuard } from './jwt-auth.guard';

function contextFor(request: any): ExecutionContext {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  it('allows explicitly public routes without a token', () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(true) };
    const guard = new JwtAuthGuard(reflector as unknown as Reflector);

    expect(guard.canActivate(contextFor({ headers: {} }))).toBe(true);
  });

  it('rejects protected requests without a bearer token', () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) };
    const guard = new JwtAuthGuard(reflector as unknown as Reflector);

    expect(() => guard.canActivate(contextFor({ headers: {} }))).toThrow(
      UnauthorizedException,
    );
  });

  it('validates a signed bearer token and attaches its user id', () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) };
    const guard = new JwtAuthGuard(reflector as unknown as Reflector);
    const token = jwt.sign({ sub: 42 }, getJwtSecret());
    const request = { headers: { authorization: `Bearer ${token}` } };

    expect(guard.canActivate(contextFor(request))).toBe(true);
    expect(request.authUserId).toBe(42);
  });
});
