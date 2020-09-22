import * as DynamoDB from '@awspilot/dynamodb';

const initialize = (options = { region: 'ap-northeast-1' }) => {
  return DynamoDB(options);
};

export default initialize();
