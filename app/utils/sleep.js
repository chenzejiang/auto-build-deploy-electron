/**
 * 等待睡眠时间
 * @param {delay} number
 */
const sleep = (delay = 1000) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, delay);
  });
};

export default sleep;
