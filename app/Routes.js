import React from 'react';
import { Switch, Route } from 'react-router';
import routes from './constants/routes';
import App from './containers/App';
import HomePage from './containers/HomePage';
import CounterPage from './containers/CounterPage';
import HelpPage from './containers/HelpPage';
import BuildPage from './containers/BuildPage';

export default () => (
  <App>
    <Switch>
      <Route exact path={routes.COUNTER} component={CounterPage} />
      <Route exact path={routes.HELP} component={HelpPage} />
      <Route exact path={routes.BUILD} component={BuildPage} />
      <Route exact path={routes.HOME} component={HomePage} />
    </Switch>
  </App>
);
