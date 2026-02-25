import { AuthenticatedUser } from '@blow-72DAA736-CA9D-4317-A0B1-0F3A7034A4EE/auth';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  }
);
