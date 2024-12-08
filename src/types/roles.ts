export type RoleName = 'ADMIN' | 'TEAM_LEADER' | 'TEAM_MEMBER';

export interface Role {
  id: number;
  name: RoleName;
  displayName: string;
}

export const getRoleDisplay = (roleName: RoleName): string => {
  const displayNames = {
    'ADMIN': 'Admin',
    'TEAM_LEADER': 'Team Leader',
    'TEAM_MEMBER': 'Team Member'
  };
  return displayNames[roleName];
}; 