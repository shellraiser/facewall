export interface Employee {
  id?: number;
  createdAt?: number;
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
  gravatar?: string;
}

export interface HighScore {
  id: string;
  email: string;
  name: string;
  correct: number;
  total: number;
  date: number;
}

export interface UserJson {
  users: Omit<Employee, 'gravatar'>[];
}
