import DynamoDB from '@awspilot/dynamodb';

import OutputTeam from '../models/output-team';
import logger from '../util/logger';

export default class OutputTeamsRepository {
  /**
   * コンストラクタ
   * @param {DynamoDB} db `@awspilot/dynamodb` モジュール
   */
  constructor(private db: DynamoDB) {}

  TABLE_NAME = 'memoteamgen-OutputTeam';

  async findOutputTeams(meetingId: string): Promise<OutputTeam[]> {
    let result = await this.db
      .table(this.TABLE_NAME)
      .select(['meetingId', 'teamName', 'memberIds'])
      .where('meetingId')
      .eq(meetingId)
      .query();

    result = result.map((v) => {
      return { meetingId: v.meetingId, teamName: v.teamName, memberIds: Array.from(v.memberIds) };
    });

    return result;
  }

  async saveTeams(outputTeams: OutputTeam[]) {
    let batch = this.db.batch().table(this.TABLE_NAME);
    outputTeams.forEach(
      (v) =>
        (batch = batch.put({
          meetingId: v.meetingId,
          teamName: v.teamName,
          memberIds: new Set(v.memberIds),
        }))
    );
    return new Promise(function (resolve, reject) {
      if (outputTeams.length <= 0 || outputTeams.length > 25) {
        return reject(new Error(`outputTeamsのlengthを1~25に設定してください。 length: ${outputTeams.length}`));
      }
      batch.write(function (err, data) {
        if (err) {
          return reject(new Error(`batch insertに失敗しました。 err: ${err}`));
        }
        logger.debug('Success', data);
        return resolve(data);
      });
    });
  }
}
