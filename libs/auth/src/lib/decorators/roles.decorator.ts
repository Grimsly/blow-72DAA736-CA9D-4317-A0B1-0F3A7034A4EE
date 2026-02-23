import { SetMetadata } from '@nestjs/common';
import { Role } from '@blow-72DAA736-CA9D-4317-A0B1-0F3A7034A4EE/data';

export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);
