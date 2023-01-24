export const dehydrate = (json: object) => {
  const jsonString = JSON.stringify(json);
  const jsonB64 = btoa(jsonString);
  const jsonUri = jsonB64
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return jsonUri;
};

export const rehydrate = (jsonUri: string) => {
  const jsonB64 = jsonUri.replace(/-/g, "+").replace(/_/g, "/");
  const jsonString = atob(jsonB64);
  const json = JSON.parse(jsonString);
  return json;
};
