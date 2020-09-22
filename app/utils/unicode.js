/**
 * unicode转码
 * @param {_str} string
 * @returns string
 */
const unicode = (_str = '') => {
  return unescape(_str.replace(/\\u/g, '%u'));
};
export default unicode;
