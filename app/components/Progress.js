import React from 'react';
import PropTypes from 'prop-types';
import styles from './Progress.css';
/**
 * 说明：进度条
 * 调用：<Progress maxper={progressAllNum} per={progressPer} />
 * props: per = 进度数， maxper = 最大进度数
 */
export default class Progress extends React.Component {
  static propTypes = {
    maxper: PropTypes.number.isRequired,
    per: PropTypes.number.isRequired
  };

  componentWillMount() {}

  render() {
    const { maxper, per } = this.props;
    const progressNum = `${Number(((per / maxper) * 100).toFixed(2))}%`;
    const styleActive = maxper !== per ? styles.active : '';
    return (
      <div className={`${styles.progress}`}>
        <div
          className={`${styles.progressBar} ${styles.progressBarStriped} ${styleActive}`}
          role="progressbar"
          style={{ width: progressNum }}
        >
          <div className={styles.progressValue}>{progressNum}</div>
        </div>
      </div>
    );
  }
}
