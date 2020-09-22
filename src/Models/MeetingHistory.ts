export class MeetingHistoryWithMatrix {
  constructor(
    public meetingHistories: MeetingHistory[] = [],
    public members: IndexedMember[] = [],
    public normalMatrix: number[][] = [[]],
    public weightedMatrix: number[][] = [[]]
  ) {}
}

export class MeetingHistory {
  constructor(public meetingId: string, public timestamp: string, public teamInfos: TeamInfo[]) {}
}

export class TeamInfo {
  constructor(public teamName: string, public memberNames: string[]) {}
}

export class IndexedMember {
  constructor(public memberId: string, public name: string, public index: number) {}
}
