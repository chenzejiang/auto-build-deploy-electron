# 使用 Electron + React 搭建前端一键自动化部署应用程序

![](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/767681038ebe42ba8314af8dc48c561d~tplv-k3u1fbpfcp-zoom-1.image)

## 使用到的包

- React（界面实现）
- puppeteer （实现对 Walle 平台的模拟人为操作）
- fs-extra（更方便的做对文件做操作）
- Node [child_process, path]
- Electron [screen, shell, clipboard, remote]

推荐使用 [yarn 安装](https://yarn.bootcss.com/docs/install/#windows-stable)

## 下载

```
$ git clone https://github.com/chenzejiang/auto-build-deploy-electron.git your-project-name
$ cd your-project-name
```

## 核心代码目录

```
\app\views
```

#### 重要提示:代码只是参考作用，具体还是得`根据自己`项目部署的流程去实现

## 安装

```
$ yarn
```

## 运行

```
$ yarn dev
```

## 打包

```
$ yarn package
```

## 界面总览

- 创建项目与选择项目统一管理

![](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/332abeaa2c9344fb9b40737bf3e521fd~tplv-k3u1fbpfcp-zoom-1.image)

- 打包部署

![](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/45e5a4e5d77c407eacb52e3ca9350cc0~tplv-k3u1fbpfcp-zoom-1.image)

- 项目配置

![](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/4de8d1c2b57b4f6a8931ef072627937e~tplv-k3u1fbpfcp-zoom-1.image)

- 配置说明

![](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e7fd734b93304502b5f6beee493ef539~tplv-k3u1fbpfcp-zoom-1.image)

### 联系交流

- 微信: chen-zejiang

如果该项目对你有帮助，麻烦给个 Star 吧~ QAQ
