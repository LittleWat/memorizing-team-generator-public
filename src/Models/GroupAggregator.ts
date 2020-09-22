import ArrayUtil from '../Util/ArrayUtil';
import Requester from '../Util/Requester';
import Group from './Group';
import Member from './Member';
import { InputGroups, TeamGenRequest } from './Request';
import { MemberInfo, OutputTeamInfo } from './Response';

class GroupAggregator {
  id2group: Map<number, Group>;

  constructor(initGroupNum = 2) {
    this.id2group = new Map<number, Group>();
    for (let i = 0; i < initGroupNum; i++) {
      this.id2group.set(i, new Group(i));
    }
  }

  get groups(): Group[] {
    return Object.assign([], [...this.id2group.values()]);
  }

  get numGroups(): number {
    return this.groups.length;
  }

  get numMembers(): number {
    return this.groups.map((group) => group.members).flat().length;
  }

  addGroup() {
    const newId = [...this.id2group.keys()].reduce((a, b) => (a > b ? a : b)) + 1;
    this.id2group.set(newId, new Group(newId));
  }

  deleteGroup(groupId: number) {
    if (this.id2group.size <= 1) {
      throw new Error('You can delete this group when you have more than 1 group');
    }
    this.id2group.delete(groupId);
  }

  updateGroup(groupId: number, members: Member[]) {
    const tmp: Group = this.groupFrom(groupId);
    tmp.updateMembers(members);
    this.id2group.set(groupId, tmp);
  }

  groupFrom(groupId: number): Group {
    const result = this.id2group.get(groupId);
    if (typeof result == 'undefined') {
      throw Error(`GroupId:${groupId} は存在しません。id2group:${this.id2group}`);
    }
    return result;
  }

  generateTeamsLocally(numTeams: number): string[][] {
    const result: string[][] = [...Array(numTeams)].map((v) => []);
    let restMembers: string[] = [];
    this.groups
      .filter((group) => group.hasMember)
      .forEach((group, i) => {
        let members = group.membersWithoutPadding.map((v) => v.name);
        members = ArrayUtil.shuffle(members);
        const oneTeamNum = Math.floor(members.length / numTeams);
        result.forEach((team, j) => {
          result[j] = result[j].concat(members.slice(oneTeamNum * j, oneTeamNum * (j + 1)));
        });
        restMembers = restMembers.concat(members.slice(oneTeamNum * numTeams));
      });
    restMembers = ArrayUtil.shuffle(restMembers);

    let cnt = 0;
    while (restMembers) {
      const idx = cnt % numTeams;
      const tmp = restMembers.pop();
      if (typeof tmp == 'undefined') {
        break;
      }
      result[idx].push(tmp);
      cnt += 1;
    }
    return result;
  }

  async generateTeamsRemotely(generateMode: string, numTeams: number): Promise<string[][]> {
    const inputGroups = this.groups
      .filter((v) => v.hasMember)
      .map(
        (v) =>
          new InputGroups(
            v.name,
            v.membersWithoutPadding.map((m) => new MemberInfo(m.id, m.name))
          )
      );

    const requester = await Requester.getInstance();
    const response = await requester.generateTeams(new TeamGenRequest(generateMode, numTeams, inputGroups));

    return response.teamInfos.map((v: OutputTeamInfo) => v.memberNames);
  }
}

export default GroupAggregator;
