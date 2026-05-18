export interface User {
  id?: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
  userType?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserRequest {
  username: string;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  role?: string;
}
