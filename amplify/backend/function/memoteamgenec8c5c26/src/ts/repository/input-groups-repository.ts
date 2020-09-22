import DynamoDB from '@awspilot/dynamodb';
import InputGroup from '../models/input-group';
import logger from '../util/logger';

export default class InputGroupsRepository {
  /**
   * コンストラクタ
   * @param {DynamoDB} db `@awspilot/dynamodb` モジュール
   */
  constructor(private db: DynamoDB) {}

  TABLE_NAME = 'memoteamgen-InputGroup';

  async findInputGroups(meetingId: string) {
    return await this.db
        .table(this.TABLE_NAME)
        .select(['meetingId', 'groupName', 'memberIds'])
        .where('meetingId')
        .eq(meetingId)
        .query();
  }

  async saveGroups(inputGroups: InputGroup[]) {
    let batch = this.db.batch().table(this.TABLE_NAME);
    inputGroups.forEach(
      (v) =>
        (batch = batch.put({
          meetingId: v.meetingId,
          groupName: v.groupName,
          memberIds: new Set(v.memberIds),
        }))
    );
    return new Promise(function (resolve, reject) {
      if (inputGroups.length <= 0 || inputGroups.length > 25) {
        return reject(new Error(`inputGroupsのlengthを1~25に設定してください。 length: ${inputGroups.length}`));
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
