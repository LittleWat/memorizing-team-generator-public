import React, { useState, useEffect } from 'react';

import Backdrop from '@material-ui/core/Backdrop';
import CircularProgress from '@material-ui/core/CircularProgress';
import FormLabel from '@material-ui/core/FormLabel';
import Paper from '@material-ui/core/Paper';
import { makeStyles, Theme } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Amplify, { Analytics } from 'aws-amplify';
import moment from 'moment';
import Chart from 'react-apexcharts';

import { MeetingHistoryWithMatrix } from 'Models/MeetingHistory';
import Requester from 'Util/Requester';

import awsExports from '../aws-exports';
import Title from './Title';

Amplify.configure(awsExports);

const useStyles = makeStyles((theme: Theme) => ({
  appBar: {
    position: 'relative',
  },
  layout: {
    width: 'auto',
    fontSize: 20,
    marginLeft: theme.spacing(2),
    marginRight: theme.spacing(2),
    [theme.breakpoints.up(1200 + theme.spacing(2) * 2)]: {
      width: 1200,
      marginLeft: 'auto',
      marginRight: 'auto',
    },
  },
  paper: {
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(3),
    padding: theme.spacing(2),
    [theme.breakpoints.up(600 + theme.spacing(3) * 2)]: {
      marginTop: theme.spacing(6),
      marginBottom: theme.spacing(6),
      padding: theme.spacing(3),
    },
  },
  stepper: {
    padding: theme.spacing(3, 0, 5),
  },
  buttons: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  button: {
    marginTop: theme.spacing(3),
    marginLeft: theme.spacing(1),
    justifyContent: 'center',
  },
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: '#fff',
  },
  table: {
    minWidth: 300,
  },
  cell: {
    color: 'red',
    backgroundColor: 'blue',
  },
}));

function MeetingHistroryScreen() {
  const classes = useStyles();

  const [isLoading, setIsLoading] = useState(false);
  const [meetingHistories, setMeetingHistories] = useState(new MeetingHistoryWithMatrix([], [], [[]], [[]]));
  const [maxWeightedValue, setMaxWeightedValue] = useState(1);

  useEffect(() => {
    const f = async () => {
      setIsLoading(true);
      await fetchMeetingHistories();
      setIsLoading(false);
    };
    f();

    Analytics.record({
      name: 'show_MeetingHistoryScreen',
    });
  }, []);

  async function fetchMeetingHistories() {
    try {
      const requester = await Requester.getInstance();
      const response = await requester.fetchMeetingHistories();
      const maxRow: number[] = response.weightedMatrix.map((row: number[]) => Math.max(...row));

      setMaxWeightedValue(Math.max(...maxRow));
      setMeetingHistories(response);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <React.Fragment>
      <Backdrop className={classes.backdrop} open={isLoading}>
        <CircularProgress color="inherit" />
      </Backdrop>

      <FormLabel component="h1" className={classes.layout}>
        Past Meetings Information
      </FormLabel>
      <main className={classes.layout}>
        <Paper className={classes.paper}>
          {meetingHistories.members.length ? (
            <Chart
              options={{
                xaxis: { categories: meetingHistories.members.map((v) => v.name) },
                title: {
                  text: `Number of WEIGHTED(Recent is High) combinations of ${meetingHistories.meetingHistories.length} recent meetings`,
                },
                colors: ['#F27036'],
              }}
              series={meetingHistories.weightedMatrix.map(
                (arr, i) =>
                  new Series(
                    meetingHistories.members[i].name,
                    arr.map((v) => Math.floor((v / maxWeightedValue) * 100))
                  )
              )}
              type="heatmap"
            />
          ) : (
            ''
          )}
        </Paper>
        <Paper className={classes.paper}>
          {meetingHistories.members.length ? (
            <Chart
              options={{
                xaxis: { categories: meetingHistories.members.map((v) => v.name) },
                title: {
                  text: `Number of combinations of {meetingHistories.meetingHistories.length} recent meetingss`,
                },
                colors: ['#008FFB'],
              }}
              series={meetingHistories.normalMatrix.map((arr, i) => new Series(meetingHistories.members[i].name, arr))}
              type="heatmap"
            />
          ) : (
            ''
          )}
        </Paper>

        <TableContainer component={Paper} className={classes.paper}>
          <Title>History of {meetingHistories.meetingHistories.length} recent meetings</Title>
          <Table className={classes.table} aria-label="meeting history">
            <TableHead>
              <TableRow>
                <TableCell align="left">Time</TableCell>
                <TableCell align="left">Members</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {meetingHistories.meetingHistories.length
                ? meetingHistories.meetingHistories.map((history) =>
                    history.teamInfos.map((team, i) => (
                      <TableRow key={`${history.meetingId}+${team.teamName}`}>
                        {i === 0 ? (
                          <TableCell align="left" rowSpan={history.teamInfos.length}>
                            {moment(parseInt(history.timestamp) * 1000).format()}
                          </TableCell>
                        ) : (
                          ''
                        )}
                        <TableCell align="left">{team.memberNames.join(', ')}</TableCell>
                      </TableRow>
                    ))
                  )
                : ''}
            </TableBody>
          </Table>
        </TableContainer>
      </main>
    </React.Fragment>
  );
}

class Series {
  constructor(public name: string, public data: number[]) {}
}

export default MeetingHistroryScreen;
