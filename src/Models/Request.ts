import { MemberInfo } from './Response';

export class TeamGenRequest {
  constructor(public mode: string, public numTeams: number, public inputGroups: InputGroups[]) {}
}

export class InputGroups {
  constructor(public groupName: string, public members: MemberInfo[]) {}
}
