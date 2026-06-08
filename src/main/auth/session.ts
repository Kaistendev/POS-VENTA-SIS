export interface SessionUser {
  id: number;
  username: string;
  role: string;
}

let currentUser: SessionUser | null = null;

export function setCurrentUser(user: SessionUser): void {
  currentUser = user;
}

export function getCurrentUser(): SessionUser | null {
  return currentUser;
}

export function clearCurrentUser(): void {
  currentUser = null;
}
