import React, { useState, useEffect } from 'react';

import Backdrop from '@material-ui/core/Backdrop';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Fab from '@material-ui/core/Fab';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormLabel from '@material-ui/core/FormLabel';
import Grid from '@material-ui/core/Grid';
import Link from '@material-ui/core/Link';
import Paper from '@material-ui/core/Paper';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import { makeStyles, Theme } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import AddIcon from '@material-ui/icons/Add';
import Amplify, { Analytics } from 'aws-amplify';

import Requester from 'Util/Requester';

import awsExports from '../aws-exports';
import Group from '../Models/Group';
import GroupAggregator from '../Models/GroupAggregator';
import Member from '../Models/Member';
import { GroupInfo, OutputTeamInfo } from '../Models/Response';
import GroupToBeDividedComponent from './GroupToBeDividedComponent';

Amplify.configure(awsExports);

function Copyright() {
  return (
    <Typography variant="body2" color="textSecondary" align="center">
      {'Copyright © '}
      <Link color="inherit" href="https://littlewat.github.io/">
        Kohei Watanabe
      </Link>{' '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  );
}

const useStyles = makeStyles((theme: Theme) => ({
  appBar: {
    position: 'relative',
  },
  layout: {
    width: 'auto',
    fontSize: 20,
    marginLeft: theme.spacing(2),
    marginRight: theme.spacing(2),
    [theme.breakpoints.up(800 + theme.spacing(2) * 2)]: {
      width: 800,
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
}));

let groupAggregator = new GroupAggregator();

function HomeScreen() {
  const classes = useStyles();

  const [inputGroups, setInputGroups] = useState(groupAggregator.groups);
  const [outputTeams, setOutputTeams] = useState([...Array(2)].map((v) => Array(0)));
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generateMode, setGenerateMode] = useState('smart');

  useEffect(() => {
    const f = async () => {
      setIsLoading(true);
      await setLastMeeting();
      setIsLoading(false);
    };
    f();

    Analytics.record({
      name: 'show_HomeScreen',
    });
  }, []);

  async function setLastMeeting() {
    try {
      const requester = await Requester.getInstance();
      const response = await requester.findLastMeeting();
      const lastGroupNum = response.groupInfos.length;

      groupAggregator = new GroupAggregator(lastGroupNum);

      response.groupInfos.forEach((groupInfo: GroupInfo, i: number) => {
        const group = new Group(i, groupInfo.groupName);
        const members: Member[] = groupInfo.members.map((v) => new Member(group, v.name, v.memberId));
        setInputGroupMembers(i, members);
      });

      setOutputTeams(response.teamInfos.map((v: OutputTeamInfo) => v.memberNames));
    } catch (err) {
      console.error(err);
    }
  }

  async function setLastInputGroups() {
    const requester = await Requester.getInstance();
    const response = await requester.findLastMeeting();
    const lastGroupNum = response.groupInfos.length;

    groupAggregator = new GroupAggregator(lastGroupNum);

    response.groupInfos.forEach((groupInfo: GroupInfo, i: number) => {
      const group = new Group(i, groupInfo.groupName);
      const members: Member[] = groupInfo.members.map((v) => new Member(group, v.name, v.memberId));
      setInputGroupMembers(i, members);
    });
  }

  const setInputGroupMembers = (groupId: number, members: Member[]) => {
    groupAggregator.updateGroup(groupId, members);
    setInputGroups(groupAggregator.groups);
  };

  const deleteGroup = (groupId: number) => {
    try {
      groupAggregator.deleteGroup(groupId);
      setInputGroups(groupAggregator.groups);
    } catch (e) {
      console.log(`エラー発生 ${e}`);
    }
  };

  const addInputGroup = () => {
    groupAggregator.addGroup();
    setInputGroups(groupAggregator.groups);
  };

  const handleChangeNumTeams = (event: React.ChangeEvent<HTMLInputElement>) => {
    const tmpNumTeams = Number(event.target.value);
    setOutputTeams([...Array(tmpNumTeams)].map((v) => []));
  };

  const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setGenerateMode(event.target.value);
  };

  const handleGenerateTeams = async () => {
    setIsLoading(true);

    const numInputMembers = groupAggregator.numMembers;
    const numTeams = outputTeams.length;
    if (numTeams > numInputMembers || numInputMembers === 0) {
      setOpen(true);
      setIsLoading(false);
      return;
    }
    try {
      const result = await groupAggregator.generateTeamsRemotely(generateMode, numTeams);
      setOutputTeams(result);

      // Call this to update new memberId
      await setLastInputGroups();
    } catch (err) {}

    setIsLoading(false);

    Analytics.record({
      name: 'click_GenerateTeams',
      attributes: {
        numMembers: numInputMembers,
        numInputGroups: groupAggregator.numGroups,
        numOutputGroups: numTeams,
      },
    });
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <React.Fragment>
      <Backdrop className={classes.backdrop} open={isLoading}>
        <CircularProgress color="inherit" />
      </Backdrop>

      <FormLabel component="h1" className={classes.layout}>
        This app can memorize the past team generations and generate teams smartly.
      </FormLabel>
      <main className={classes.layout}>
        <Paper className={classes.paper}>
          <FormLabel component="h1">Input groups that should be divided</FormLabel>
          {inputGroups.map((group) => (
            <GroupToBeDividedComponent group={group} updateMembers={setInputGroupMembers} deleteGroup={deleteGroup} />
          ))}
          <Box textAlign="center">
            <Fab color="secondary" aria-label={'Add'} className={'fab'} onClick={addInputGroup}>
              <AddIcon />
            </Fab>
          </Box>
        </Paper>

        <Box textAlign="center">
          <FormControl>
            <TextField
              label="Desired Team Number"
              id="component-simple"
              type="number"
              value={outputTeams.length}
              onChange={handleChangeNumTeams}
              helperText="should be more than 0"
              inputProps={{ min: '1', step: '1' }}
            />
          </FormControl>
        </Box>

        <Box textAlign="center" mt={5}>
          <FormControl component="fieldset">
            <FormLabel component="legend">GenerateMode</FormLabel>
            <RadioGroup aria-label="generateMode" name="generateMode" value={generateMode} onChange={handleRadioChange}>
              <FormControlLabel value="smart" control={<Radio />} label="smart" />
              <FormControlLabel value="random" control={<Radio />} label="random" />
            </RadioGroup>
          </FormControl>
        </Box>

        <Box textAlign="center">
          <Button variant="contained" onClick={handleGenerateTeams} className={classes.button} color="primary">
            Generate Team
          </Button>
        </Box>

        <Dialog
          open={open}
          onClose={handleClose}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">{'Error'}</DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              The number of input members should be more than that of the output teams.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} color="primary" autoFocus>
              OK
            </Button>
          </DialogActions>
        </Dialog>

        <Paper className={classes.paper}>
          <FormLabel component="legend"> Result </FormLabel>
          {outputTeams.map((outputTeam, i) => (
            <Paper className={classes.paper}>
              <FormLabel component="legend"> Team {i + 1} </FormLabel>
              <Grid container justify="center" spacing={2}>
                {outputTeam.map((v, j) => (
                  <Grid key={j} item xs={3}>
                    <FormLabel component="h1">{v}</FormLabel>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          ))}
        </Paper>

        <Box textAlign="center" m={5}>
          <Copyright />
        </Box>
      </main>
    </React.Fragment>
  );
}

export default HomeScreen;
