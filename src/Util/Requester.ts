import { API, Auth } from 'aws-amplify';

import { MeetingHistoryWithMatrix } from 'Models/MeetingHistory';
import { TeamGenRequest } from 'Models/Request';

class Requester {
  private static API_NAME = 'teamgenapi';

  private userId = '';
  private myInit = {};

  private static instance: Requester;
  private constructor() {}
  private static async init() {
    const userInfo = await Auth.currentUserInfo();
    const sessionInfo = await Auth.currentSession();
    Requester.instance.userId = userInfo.id;
    Requester.instance.myInit = {
      headers: {
        Authorization: `Bearer ${sessionInfo.getIdToken().getJwtToken()}`,
        Accept: 'application/json',
      },
    };
  }
  static async getInstance(): Promise<Requester> {
    if (!Requester.instance) {
      Requester.instance = new Requester();
      await Requester.init();
    }
    return Requester.instance;
  }

  async findLastMeeting() {
    const path = `/api-teamgen/lastmeeting/${this.userId}`;
    return await API.get(Requester.API_NAME, path, this.myInit);
  }

  async generateTeams(request: TeamGenRequest) {
    const path = `/api-teamgen/teamgen/${this.userId}`;
    return await API.post(
      Requester.API_NAME,
      path,
      Object.assign(this.myInit, {
        body: request,
      })
    );
  }

  async fetchMeetingHistories(): Promise<MeetingHistoryWithMatrix> {
    const path = `/api-teamgen/history/${this.userId}`;
    return await API.get(Requester.API_NAME, path, this.myInit);
  }
}

export default Requester;
