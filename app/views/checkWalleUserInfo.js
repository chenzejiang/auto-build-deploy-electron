import puppeteer from 'puppeteer-core';
import getChromePath from '../utils/getChromePath';
import { WALLE_ADDRESS } from '../config/index';

const checkWalleUserInfo = obj => {
  const WALLE_USERNAME = obj.username;
  const WALLE_PASSWORD = obj.password;
  const deploy = new Promise(resolve => {
    (async () => {
      let browser;
      try {
        browser = await puppeteer.launch({
          headless: true,
          executablePath: getChromePath()
        });
        const page = await browser.newPage();
        await page.setViewport({
          width: 1920,
          height: 1080
        });
        await page.goto(WALLE_ADDRESS);
        await page.evaluate(() => ({
          width: document.documentElement.clientWidth,
          height: document.documentElement.clientHeight,
          deviceScaleFactor: window.devicePixelRatio
        }));
        /* 1.输入帐号密码进行点击登陆 */
        await page.evaluate(
          (user, pass) => {
            document.querySelector('#loginform-username').value = user;
            document.querySelector('#loginform-password').value = pass;
          },
          WALLE_USERNAME,
          WALLE_PASSWORD
        );

        const [response] = await Promise.all([
          page.waitForNavigation({
            waitUntil: 'domcontentloaded' // 页面的DOMContentLoaded事件触发时
          }),
          page.click('.btn-primary') // 点击该按钮将间接导致导航(跳转)
        ]);

        if (response._url === `${WALLE_ADDRESS}/site/login`) {
          resolve(500);
        } else {
          resolve(200);
        }
        await browser.close();
      } catch (error) {
        resolve(500);
        await browser.close();
      }
    })();
  });
  return deploy;
};
export default checkWalleUserInfo;
