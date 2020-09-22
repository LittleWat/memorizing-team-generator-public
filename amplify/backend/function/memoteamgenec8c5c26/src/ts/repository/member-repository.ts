import DynamoDB from '@awspilot/dynamodb';
import Member from '../models/member';
import logger from '../util/logger';

export default class MemberRepository {
  /**
   * コンストラクタ
   * @param {DynamoDB} db `@awspilot/dynamodb` モジュール
   */
  constructor(private db: DynamoDB) {}

  TABLE_NAME = 'memoteamgen-Member';

  async registerMembers(members: Member[]) {
    const limitBatchN = 25;
    let pwd = 0;
    while (pwd < members.length) {
      const batchMembers = members.slice(pwd, pwd + limitBatchN);
      logger.debug(`batchMembers: ${JSON.stringify(batchMembers)}`);
      const oneResult = await this.registerOneBatchMembers(batchMembers);
      logger.debug(`oneResult: ${oneResult}`);
      pwd += limitBatchN;
    }
    logger.debug('registerMembers has finished!');
  }

  async registerOneBatchMembers(batchMembers: Member[]) {
    let batch = this.db.batch().table(this.TABLE_NAME);
    batchMembers.forEach((v) => (batch = batch.put(v)));
    return new Promise(function (resolve, reject) {
      if (batchMembers.length <= 0 || batchMembers.length > 25) {
        return reject(new Error(`batchMembersのlengthを1~25に設定してください。 length: ${batchMembers.length}`));
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

  async findMembers(hostId: string) {
    return await this.db.table(this.TABLE_NAME).select(['memberId', 'name']).where('hostId').eq(hostId).query();
  }
}
