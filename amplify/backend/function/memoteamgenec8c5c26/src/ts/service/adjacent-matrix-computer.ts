import dynamoConfig from 'config/dynamodb';
import Meeting from 'models/meeting';
import OutputTeam from 'models/output-team';
import { TeamInfo } from 'models/response';
import MeetingRepository from 'repository/meeting-repository';
import MemberRepository from 'repository/member-repository';
import OutputTeamsRepository from 'repository/output-teams-repository';

export interface WeightComputable {
  computeWeight(idx: number): number;
}

export class InverseProportionComputer implements WeightComputable {
  computeWeight(idx: number): number {
    return 1 / (idx + 1);
  }
}

export class ReturnsOneComputer implements WeightComputable {
  computeWeight(idx: number): number {
    return 1;
  }
}

class IndexedMember {
  constructor(public memberId: string, public name: string, public index: number) {}
}

export class AdjacentMatrixComputer {
  public members: IndexedMember[];
  public mat: number[][];
  id2index: Map<string, number>;

  constructor(members: IndexedMember[]) {
    this.members = members;
    this.mat = this.createAdjacentMatrix(members);

    this.id2index = new Map();
    members.forEach((v) => {
      this.id2index.set(v.memberId, v.index);
    });
  }

  private createAdjacentMatrix(members: IndexedMember[]): number[][] {
    const len = members.length;
    const mat = new Array(len);
    for (let i = 0; i < len; i++) {
      mat[i] = new Array(len);
    }
    for (let j = 0; j < len; j++) {
      for (let i = 0; i < len; i++) {
        mat[j][i] = 0;
      }
    }
    return mat;
  }

  updateMatrix(outputTeams: OutputTeam[], weight: number): void {
    outputTeams.forEach((team) => {
      const indexes = team.memberIds.map((memberId) => this.id2index.get(memberId));
      for (const j of indexes) {
        for (const i of indexes) {
          if (i === j) {
            continue;
          }
          this.mat[j][i] += weight;
        }
      }
    });
  }

  computeFrequency(teams: OutputTeam[]): number {
    let result = 0;
    teams.forEach((team) => {
      const indexes = team.memberIds.map((memberId) => this.id2index.get(memberId));
      for (const j of indexes) {
        for (const i of indexes) {
          if (i === j) {
            continue;
          }
          result += this.mat[j][i];
        }
      }
    });
    return result;
  }
}

export class AdjacentMatrixComputerFactory {
  meetingRepository = new MeetingRepository(dynamoConfig);
  memberRepository = new MemberRepository(dynamoConfig);
  outputTeamsRepository = new OutputTeamsRepository(dynamoConfig);

  previousMeetings: Meeting[] = [];
  members: IndexedMember[] = [];
  previousTeamsList: OutputTeam[][] = [];

  private constructor() {}

  static async getInstance(hostId: string, numMaxHistory = 10): Promise<AdjacentMatrixComputerFactory> {
    const result = new AdjacentMatrixComputerFactory();
    await result.init(hostId, numMaxHistory);
    return result;
  }

  private async init(hostId: string, numMaxHistory: number) {
    this.previousMeetings = await this.meetingRepository.getMeetings(hostId, numMaxHistory);
    this.members = await this.getComputationMembers(hostId);

    for (const meeting of this.previousMeetings) {
      const previousTeams = await this.outputTeamsRepository.findOutputTeams(meeting.meetingId);
      this.previousTeamsList.push(previousTeams);
    }
  }

  private async getComputationMembers(hostId: string): Promise<IndexedMember[]> {
    const memberInfo = await this.memberRepository.findMembers(hostId);
    return memberInfo.map((v, i) => new IndexedMember(v.memberId, v.name, i));
  }

  async createAdjacentMatrixComputer(weightComputer: WeightComputable): Promise<AdjacentMatrixComputer> {
    const computer = new AdjacentMatrixComputer(this.members);
    for (const [i, previousTeams] of this.previousTeamsList.entries()) {
      computer.updateMatrix(previousTeams, weightComputer.computeWeight(i));
    }
    return computer;
  }

  getMeetingHistories(): MeetingHistory[] {
    return this.previousMeetings.map((meeting, i) => {
      const teams = this.previousTeamsList[i];
      return new MeetingHistory(
        meeting.meetingId,
        meeting.timestamp,
        teams.map(
          (team) =>
            new TeamInfo(
              team.teamName,
              team.memberIds.map((v) => this.idToName.get(v))
            )
        )
      );
    });
  }

  private get idToName(): Map<string, string> {
    const memberIdToName = new Map();
    this.members.forEach((v) => memberIdToName.set(v.memberId, v.name));
    return memberIdToName;
  }
}

class MeetingHistory {
  constructor(public meetingId: string, public timestamp: string, public teamInfos: TeamInfo[]) {}
}

export class MeetingHistoryWithMatrix {
  constructor(
    public meetingHistories: MeetingHistory[],
    public members: IndexedMember[],
    public normalMatrix: number[][],
    public weightedMatrix: number[][]
  ) {}
}
