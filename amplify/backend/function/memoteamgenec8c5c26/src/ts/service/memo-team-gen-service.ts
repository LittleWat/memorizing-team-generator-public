import * as crypto from 'crypto';

import dynamoConfig from '../config/dynamodb';
import InputGroup from '../models/input-group';
import Meeting from '../models/meeting';
import Member from '../models/member';
import OutputTeam from '../models/output-team';
import { GenerateTeamResponse, PreviousMeetingResponse } from '../models/response';
import InputGroupsRepository from '../repository/input-groups-repository';
import MeetingRepository from '../repository/meeting-repository';
import MemberRepository from '../repository/member-repository';
import OutputTeamsRepository from '../repository/output-teams-repository';
import logger from '../util/logger';
import {
  AdjacentMatrixComputerFactory,
  InverseProportionComputer,
  MeetingHistoryWithMatrix,
  ReturnsOneComputer,
} from './adjacent-matrix-computer';
import { GenerationMode, SmartTeamGenerator } from './team-generator';

export default class MemoTeamGenService {
  meetingRepository = new MeetingRepository(dynamoConfig);
  inputGroupsRepository = new InputGroupsRepository(dynamoConfig);
  outputTeamsRepository = new OutputTeamsRepository(dynamoConfig);
  memberRepository = new MemberRepository(dynamoConfig);

  async getLastInputGroups(hostId: string) {
    const lastMeetingId = await this.findLastMeetingId(hostId);
    return await this.inputGroupsRepository.findInputGroups(lastMeetingId);
  }

  async getLastOutputTeams(hostId: string) {
    const lastMeetingId = await this.findLastMeetingId(hostId);
    return await this.outputTeamsRepository.findOutputTeams(lastMeetingId);
  }

  async getPreviousMeetings(hostId: string): Promise<MeetingHistoryWithMatrix> {
    const factory = await AdjacentMatrixComputerFactory.getInstance(hostId);
    const normalComputer = await factory.createAdjacentMatrixComputer(new ReturnsOneComputer());
    const weightedComputer = await factory.createAdjacentMatrixComputer(new InverseProportionComputer());

    return new MeetingHistoryWithMatrix(
      factory.getMeetingHistories(),
      factory.members,
      normalComputer.mat,
      weightedComputer.mat
    );
  }

  private async findLastMeetingId(hostId: string) {
    const pastMeetingIds = await this.meetingRepository.getMeetings(hostId, 1);
    const lastMeetingId = pastMeetingIds[0].meetingId;
    logger.debug(`lastMeetingId: ${lastMeetingId}`);
    return lastMeetingId;
  }

  async convertGroupsToResponse(
    hostId: string,
    inputGroups: InputGroup[],
    outputTeams: OutputTeam[]
  ): Promise<PreviousMeetingResponse> {
    const memberIdToName = await this.getMemberIdToName(hostId);
    return PreviousMeetingResponse.from(inputGroups, outputTeams, memberIdToName);
  }

  async saveMembers(hostId: string, names: string[]): Promise<Member[]> {
    const newMembers = names.map((v) => new Member(hostId, MemoTeamGenService.generateRandomId(), v));
    await this.memberRepository.registerMembers(newMembers);
    return newMembers;
  }

  async generateTeams(
    hostId: string,
    inputGroups: InputGroup[],
    numTeams: number,
    mode: GenerationMode
  ): Promise<OutputTeam[]> {
    const generator = GenerationMode.generatorOf(mode);
    logger.info(`generator: ${generator.constructor.name}`);
    return await generator.generateTeam(hostId, inputGroups, numTeams);
  }

  async convertTeamsToResponse(hostId: string, outputTeams: OutputTeam[]): Promise<GenerateTeamResponse> {
    const memberIdToName = await this.getMemberIdToName(hostId);
    return GenerateTeamResponse.from(outputTeams, memberIdToName);
  }

  private async getMemberIdToName(hostId: string): Promise<Map<string, string>> {
    const memberInfo = await this.memberRepository.findMembers(hostId);
    const memberIdToName = new Map();
    memberInfo.forEach((v) => memberIdToName.set(v.memberId, v.name));
    return memberIdToName;
  }

  async saveMeeting(hostId: string, meetingId: string, inputGroups: InputGroup[], outputTeams: OutputTeam[]) {
    const nowTimestampSeconds = String(Math.floor(Date.now() / 1000));
    const meeting = new Meeting(hostId, nowTimestampSeconds, meetingId);

    const results = [
      this.inputGroupsRepository.saveGroups(inputGroups),
      this.outputTeamsRepository.saveTeams(outputTeams),
      this.meetingRepository.saveMeeting(meeting),
    ];

    await Promise.all(results);
    logger.debug('all saved successfully!');
  }

  static generateRandomId = () => {
    const current_date = new Date().valueOf().toString();
    const random = Math.random().toString();
    return crypto
      .createHash('sha1')
      .update(current_date + random)
      .digest('hex');
  };
}
