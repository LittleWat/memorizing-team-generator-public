import logger from '../util/logger';
import InputGroup from './input-group';
import OutputTeam from './output-team';

export class PreviousMeetingResponse {
  constructor(public meetingId: string, public groupInfos: GroupInfo[], public teamInfos: TeamInfo[]) {}

  static from(inputGroups: InputGroup[], outputTeams: OutputTeam[], memberIdToName: Map<string, string>) {
    const groupInfos = inputGroups.map(
      (group) =>
        new GroupInfo(
          group.groupName,
          Array.from(group.memberIds).map((id) => new MemberInfo(id, memberIdToName.get(id)))
        )
    );
    const teamInfos = outputTeams.map(
      (team) =>
        new TeamInfo(
          team.teamName,
          Array.from(team.memberIds).map((id) => memberIdToName.get(id))
        )
    );

    return new PreviousMeetingResponse(inputGroups[0].meetingId, groupInfos, teamInfos);
  }
}

export class GroupInfo {
  constructor(public groupName: string, public members: MemberInfo[]) {}
}

export class MemberInfo {
  constructor(public memberId: string, public name: string) {}
}

export class GenerateTeamResponse {
  constructor(public meetingId: string, public teamInfos: TeamInfo[]) {}

  static from(outputTeams: OutputTeam[], memberIdToName: Map<string, string>) {
    return new GenerateTeamResponse(
      outputTeams[0].meetingId,
      outputTeams.map((team) => {
        return new TeamInfo(
          team.teamName,
          team.memberIds.map((id) => memberIdToName.get(id))
        );
      })
    );
  }
}

export class TeamInfo {
  constructor(public teamName: string, public memberNames: string[]) {}
}

export class MeetingWithOutputTeam {
  constructor(public meetingId: string, public timestamp: string, public teamName: string, public memberIds: string[]) {}
}
