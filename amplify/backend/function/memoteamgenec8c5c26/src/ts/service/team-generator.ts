import InputGroup from '../models/input-group';
import OutputTeam from '../models/output-team';
import ArrayUtil from '../util/ArrayUtil';
import logger from '../util/logger';
import { AdjacentMatrixComputer, AdjacentMatrixComputerFactory, InverseProportionComputer } from './adjacent-matrix-computer';

export enum GenerationMode {
  Random = 'random',
  Smart = 'smart',
}

export namespace GenerationMode {
  export function generatorOf(mode: GenerationMode): TeamGenerator {
    switch (mode) {
      case GenerationMode.Random:
        return new RandomTeamGenerator();
      case GenerationMode.Smart:
        return new SmartTeamGenerator();
    }
  }
}

export interface TeamGenerator {
  generateTeam(hostId: string, inputGroups: InputGroup[], numTeams: number): Promise<OutputTeam[]>;
}

function randomGenerateTeams(inputGroups: InputGroup[], numTeams: number): OutputTeam[] {
  const result: string[][] = [...Array(numTeams)].map((v) => []);
  let restMemberIds: string[] = [];
  inputGroups.forEach((group) => {
    const memberIds = ArrayUtil.shuffle(group.memberIds);
    const oneTeamNum = Math.floor(memberIds.length / numTeams);
    result.forEach((_, j) => {
      result[j] = result[j].concat(memberIds.slice(oneTeamNum * j, oneTeamNum * (j + 1)));
    });
    restMemberIds = restMemberIds.concat(memberIds.slice(oneTeamNum * numTeams));
  });
  restMemberIds = ArrayUtil.shuffle(restMemberIds);

  let cnt = 0;
  while (restMemberIds) {
    const index = cnt % numTeams;
    const tmp = restMemberIds.pop();
    if (typeof tmp == 'undefined') {
      break;
    }
    result[index].push(tmp);
    cnt += 1;
  }
  return result.map((v, i) => new OutputTeam(inputGroups[0].meetingId, `Team${i + 1}`, v));
}

export class RandomTeamGenerator implements TeamGenerator {
  generateTeam(hostId: string, inputGroups: InputGroup[], numTeams: number): Promise<OutputTeam[]> {
    return Promise.resolve(randomGenerateTeams(inputGroups, numTeams));
  }
}

export class SmartTeamGenerator implements TeamGenerator {
  async generateTeam(hostId: string, inputGroups: InputGroup[], numTeams: number): Promise<OutputTeam[]> {
    const factory = await AdjacentMatrixComputerFactory.getInstance(hostId);
    const computer = await factory.createAdjacentMatrixComputer(new InverseProportionComputer());
    return await this.sampleTeam(computer, inputGroups, numTeams);
  }

  private async sampleTeam(
    computer: AdjacentMatrixComputer,
    inputGroups: InputGroup[],
    numTeams: number,
    randomIterNum = 100
  ): Promise<OutputTeam[]> {
    let result: OutputTeam[];
    let lowestFrequency = Number.MAX_SAFE_INTEGER;
    for (let i = 0; i < randomIterNum; i++) {
      const generatedTeams = randomGenerateTeams(inputGroups, numTeams);
      const frequency = computer.computeFrequency(generatedTeams);
      logger.debug(`frequency: ${frequency}`);
      if (frequency < lowestFrequency) {
        result = generatedTeams;
        lowestFrequency = frequency;
      }
    }
    logger.info(`lowest frequency: ${lowestFrequency}`);
    return result;
  }
}
