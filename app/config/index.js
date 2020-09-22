export const PROJECT_CONFIG_INFO = [
  {
    name: 'XX系统',
    data: {
      alpha: {
        cmd: 'npm run build',
        name: '内测',
        folder: 'test',
        walleProject: 'XX系统-alpha',
        link: 'http://127.0.0.1',
        filter: []
      },
      beta: {
        cmd: 'npm run build-beta',
        name: '公测',
        folder: 'test',
        walleProject: 'XX系统-beta',
        link: 'http://127.0.0.1',
        filter: []
      },
      abtest: {
        cmd: 'npm run build-abtest',
        name: '灰度',
        folder: 'test',
        walleProject: 'XX系统-abtest',
        link: 'http://127.0.0.1',
        filter: []
      },
      release: {
        cmd: 'npm run build-release',
        name: '正式',
        folder: 'release',
        walleProject: 'XX系统-release',
        link: 'http://127.0.0.1',
        filter: []
      }
    }
  }
];

export const WALLE_ADDRESS = 'http://192.168.1.222:8088';
export const VERSION = require('../../package.json').version;
