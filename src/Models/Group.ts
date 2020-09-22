import Member from './Member';

const MIN_NUM_MEMBERS = 12;

class Group {
  id: number;
  name: string;
  members: Member[];

  constructor(id: number, name = `Group ${id + 1}`, members: Member[] = []) {
    this.id = id;
    this.name = name;
    this.members = members;
  }

  updateMembers(members: Member[]) {
    this.members = members;
  }

  get membersWithoutPadding(): Member[] {
    return this.members.filter((v) => v.hasName);
  }

  get hasMember(): boolean {
    return this.membersWithoutPadding.length > 0;
  }
  get paddedMembers(): Member[] {
    const diff = MIN_NUM_MEMBERS - this.members.length;
    if (diff >= 0) {
      this.members = this.members.concat([...Array(diff)].map((_) => new Member(this, '')));
    } else {
      const extra = 4 - (-diff % 4);
      this.members = this.members.concat([...Array(extra)].map((_) => new Member(this, '')));
    }
    return this.members;
  }
}

export default Group;
