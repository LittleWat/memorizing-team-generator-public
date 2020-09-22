import React from 'react';

import { AmplifyAuthenticator, AmplifySignUp, AmplifySignIn } from '@aws-amplify/ui-react';
import CssBaseline from '@material-ui/core/CssBaseline';
import Amplify from 'aws-amplify';
import { Route, BrowserRouter as Router } from 'react-router-dom';

import HomeScreen from 'Components/HomeScreen';
import MeetingHistoryScreen from 'Components/MeetingHistoryScreen';

import awsExports from './aws-exports';
import ButtonAppBar from './Components/ButtonAppBar';

Amplify.configure(awsExports);

const signStyle = {
  display: 'flex',
  'justify-content': 'center',
  'align-items': 'center',
  flex: 1,
  height: '100vh',
};

function App() {
  return (
    <AmplifyAuthenticator>
      <div slot="sign-in" style={signStyle}>
        <AmplifySignIn usernameAlias="email" />
      </div>
      <AmplifySignUp
        slot="sign-up"
        style={signStyle}
        usernameAlias="email"
        formFields={[
          {
            type: 'email',
            label: 'Email address',
            placeholder: 'Enter your email address',
            required: true,
          },
          {
            type: 'password',
            label: 'Password',
            placeholder: 'Enter your password',
            required: true,
          },
        ]}
      ></AmplifySignUp>
      <React.Fragment>
        <Router>
          <CssBaseline />
          <ButtonAppBar />
          <Route exact path="/" component={HomeScreen} />
          <Route path="/history" component={MeetingHistoryScreen} />
        </Router>
      </React.Fragment>
    </AmplifyAuthenticator>
  );
}

export default App;
