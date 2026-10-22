export interface Teamproject {
  id: number;
  name: string;
  isTeamProject: boolean;
}

export interface CreateTeamprojectRequest {
  name: string;
  usersListEmail: string[];
}