import React from 'react';
import styles from './Hint.css';

/**
 * 说明：公告提示框
 * 调用：this.refs.hint.show('loading..',1);
 */
export default class Hint extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      show: false,
      txt: ''
    };
  }

  /**
   * 显示提示框，1秒后关闭
   */
  show(_str = 'Hello World', _time = 3) {
    this.setState({ show: true, txt: _str });
    if (_time !== '999') {
      setTimeout(() => {
        this.setState({ show: false });
      }, _time * 1000);
    }
  }

  render() {
    const { show, txt } = this.state;
    return (
      <div
        className={[styles.hint]}
        style={{ display: show === true ? 'block' : 'none' }}
        data-tid="hint"
      >
        {txt}
      </div>
    );
  }
}
