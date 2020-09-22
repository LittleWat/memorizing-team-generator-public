export class GroupInfo {
  constructor(public groupName: string, public members: MemberInfo[]) {}
}

export class MemberInfo {
  constructor(public memberId: string, public name: string) {}
}

export class TeamGenResponse {
  constructor(public meetingId: string, public teamInfos: OutputTeamInfo[]) {}
}

export class OutputTeamInfo {
  constructor(public teamName: string, public memberNames: string[]) {}
}
