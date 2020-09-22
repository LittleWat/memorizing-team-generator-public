import Group from './Group';

class Member {
  group: Group;
  name: string;
  id: string;

  constructor(group: Group, name: string, id = '') {
    this.group = group;
    this.name = name;
    this.id = id;
  }

  get hasName(): boolean {
    return this.name !== null && this.name !== '';
  }
}

export default Member;
