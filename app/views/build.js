import React, { Component } from 'react';
import { withRouter, Link } from 'react-router-dom';
import { screen, shell, clipboard, remote } from 'electron';
import { exec } from 'child_process';
import path from 'path';
import fse from 'fs-extra';

import routes from '../constants/routes';
import styles from './build.css';
import Hint from '../components/Hint';
import Progress from '../components/Progress';
import { PROJECT_CONFIG_INFO } from '../config/index';
import sleep from '../utils/sleep';
import ms2time from '../utils/ms2time';
import readDirRecur from '../utils/readDirRecur';
import walleAutoDeploy from './walleAutoDeploy';
import dateFormatter from '../utils/dateFormatter';

const { dialog } = remote;

/*
 * 修复OSX 打包出来的环境变量问题
 * $ PATH的环境变量在打包的应用程序内部错误的问题，它在开发中起作用，
 * 因为该应用程序是从终端启动的，从而可以访问$ BASH配置文件。
 * fix： https://github.com/sindresorhus/fix-path
 */
if (process.env.NODE_ENV === 'production') {
  const fixPath = require('fix-path');
  fixPath();
}

class Build extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectCopyContent: '', // 复制模板的内容
      isShowConfig: false, // 是否显示配置文件
      configObj: {}, // 信息
      buildType: '', // 打包类型
      projectName: '', // 项目名称
      buildInfo: {
        delMap: '0', // 是否删除map 默认不删除
        commitAnnotation: '', // commit 注释
        projectPath: '', // 项目地址
        svnPath: '', // svn 提交地址
        configObj: '{}' // config 配置文件
      },

      svnFolderPath: '', // svn文件夹地址
      commitId: '', // 提交版本
      progressPer: 0, // 打包进度
      progressAllNum: 15, // 总进度数量
      buildHistory: [], // 打包过程记录
      execNow: '', // 当前执行的 exec 进程
      buildIndex: localStorage.getItem('autoBuildIndex')
    };
  }

  componentWillMount() {
    /* 设置默认信息 */
    const { buildIndex, buildInfo } = this.state;
    const projectBuild = JSON.parse(localStorage.getItem('projectBuild'))[
      buildIndex
    ];
    const newBuildInfo = Object.assign(buildInfo, projectBuild.data);
    this.setState({
      buildInfo: newBuildInfo,
      projectName: projectBuild.name
    });
  }

  componentDidMount() {}

  /**
   * 设置打包部署信息
   * @param {obj} {key,val}
   */
  setBuildInfo(obj) {
    const { buildInfo, buildIndex } = this.state;
    const projectBuild = JSON.parse(localStorage.getItem('projectBuild'));
    buildInfo[obj.key] = obj.val;
    projectBuild[buildIndex].data = buildInfo;
    this.setState({ buildInfo }, () => {
      localStorage.setItem('projectBuild', JSON.stringify(projectBuild));
    });
  }

  /**
   * 选择目录
   */
  selectDirPath(type) {
    dialog.showOpenDialog(
      {
        properties: ['openDirectory']
      },
      files => {
        if (files && files.length > 0) {
          const pathFiles = files[0];
          this.setBuildInfo({ key: type, val: pathFiles });
        }
      }
    );
  }

  /**
   * 显示提示
   */
  showHint(_str = '', _time = 3) {
    const { progressPer, buildHistory } = this.state;
    this.hint.show(_str, _time);
    this.setState({
      buildHistory: buildHistory.concat(_str),
      progressPer: progressPer + 1
    });
  }

  /**
   * 打包命令
   */
  buildLine(type) {
    const { buildInfo } = this.state;
    const configObj = JSON.parse(buildInfo.configObj);
    const buildCommandLine = configObj[type].cmd;
    const buildCommandName = configObj[type].name;
    const cmdPath = buildInfo.projectPath;

    this.showHint(
      `正在执行${buildCommandName} \r\n ${buildCommandLine} \r\n 打包工作，请稍等... (ง •_•)ง`,
      999
    );

    return new Promise(resolve => {
      const execNow = exec(
        buildCommandLine,
        {
          cwd: cmdPath,
          maxBuffer: 1024 * 1024 * 1000
        },
        error => {
          if (error) {
            /* 防止终止打包后还执行的问题 */
            if (execNow !== '') {
              this.showHint(`打包失败! (┬＿┬) ! 请检查程序   ${error}`);
            }
            return;
          }
          this.showHint(
            `${buildCommandName}环境-${buildCommandLine}\n打包成功。 ♪(＾∀＾●)ﾉ`
          );
          resolve();
        }
      );
      this.setState({ execNow });
    });
  }

  /**
   * 执行walle部署
   */
  walleDeploy() {
    const { commitId, buildType, buildInfo } = this.state;
    const configObj = JSON.parse(buildInfo.configObj);
    const walleInfo = JSON.parse(localStorage.getItem('walleInfo'));
    const walleUserName = walleInfo.username;
    const wallePassword = walleInfo.password;
    const walleProjectName = configObj[buildType].walleProject;
    this.showHint(`正在执行部署Walle (ง •_•)ง`, 999);
    const configParam = {
      walleUserName,
      wallePassword,
      walleProjectName,
      commitId
    };
    return new Promise(resolve => {
      if (buildType === 'release') {
        this.showHint(`正式环境不直接部署，请联系负责人手工部署 ♪(＾∀＾●)ﾉ`);
        /* 释放进程 */
        this.setState({ execNow: '' });
        resolve(200);
        return;
      }
      walleAutoDeploy(configParam)
        .then(res => {
          /* 释放进程 */
          this.setState({ execNow: '' });
          if (res === 200) {
            this.showHint(
              `walle发布成功了${commitId}，马上浏览一下看看把！ ♪(＾∀＾●)ﾉ`
            );
            resolve(res);
          } else {
            this.showHint(`walle 执行失败! (┬＿┬) !请确保 walle 程序正常`);
          }
          return true;
        })
        .catch(error => {
          console.log(error);
        });
    });
  }

  /**
   * svnDeleteFolder 提交svn删除
   */
  svnDeleteFolder() {
    const { svnFolderPath } = this.state;
    this.showHint(`正在执行svn delete ./* ... (ง •_•)ง`, 999);
    return new Promise(resolve => {
      const execNow = exec('svn delete ./*', { cwd: svnFolderPath }, error => {
        if (error) {
          this.showHint(`SVN 提交删除失败! (┬＿┬) ! 错误信息：${error}`);
          return;
        }
        this.showHint(`SVN 提交删除文件夹成功。 ♪(＾∀＾●)ﾉ`);
        resolve();
      });
      this.setState({ execNow });
    });
  }

  /**
   * svn revert 忽略一些文件不删除 回滚
   */
  svnRevert(type) {
    const { svnFolderPath, buildInfo } = this.state;
    const configObj = JSON.parse(buildInfo.configObj);
    const filterArr = configObj[type].filter;

    this.showHint(`正在过滤不能删除文件  ... (ง •_•)ง`, 999);
    return new Promise(resolve => {
      if (filterArr.length > 0) {
        const cmdArr = filterArr.map(item => `svn revert -R ${item}`);
        const execNow = exec(
          cmdArr.join(' & '),
          { cwd: svnFolderPath },
          error => {
            if (error) {
              this.showHint(`SVN 过滤文件失败! (┬＿┬) ! 错误信息：${error}`);
              return;
            }
            this.showHint(`SVN 过滤文件成功。 ♪(＾∀＾●)ﾉ`);
            resolve();
          }
        );
        this.setState({ execNow });
      } else {
        this.showHint(`检测不到需要过滤的文件，忽略~`);
        resolve();
      }
    });
  }

  /**
   * svn update
   */
  svnUpdate() {
    const { buildInfo } = this.state;
    this.showHint(`正在执行SVN Update... (ง •_•)ง`, 999);
    return new Promise(resolve => {
      const execNow = exec('svn update', { cwd: buildInfo.svnPath }, error => {
        if (error) {
          this.showHint(
            `SVN Update 失败! (┬＿┬) !请确保 svn 在环境变量中, 错误信息：${error}`
          );
          return;
        }
        this.showHint(`SVN Update 成功。 ♪(＾∀＾●)ﾉ`);
        resolve();
      });
      this.setState({ execNow });
    });
  }

  /**
   * svn 添加
   */
  svnAdd() {
    const { svnFolderPath } = this.state;
    this.showHint(`正在执行 svn add ./* 提交 (ง •_•)ง`, 999);
    return new Promise(resolve => {
      const execNow = exec(`svn add ./*`, { cwd: svnFolderPath }, error => {
        if (error) {
          this.showHint(`SVN add ./* 失败! 错误信息：${error}`);
          console.log(error);
          return;
        }
        this.showHint(`SVN 添加所有修改文件成功。 ♪(＾∀＾●)ﾉ`);
        resolve();
      });
      this.setState({ execNow });
    });
  }

  /**
   * svn 提交
   */
  svnCommit() {
    const { svnFolderPath, buildInfo } = this.state;
    this.showHint(`正在执行commit 提交 (ง •_•)ง`, 999);
    return new Promise(resolve => {
      const execNow = exec(
        `svn commit -m "${buildInfo.commitAnnotation}"`,
        { cwd: svnFolderPath },
        (error, stdout) => {
          if (error) {
            this.showHint(`SVN 提交失败! (┬＿┬) ！错误信息：${error}`);
            console.log(error);
            return;
          }
          const commitArr = stdout.match(/Committed revision (.*)\./);
          let commitId = commitArr !== null ? commitArr[1] : '';
          /* 判断中文svn */
          if (commitId === '') {
            const newStdout = stdout.substr(-20).match(/\d+/g);
            commitId = newStdout.length > 0 ? newStdout[0] : '';
          }
          this.showHint(
            `commit版本：${commitId} 提交内容: ${buildInfo.commitAnnotation} `
          );
          this.setState({ commitId }, () => {
            resolve();
          });
        }
      );
      this.setState({ execNow });
    });
  }

  /* 重置打包过程 */
  resetBuild() {
    this.setState({
      progressPer: 0,
      execNow: '',
      buildType: '',
      buildHistory: []
    });
  }

  /**
   * 寻找所有map后缀文件
   */
  // eslint-disable-next-line class-methods-use-this
  findMapFile(dirPath) {
    const arr = [];
    return readDirRecur(dirPath, item => {
      if (item.search(/\.map/) !== -1) {
        arr.push(item);
      }
    })
      .then(() => arr)
      .catch(err => {
        console.log(err);
      });
  }

  /**
   * 结束打包过程
   */
  async onEndBuild() {
    const { execNow } = this.state;
    if (execNow !== '') {
      const res = process.kill(execNow.pid);
      this.resetBuild();
      if (res) {
        this.hint.show('已终止打包');
      }
    } else {
      this.hint.show('当前没有进程正在运行');
    }
  }

  /* 开始自动打包流程 */
  async onStartBuild(type) {
    const { buildInfo, execNow } = this.state;
    /* 限制单线程执行 */
    if (execNow !== '') {
      this.hint.show('正在执行部署，请执行完，再点击部署');
      return;
    }
    const configObj = JSON.parse(buildInfo.configObj);
    if (
      buildInfo.commitAnnotation === '' ||
      buildInfo.projectPath === '' ||
      buildInfo.svnPath === ''
    ) {
      this.hint.show('项目配置信息不完整，请填写.');
      return;
    }

    /* 每次打包重置state */
    await this.resetBuild();
    const startTime = window.performance.now();
    await this.setState({
      svnFolderPath: path.resolve(buildInfo.svnPath, configObj[type].folder),
      buildType: type
    });
    const { svnFolderPath } = this.state;

    /* 1. 执行打包命令 */
    await this.buildLine(type);
    await sleep(1000);
    const fseCopyPath = path.resolve(buildInfo.projectPath, 'dist');
    /* 过滤 .map文件上传 找到并全部删掉 */
    if (buildInfo.delMap === '1') {
      const fileArr = await this.findMapFile(fseCopyPath);
      await Promise.all(
        fileArr.map(async item => {
          fse.remove(item);
        })
      );
    }
    /* 2. svn更新，避免冲突 */
    await this.svnUpdate();
    /* 3. 删除 所有目录并提交 svn */
    await this.svnDeleteFolder();
    /* 4. 过滤部分不需要删除的文件 */
    await this.svnRevert(type);
    /* 5. 复制 dist目录到指定svn上传目录 */
    await fse.copy(fseCopyPath, svnFolderPath);
    /* 6. 添加所有文件并提交 svn */
    await this.svnAdd();
    /* 7. 上传dist文件到svn */
    await this.svnCommit();
    /* 8. walle 自动部署，返回部署结果 */
    const walleDeployResult = await this.walleDeploy();
    const endTime = window.performance.now();
    const buildTime = parseInt(endTime - startTime);
    console.log('walleDeployResult', walleDeployResult);
    if (Number(walleDeployResult) === 200) {
      this.showHint(
        `Build Success! (๑¯∀¯๑) 共耗时：${ms2time(
          buildTime
        )}，打包时间：${dateFormatter('YYYY-MM-DD HH:mm')}`
      );
    }
  }

  /**
   * 配置信息改变
   */
  configChange(name, e) {
    const inputVal = e.target.value;
    try {
      this.setBuildInfo({ key: name, val: inputVal });
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * 文本框改变
   */
  inputChange(name, event) {
    const inputVal = event.target.value;
    this.setBuildInfo({ key: name, val: inputVal });
  }

  /**
   * 渲染列表
   */
  btnDom() {
    const { buildInfo } = this.state;
    const configObj = JSON.parse(buildInfo.configObj);
    const btnItems = Object.keys(configObj).map(item => (
      <button
        key={configObj[item].name}
        type="button"
        className={styles.btn}
        onClick={() => this.onStartBuild(item)}
      >{`${item} ${configObj[item].name}`}</button>
    ));
    return (
      <div className={styles.btnBox}>
        {btnItems}
        {btnItems.length > 0 ? (
          <button
            type="button"
            className={`${styles.btn} ${styles.del}`}
            onClick={() => this.onEndBuild()}
          >
            终止打包
          </button>
        ) : (
          ''
        )}
      </div>
    );
  }

  /*
   * 显示配置信息
   */
  showConfig() {
    const { isShowConfig } = this.state;
    this.setState({
      isShowConfig: !isShowConfig
    });
  }

  /**
   * 状态信息
   */
  cmdTextDom() {
    const { buildHistory } = this.state;
    const textList = buildHistory.map(item => <p key={item}>{item}</p>);
    return <div className={styles.buildBoxText}>{textList}</div>;
  }

  /**
   * 状态信息
   */
  selectConfigDom() {
    const optionDom = PROJECT_CONFIG_INFO.map(item => (
      <option value={JSON.stringify(item.data, null, 4)} key={item.name}>
        {item.name}
      </option>
    ));
    return (
      <select onChange={this.selectConfigChange}>
        <option className={styles.none} value="" />
        {optionDom}
      </select>
    );
  }

  /**
   * 复制项目配置文件
   */
  copyProjectConfig() {
    const { selectCopyContent } = this.state;
    if (selectCopyContent === '') {
      this.hint.show('请先选择项目模板', 2);
      return;
    }
    this.hint.show('Copy Success', 2);
    clipboard.writeText(selectCopyContent);
  }

  /* 配置文件模板select改变 */
  selectConfigChange = e => {
    this.setState({
      selectCopyContent: e.target.value
    });
  };

  onDelMapChange = e => {
    this.setBuildInfo({ key: 'delMap', val: e.target.value });
  };

  render() {
    const {
      isShowConfig,
      buildInfo,
      configJsonDefaultPlaceholder,
      buildType,
      progressPer,
      progressAllNum,
      projectName
    } = this.state;
    const configObj = JSON.parse(buildInfo.configObj);
    return (
      <div className={styles.container} data-tid="container">
        <Hint
          ref={hint => {
            this.hint = hint;
          }}
        />

        <div className="header">
          <h2>前端一键自动化打包部署</h2>

          <div className="backButton" data-tid="backButton">
            <Link to={{ pathname: routes.HOME, query: { skip: 'false' } }}>
              <i className="fa fa-arrow-left fa-3x" />
            </Link>
          </div>

          <div className="helpButton">
            <Link to={{ pathname: routes.HELP }}>
              <i className="fa fa-question-circle fa-3x" />
            </Link>
          </div>
        </div>

        <div
          className={styles.tableBox}
          style={{
            height: `${screen.getPrimaryDisplay().workAreaSize.height - 140}px`
          }}
        >
          <table>
            <thead>
              <tr>
                <th width={300}>项目地址</th>
                <th width={300}>SVN提交地址</th>
                <th width={200}>配置文件</th>
                <th width={300}>是否删除map文件</th>
                <th width={300}>配置文件模板</th>
                <th width={300}>项目名称</th>
                <th>提交说明</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <input
                    readOnly
                    disabled
                    value={buildInfo.projectPath}
                    placeholder="请选择项目地址路径"
                    className={styles.project}
                  />
                  <button
                    type="button"
                    className={styles.select}
                    onClick={() => this.selectDirPath('projectPath')}
                  >
                    选择路径
                  </button>
                </td>
                <td>
                  <input
                    readOnly
                    disabled
                    value={buildInfo.svnPath}
                    placeholder="请选择SVN地址路径"
                    className={styles.project}
                  />
                  <button
                    type="button"
                    className={styles.select}
                    onClick={() => this.selectDirPath('svnPath')}
                  >
                    选择路径
                  </button>
                </td>
                <td>
                  <button onClick={() => this.showConfig()} type="button">
                    {isShowConfig ? '隐藏' : '显示'}
                  </button>
                </td>
                <td className="delMapTd">
                  <label htmlFor="delMap">
                    <input
                      type="radio"
                      onChange={this.onDelMapChange.bind(this)}
                      name="delMap"
                      value="1"
                      checked={buildInfo.delMap === '1'}
                    />
                    是
                  </label>
                  <label htmlFor="delMap">
                    <input
                      type="radio"
                      onChange={this.onDelMapChange.bind(this)}
                      name="delMap"
                      value="0"
                      checked={buildInfo.delMap === '0'}
                    />
                    否
                  </label>
                </td>
                <td>
                  {this.selectConfigDom()}
                  <button
                    type="button"
                    className={styles.select}
                    onClick={() => this.copyProjectConfig()}
                  >
                    复制
                  </button>
                </td>
                <td>{projectName}</td>
                <td>
                  <input
                    onChange={this.inputChange.bind(this, 'commitAnnotation')}
                    value={buildInfo.commitAnnotation}
                    className={styles.project}
                  />
                </td>
              </tr>
              {isShowConfig ? (
                <tr>
                  <td colSpan="7">
                    <div className={styles.configJson}>
                      <textarea
                        placeholder={JSON.stringify(
                          configJsonDefaultPlaceholder,
                          null,
                          4
                        )}
                        onChange={this.configChange.bind(this, 'configObj')}
                        value={buildInfo.configObj}
                      />
                    </div>
                  </td>
                </tr>
              ) : (
                <tr className={styles.none} />
              )}
            </tbody>
          </table>

          <div className={styles.buildBox}>
            <Progress maxper={progressAllNum} per={progressPer} />
            {this.cmdTextDom()}
            {buildType !== '' ? (
              <p className={styles.buildInfo}>
                <span>Build：{buildType}</span>
                <a
                  href="###"
                  onClick={() => shell.openExternal(configObj[buildType].link)}
                >
                  {configObj[buildType].link}
                </a>
              </p>
            ) : (
              <p className={styles.buildInfo}>
                <span>Status：空闲</span>
              </p>
            )}
          </div>

          {this.btnDom()}
        </div>
      </div>
    );
  }
}
export default withRouter(Build);
