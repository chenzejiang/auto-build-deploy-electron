import React, { Component } from 'react';
import { withRouter, Link } from 'react-router-dom';
import { screen, remote } from 'electron';
import routes from '../constants/routes';
import styles from './Home.css';
import Hint from '../components/Hint';
import checkWalleUserInfo from './checkWalleUserInfo';

const { dialog } = remote;

class Home extends Component {
  constructor(props) {
    super(props);
    this.state = {
      list: [
        {
          name: '',
          data: {}
        }
      ],
      walleInfo: {
        username: '',
        password: ''
      },
      chromePath: localStorage.getItem('chromePath')
    };
  }

  componentWillMount() {
    if (localStorage.getItem('projectBuild') !== null) {
      const list = JSON.parse(localStorage.getItem('projectBuild'));
      this.setState({ list });
    }
    if (localStorage.getItem('walleInfo') !== null) {
      const walleInfo = JSON.parse(localStorage.getItem('walleInfo'));
      this.setState({ walleInfo });
    }
  }

  componentDidMount() {}

  /**
   * 项目名称文本框改变
   * @param index
   * @param event
   */
  handelChange(index, event) {
    const { list } = this.state;
    list[index].name = event.target.value;
    this.setState({ list }, () => {
      localStorage.setItem('projectBuild', JSON.stringify(list));
    });
  }

  /**
   * walle改变帐号密码
   * @param key 键值
   */
  walleInfoChange(key, event) {
    const { walleInfo } = this.state;
    walleInfo[key] = event.target.value;
    this.setState({ walleInfo }, () => {
      localStorage.setItem('walleInfo', JSON.stringify(walleInfo));
    });
  }

  /**
   * 跳转打包页面
   */
  goBuild(item, index) {
    if (item.name === '') {
      this.hint.show(`项目名称不能为空`);
      return;
    }

    const { walleInfo } = this.state;
    if (walleInfo.username !== '' && walleInfo.password !== '') {
      // eslint-disable-next-line react/prop-types
      const { history: propHistory } = this.props;
      localStorage.setItem('autoBuildIndex', index);
      propHistory.push({
        pathname: routes.BUILD,
        query: { buildIndex: index }
      });
    } else {
      this.hint.show(`请输入完整的Walle帐号密码信息..`);
    }
  }

  /**
   * 渲染列表
   */
  listDom() {
    const { list } = this.state;
    console.log(list);
    const listItems = list.map((item, index) => (
      <tr key={index}>
        <td>{index + 1}</td>
        <td>
          <input
            onChange={this.handelChange.bind(this, index)}
            value={item.name}
            className={styles.project}
          />
        </td>
        <td>
          <button
            type="button"
            onClick={() => this.goBuild(item, index)}
            className={`${styles.button} ${styles.success}`}
          >
            立即跳转
          </button>
          <button
            type="button"
            onClick={() => this.delLine(index)}
            className={`${styles.button} ${styles.del}`}
          >
            移除项目
          </button>
        </td>
      </tr>
    ));

    return (
      <table>
        <thead>
          <tr>
            <th width={200}>序号</th>
            <th>项目名称</th>
            <th width={400}>操作</th>
          </tr>
        </thead>
        <tbody>{listItems}</tbody>
      </table>
    );
  }

  /* 添加行 */
  addLine() {
    const { list } = this.state;
    const addArr = [
      {
        name: '',
        data: {}
      }
    ];
    this.setState({ list: list.concat(addArr) });
  }

  /**
   * 删除行
   */
  delLine(index) {
    const { list } = this.state;
    list.splice(index, 1);
    this.setState({ list }, () => {
      if (list.length === 0) {
        localStorage.removeItem('projectBuild');
      } else {
        localStorage.setItem('projectBuild', JSON.stringify(list));
      }
    });
  }

  /**
   * 选择Chrome路径
   */
  selectChromePath() {
    dialog.showOpenDialog({}, files => {
      if (files && files.length > 0) {
        const path = files[0];
        this.setState({
          chromePath: path
        });
        localStorage.setItem('chromePath', path);
      }
    });
  }

  /**
   * 检查walle用户名密码是否正确
   */
  async checkWalleUserInfoBtn() {
    const { walleInfo } = this.state;
    this.hint.show(`正在校验Walle帐号密码...`, 999);
    const checkWalleInfoResult = await checkWalleUserInfo(walleInfo);
    if (checkWalleInfoResult === 200) {
      this.hint.show(`Walle帐号密码校验成功!  ♪(＾∀＾●)ﾉ`);
    } else {
      this.hint.show(
        `(┬＿┬) Walle帐号密码校验失败，请检查用户名密码与Chrome地址打开是否正常`
      );
    }
  }

  render() {
    const { walleInfo, chromePath } = this.state;
    return (
      <div className={styles.container} data-tid="container">
        <Hint
          ref={hint => {
            this.hint = hint;
          }}
        />

        <div className="header">
          <h2>前端一键自动化打包部署</h2>
          <div className="helpButton">
            <Link to={{ pathname: routes.HELP }}>
              <i className="fa fa-question-circle fa-3x" />
            </Link>
          </div>
        </div>

        <div
          className={styles.HomeBox}
          style={{
            height: `${screen.getPrimaryDisplay().workAreaSize.height - 140}px`
          }}
        >
          {this.listDom()}
          <a
            href="javascript:void(0)"
            onClick={() => this.addLine()}
            className={styles.addLine}
          >
            +
          </a>
        </div>

        <div className={styles.footer}>
          {process.platform === 'win32' ? (
            <div className={styles.chromePathBox}>
              <input readOnly disabled value={chromePath} />
              <button
                type="button"
                className={styles.select}
                onClick={() => this.selectChromePath()}
              >
                选择谷歌浏览器路径
              </button>
            </div>
          ) : (
            ''
          )}
          <div className={styles.flexBox}>
            <div className={styles.inputBox}>
              <span>Walle帐号：</span>
              <input
                onChange={this.walleInfoChange.bind(this, 'username')}
                value={walleInfo.username}
                type="text"
              />
            </div>
            <div className={styles.inputBox}>
              <span>Walle密码：</span>
              <input
                onChange={this.walleInfoChange.bind(this, 'password')}
                value={walleInfo.password}
                type="password"
              />
            </div>

            <div className={styles.inputBox}>
              <button
                type="button"
                className={`${styles.button} ${styles.select}`}
                onClick={() => this.checkWalleUserInfoBtn()}
              >
                Check
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(Home);
