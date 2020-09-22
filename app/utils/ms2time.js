/**
 * ms转换可视化阅读时间
 * @param {_time} number
 * @returns {string) 2分44秒888毫秒
 */
const ms2time = (_time = 1000) => {
  const ms = Number(_time.toString().substr(-3));
  const seconds = parseInt((_time / 1000) % 60);
  const min = parseInt(_time / 1000 / 60);
  return `${min}分${seconds}秒${ms}毫秒`;
};

export default ms2time;
