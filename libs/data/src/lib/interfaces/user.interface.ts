export enum Role {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  VIEWER = 'VIEWER',
}

export interface IUser {
  id: string;
  email: string;
  password: string;
  role: Role;
  organizationId: string;
}
