export type PublicUser = {
  id: string;
  username: string;
  email?: string;
  createdAt: string;
};

export function toPublicUser(user: {
  id: string;
  username: string;
  email?: string;
  createdAt: string;
  password?: string;
  passwordHash?: string;
  salt?: string;
}): PublicUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    createdAt: user.createdAt,
  };
}
