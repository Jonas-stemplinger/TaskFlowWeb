export interface Teamproject {
  id: number;
  name: string;
  isTeamProject: boolean;
}

export interface CreateTeamprojectRequest {
  name: string;
  usersListEmail: string[];
}

export interface TeamprojectMember {
  id: number;
  name: string;
  email: string;
}

export interface UpdateTeamprojectRequest {
  name: string;
}