import * as awsServerlessExpressMiddleware from 'aws-serverless-express/middleware';
import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as helmet from 'helmet';
import * as swaggerJSDoc from 'swagger-jsdoc';
import * as swaggerUi from 'swagger-ui-express';

import InputGroup from './models/input-group';
import MemoTeamGenService from './service/memo-team-gen-service';
import logger from './util/logger';

const service = new MemoTeamGenService();

// declare a new express app
const app = express();
app.use(bodyParser.json());
app.use(awsServerlessExpressMiddleware.eventContext());

// Enable CORS for all methods
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

const router = express.Router();

const options = {
  swaggerDefinition: {
    info: {
      title: 'Memo Team Gen API',
      version: '1.0.0.',
      contact: { email: 'littlewat.dev@gmail.com' },
      license: {
        name: 'Apache 2.0',
        url: 'http://www.apache.org/licenses/LICENSE-2.0.html',
      },
    },
  },
  apis: ['./*/app.ts'],
};

router.use('/spec', swaggerUi.serve, swaggerUi.setup(swaggerJSDoc(options)));

/**
 * @swagger
 * definitions:
 *   GroupInfo:
 *     type: "object"
 *     properties:
 *       groupName:
 *         type: "string"
 *         example: "group1"
 *       members:
 *         type: "array"
 *         items:
 *           example:
 *             - memberId: "d-1"
 *               name: "Addison Avery"
 *             - memberId: "d-2"
 *               name: "Alivia Mcclain"
 *
 * @swagger
 * /previous-groups/{hostId}:
 *   get:
 *     summary: get the last input group
 *     description: get the last input group
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: hostId
 *         description: the cognito ID of the meeting host
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: "successful operation"
 *         schema:
 *           type: "object"
 *           properties:
 *             meetingId:
 *               type: "string"
 *               example: "cab5fa20862644afe116219d7842b46e8988e841"
 *             groupInfos:
 *               type: "array"
 *               items:
 *                 $ref: "#/definitions/GroupInfo"
 */
router.get('/lastmeeting/:hostId', async (req, res, next) => {
  try {
    const previousGroups = await service.getLastInputGroups(req.params.hostId);
    const previousTeams = await service.getLastOutputTeams(req.params.hostId);

    const response = await service.convertGroupsToResponse(req.params.hostId, previousGroups, previousTeams);
    res.json(response);
  } catch (error) {
    logger.error(error);
    next(error);
  }
});

/**
 * @swagger
 * definitions:
 *   TeamGenBody:
 *     type: "object"
 *     properties:
 *       mode:
 *         description: generation mode (smart or random)
 *         type: string
 *         example: "smart"
 *       numTeams:
 *         description: number of desired teams
 *         type: number
 *         example: 2
 *       inputGroups:
 *         type: object
 *         properties:
 *           groupName:
 *             type: "string"
 *             example: "group1"
 *           members:
 *             type: "array"
 *             items:
 *               example:
 *                 - memberId: "d-1"
 *                   name: "Addison Avery"
 *                 - memberId: "d-2"
 *                   name: "Alivia Mcclain"
 *   TeamInfo:
 *     type: "object"
 *     properties:
 *       teamName:
 *         type: "string"
 *         example: "group1"
 *       memberNames:
 *         type: "array"
 *         items:
 *           example:
 *             - "Alivia Mcclain"
 *             - "Anand Wheatley"
 *             - "Jana Sharp"
 *
 * @swagger
 * /teamgen/{hostId}:
 *   post:
 *     summary: generate teams
 *     description: generate teams randomly or smartly depending on the parameter
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: hostId
 *         description: the cognito ID of the meeting host
 *         in: path
 *         required: true
 *         type: string
 *       - name: body
 *         in: body
 *         required: true
 *         schema:
 *           $ref: "#/definitions/TeamGenBody"
 *     responses:
 *       201:
 *         description: "successful team generation"
 *         schema:
 *           type: "object"
 *           properties:
 *             meetingId:
 *               type: "string"
 *               example: "cab5fa20862644afe116219d7842b46e8988e841"
 *             groupInfos:
 *               type: "array"
 *               items:
 *                 $ref: "#/definitions/TeamInfo"
 */
router.post('/teamgen/:hostId/', async (req, res, next) => {
  try {
    const hostId = req.params.hostId;

    // Register new members
    let newMemberNames: string[] = [];
    req.body.inputGroups.forEach((group) => {
      // memberId == "" means new member
      newMemberNames = newMemberNames.concat(group.members.filter((v) => !v.memberId).map((v) => v.name));
    });

    const newMembers = await service.saveMembers(hostId, newMemberNames);

    const newMemberNameToId = new Map();
    newMembers.forEach((v) => newMemberNameToId.set(v.name, v.memberId));

    logger.info(newMemberNameToId);

    // Generate Teams
    const meetingId = MemoTeamGenService.generateRandomId();

    const inputGroups = req.body.inputGroups.map((group) => {
      return new InputGroup(
        meetingId,
        group.groupName,
        group.members.map((v) => {
          if (!v.memberId) {
            return newMemberNameToId.get(v.name);
          }
          return v.memberId;
        })
      );
    });

    const generatedTeams = await service.generateTeams(hostId, inputGroups, req.body.numTeams, req.body.mode);

    // Save meeting info
    await service.saveMeeting(hostId, meetingId, inputGroups, generatedTeams);

    const response = await service.convertTeamsToResponse(hostId, generatedTeams);
    res.status(201).json(response);
  } catch (error) {
    logger.error(error);
    next(error);
  }
});

router.get('/history/:hostId', async (req, res, next) => {
  try {
    const hostId = req.params.hostId;
    const response = await service.getPreviousMeetings(hostId);
    res.json(response);
  } catch (error) {
    logger.error(error);
    next(error);
  }
});

app.listen(3000, function () {
  logger.info('App started');
});

app.use('/api-teamgen', router);

app.use(helmet());

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
export default app;
