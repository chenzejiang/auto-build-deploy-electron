import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { screen } from 'electron';
import routes from '../constants/routes';
import styles from './Help.css';

export default class Help extends Component {
  constructor() {
    super();
    this.state = {};
  }

  componentWillMount() {}

  render() {
    const boxHeight = `${screen.getPrimaryDisplay().workAreaSize.height -
      140}px`;
    return (
      <div className={styles.container} data-tid="container">
        <div className="header">
          <h2>帮助中心</h2>
          <div className="backButton" data-tid="backButton">
            <Link to={{ pathname: routes.HOME, query: { skip: 'false' } }}>
              <i className="fa fa-arrow-left fa-3x" />
            </Link>
          </div>
        </div>

        <div className={styles.ImgBox} style={{ height: boxHeight }}>
          <img alt="帮助中心" src="./dist/help/config.png" />
        </div>
      </div>
    );
  }
}
