import * as DynamoDB from '@awspilot/dynamodb';

import Meeting from 'models/meeting';
import logger from 'util/logger';

export default class MeetingRepository {
  /**
   * コンストラクタ
   * @param {DynamoDB} db `@awspilot/dynamodb` モジュール
   */
  constructor(private db: DynamoDB) {}

  TABLE_NAME = 'memoteamgen-Meeting';

  async getMeetings(hostId: string, recentTopN: number): Promise<Meeting[]> {
    logger.debug(`hostId: ${hostId}, recentTopN: ${recentTopN}`);
    const result = await this.db
      .table(this.TABLE_NAME)
      .select(['hostId', 'timestamp', 'meetingId'])
      .where('hostId')
      .eq(hostId)
      .descending()
      .limit(recentTopN)
      .query();

    logger.debug(`getMeetingResult: ${JSON.stringify(result)}`);

    return result;
  }

  async saveMeeting(meeting: Meeting) {
    return await this.db.table(this.TABLE_NAME).insert(meeting);
  }
}
