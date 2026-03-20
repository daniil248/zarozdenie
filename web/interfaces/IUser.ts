export interface IUser {
  id: number;
  name: string;
  number: string;
  password: string;
  role: "USER" | "ADMIN";
  status: boolean;
  created_at: string | Date;
}