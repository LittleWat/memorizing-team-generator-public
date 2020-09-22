import React, { useState } from 'react';


import { Input, Grid, FormLabel, Theme } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogTitle from '@material-ui/core/DialogTitle';
import Fab from '@material-ui/core/Fab';
import Paper from '@material-ui/core/Paper';
import { makeStyles } from '@material-ui/core/styles';
import DeleteIcon from '@material-ui/icons/Delete';

import Group from '../Models/Group';
import Member from '../Models/Member';

const useStyles = makeStyles((theme: Theme) => ({
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
  right: {
    marginLeft: 'auto',
  },
}));

type Props = {
  group: Group;
  updateMembers: (groupId: number, members: Member[]) => void;
  deleteGroup: (groupId: number) => void;
};

const GroupToBeDividedComponent: React.FC<Props> = (props) => {
  const classes = useStyles();
  const [open, setOpen] = useState(false);

  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // 配列をコピーしないと再描画してくれない。ref: https://qiita.com/morry_48/items/c2bb549df42afa15b31e
    const newMembers: Member[] = Object.assign([], props.group.members);
    newMembers[parseInt(event.target.id)] = new Member(props.group, event.target.value);
    props.updateMembers(props.group.id, newMembers);
  };

  const handleTapDeleteButton = () => {
    setOpen(true);
  };

  const handleDelete = () => {
    setOpen(false);
    props.deleteGroup(props.group.id);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <React.Fragment>
      <Paper className={classes.paper}>
        <Grid container alignItems="center">
          <Grid>
            <FormLabel component="legend"> {props.group.name}</FormLabel>
          </Grid>
          <Grid className={classes.right}>
            <Fab color="secondary" aria-label={'Delete'} className={'fab'} onClick={handleTapDeleteButton} size="small">
              <DeleteIcon />
            </Fab>
          </Grid>
        </Grid>

        <Dialog
          open={open}
          onClose={handleClose}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">{'Are you sure to delete?'}</DialogTitle>
          <DialogActions>
            <Button onClick={handleClose} color="primary" autoFocus>
              cancel
            </Button>
            <Button onClick={handleDelete} color="secondary" autoFocus>
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        <Grid container justify="center" spacing={2}>
          {props.group.paddedMembers.map((member, idx) => (
            <Grid key={idx} item xs={3}>
              <Input id={String(idx)} value={member.name} onChange={handleTextChange} />
            </Grid>
          ))}
        </Grid>
      </Paper>
    </React.Fragment>
  );
};

export default GroupToBeDividedComponent;
