// Output DTO for a user. Use cases return this instead of raw Prisma models or
// Better Auth objects so sensitive fields (password, account rows) never leak.
export interface UserDto {
  id: string;
  email: string;
  name: string;
  role: string | null;
  banned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface UserLike {
  id: string;
  email: string;
  name: string;
  role?: string | null;
  banned?: boolean | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export function toUserDto(user: UserLike): UserDto {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role ?? null,
    banned: user.banned ?? false,
    createdAt: new Date(user.createdAt),
    updatedAt: new Date(user.updatedAt),
  };
}
