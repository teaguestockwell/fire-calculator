const { subtle } = window.crypto;
const enc = new TextEncoder();
const dec = new TextDecoder("utf-8");
const algo = {
  name: "AES-GCM",
  iv: window.crypto.getRandomValues(new Uint8Array(12)),
};

const getSymKey = async () => {
  const secret = prompt("enter password") ?? "";
  const data = enc.encode(secret);
  const key = new Uint8Array(16);
  key.set(data.slice(0, 16));
  const cryptoKey = await window.crypto.subtle.importKey(
    "raw",
    key,
    "AES-GCM",
    false,
    ["encrypt", "decrypt"]
  );
  return cryptoKey;
};

export const dehydrate = async (state: object) => {
  const key = await getSymKey();
  const str = JSON.stringify(state);
  const data = enc.encode(str);
  const eDataAb = await subtle.encrypt(algo, key, data);
  const token = btoa(String.fromCharCode.apply(null, new Uint8Array(eDataAb) as any));
  return token;
};

export const rehydrate = async (token: string) => {
  const key = await getSymKey();
  const decodedAb = new Uint8Array(atob(token).split('').map(c => c.charCodeAt(0)));
  const data = await subtle.decrypt(algo, key, decodedAb);
  const state = JSON.parse(dec.decode(data));
  return state;
};
