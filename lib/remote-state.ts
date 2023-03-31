import { gzip, ungzip } from 'pako'
import { fromUint8Array, toUint8Array } from 'js-base64'

// https://github.com/zerodevx/zipurl
export const dehydrate = (data: object) => {
  return fromUint8Array(gzip(JSON.stringify(data)), true)
};

export const rehydrate = (data: string) => {
  return JSON.parse(ungzip(toUint8Array(data), { to: 'string' }));
};
