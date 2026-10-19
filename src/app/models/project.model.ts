export interface Project {
  id: number;
  name: string;
  userId: number;
}

export interface CreateProjectRequest {
  name: string;
}

export interface UpdateProjectRequest {
    name: string;
}