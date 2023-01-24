import React from "react";
import { SetState, create } from "zustand";
import { combine } from "zustand/middleware";
import { Chart } from "react-charts";
import type * as C from "csstype";
import { dehydrate, rehydrate } from "./remote-state";
import { ErrorBoundary } from "react-error-boundary";
import Head from "next/head";

// https://codesandbox.io/s/thirsty-blackburn-cibc5j?file=/src/components/Line.tsx:815-827

type P = C.Properties<string | number>;
const createCSS = <Res extends { [k: string]: P }>(create: () => Res): Res =>
  create();

type Stream = {
  key: number;
  name: string;
  startYear: number;
  endYear: number;
  startValue: number;
  annualAddition: number;
  annaulAdditionIncrease: number;
};

const getInitStoreState = () => ({
  roi: 0.07,
  moneyStreams: {} as Record<string, Stream>,
  lastSaved: new Date().toISOString(),
  autoSave: false,
});

type StoreState = ReturnType<typeof getInitStoreState>;

const actions = (set: SetState<StoreState>) => ({
  deleteStream: (key: number) => {
    set((s) => {
      const moneyStreams = structuredClone(s.moneyStreams);
      delete moneyStreams[key];
      return {
        ...s,
        moneyStreams,
      };
    });
  },
  putStream: (stream: Stream) => {
    set((s) => {
      const moneyStreams = structuredClone(s.moneyStreams);
      moneyStreams[stream.key] = stream;
      return {
        ...s,
        moneyStreams,
      };
    });
  },
  undo: () => {
    stateStack.pop();
    const prev = stateStack.pop();
    if (prev) {
      set(prev);
    } else {
      set(getInitStoreState());
    }
  },
});

export const store = create(combine(getInitStoreState(), actions));

const stateStack = [store.getState()];
store.subscribe((next) => {
  stateStack.push(next);
  if (stateStack.length > 3) stateStack.shift();
});

store.subscribe((state) => {
  if (state.autoSave) {
    const lastSave = new Date(state.lastSaved).valueOf();
    const curSave = Date.now();
    if (curSave - lastSave > 1000) {
      const currentUrl = window.location.href;
      const url = new URL(currentUrl);
      const currentUrlParams = url.searchParams;
      const currentToken = currentUrlParams.get("state");
      const newToken = dehydrate(store.getState());
      if (currentToken === newToken) {
        return;
      }
      currentUrlParams.set("state", newToken);
      url.search = currentUrlParams.toString();
      window.history.pushState({}, "", url.toString());
      store.setState({ lastSaved: new Date().toISOString() });
    }
  }
});

const css = createCSS(() => ({
  card: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    padding: 10,
  },
  cardNoSidePad: {
    padding: "10px 0 10px 0",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  pre: {
    whiteSpace: "pre-wrap",
  },
  grow: {
    margin: 20,
    minHeight: "93vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  root: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  center: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    width: "100vw",
    height: "100vh",
  },
  h1: {
    fontSize: "2em",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
}));
const getInitState = (): Record<keyof Stream, string | number> => ({
  name: "",
  startYear: "",
  endYear: "",
  startValue: "",
  annualAddition: "",
  annaulAdditionIncrease: "",
  key: Date.now(),
});

const AddStream = () => {
  const [s, ss] = React.useState(getInitState);

  const submit = () => {
    const errors: string[] = [];
    Object.entries(s).forEach((e) => {
      if (!e[1]) {
        console.log(e[0]);
        errors.push(e[0]);
      }
    });
    if (errors.length) {
      alert("unfilled fields: " + errors.join(" "));
      return;
    }
    if (Math.floor(+s.startYear) < 1900) {
      alert("start year cant be less than 1900");
      return;
    }
    if (Math.floor(+s.endYear) > 3000) {
      alert("end year cant be greater than 3000");
      return;
    }

    ss(getInitState());
    store.getState().putStream({
      name: s.name as string,
      startYear: Math.floor(+s.startYear),
      endYear: Math.floor(+s.endYear),
      startValue: Math.floor(+s.startValue),
      annualAddition: Math.floor(+s.annualAddition),
      annaulAdditionIncrease: +s.annaulAdditionIncrease,
      key: s.key as number,
    });
  };

  return (
    <div style={css.card}>
      <h1>add income and expenses</h1>
      <label htmlFor="name">income / expense name</label>
      <input
        id="name"
        type="text"
        onChange={(e) => ss((p) => ({ ...p, name: e.target.value }))}
        value={s.name}
        autoComplete="off"
      />
      <label htmlFor="start year">start year</label>
      <input
        id="start year"
        type="number"
        onChange={(e) => ss((p) => ({ ...p, startYear: e.target.value }))}
        value={s.startYear}
      />
      <label htmlFor="end year">end year</label>
      <input
        id="end year"
        type="number"
        onChange={(e) => ss((p) => ({ ...p, endYear: e.target.value }))}
        value={s.endYear}
      />
      <label htmlFor="start value">start value</label>
      <input
        id="start value"
        type="number"
        onChange={(e) => ss((p) => ({ ...p, startValue: e.target.value }))}
        value={s.startValue}
      />
      <label htmlFor="annual addition">annual addition</label>
      <input
        id="annual addition"
        type="number"
        onChange={(e) => ss((p) => ({ ...p, annualAddition: e.target.value }))}
        value={s.annualAddition}
      />
      <label htmlFor="annual addition increase percent">
        annual addition increase percent
      </label>
      <input
        id="annual addition increase percent"
        type="number"
        onChange={(e) =>
          ss((p) => ({ ...p, annaulAdditionIncrease: e.target.value }))
        }
        value={s.annaulAdditionIncrease}
      />
      <button onClick={submit}>add</button>
    </div>
  );
};

const EditStream = (props: { k: number }) => {
  const s = store((s) => s.moneyStreams[props.k]);
  type S = typeof s;
  const ss = (cb: (prev: S) => S) => {
    const prev = store.getState().moneyStreams[props.k];
    store.getState().putStream(cb(prev));
  };

  return (
    <div style={css.card}>
      <label htmlFor="name">income / expense name</label>
      <input
        id="name"
        type="text"
        onChange={(e) => ss((p) => ({ ...p, name: e.target.value }))}
        value={s.name}
        autoComplete="off"
      />
      <label htmlFor="start year">start year</label>
      <input
        id="start year"
        type="number"
        onChange={(e) => {
          const next = Math.floor(+e.target.value);
          if (next < 1900) {
            alert("start cant be less than 1990");
            return;
          }
          ss((p) => ({ ...p, startYear: next }));
        }}
        value={s.startYear}
      />
      <label htmlFor="end year">end year</label>
      <input
        id="end year"
        type="number"
        onChange={(e) => {
          const next = +e.target.value;
          if (next > 3000) {
            alert("end cant be greater than 3000");
            return;
          }
          ss((p) => ({ ...p, endYear: next }));
        }}
        value={s.endYear}
      />
      <label htmlFor="start value">start value</label>
      <input
        id="start value"
        type="number"
        onChange={(e) =>
          ss((p) => ({ ...p, startValue: Math.floor(+e.target.value) }))
        }
        value={s.startValue}
      />
      <label htmlFor="annual addition">annual addition</label>
      <input
        id="annual addition"
        type="number"
        onChange={(e) =>
          ss((p) => ({ ...p, annualAddition: Math.floor(+e.target.value) }))
        }
        value={s.annualAddition}
      />
      <label htmlFor="annual addition increase percent">
        annual addition increase percent
      </label>
      <input
        id="annual addition increase percent"
        type="number"
        onChange={(e) =>
          ss((p) => ({ ...p, annaulAdditionIncrease: +e.target.value }))
        }
        value={s.annaulAdditionIncrease}
      />
    </div>
  );
};

const StreamList = () => {
  const streams = store((s) => s.moneyStreams);

  if (!Object.keys(streams).length) {
    return null;
  }

  return (
    <div style={css.card}>
      <h1>edit income and expenses</h1>
      {Object.values(streams).map((s) => {
        return (
          <div key={s.name} style={css.cardNoSidePad}>
            <button onClick={() => store.getState().deleteStream(s.key)}>
              delete
            </button>
            <EditStream k={s.key} key={s.name} />
          </div>
        );
      })}
    </div>
  );
};

const projectStream = (options: {
  startYear: number;
  endYear: number;
  s: Stream;
}) => {
  const { startYear, endYear, s } = options;
  // primary: date, secondary: amount
  const data: { primary: number; secondary: number }[] = [];
  let annualAddition = s.annualAddition;
  for (let year = startYear + 1, i = 0; year <= endYear; year++, i++) {
    if (year < s.startYear || year > s.endYear) {
      const prevAmount = data[i - 1]?.secondary ?? s.startValue ?? 0;
      const amount = prevAmount;
      const next = { primary: year, secondary: amount };
      data.push(next);
      continue;
    }

    const prevAmount = data[i - 1]?.secondary ?? s.startValue ?? 0;
    const amount = prevAmount + annualAddition;
    const next = { primary: year, secondary: amount };
    annualAddition += annualAddition * s.annaulAdditionIncrease;
    data.push(next);
  }
  return {
    label: s.name,
    data: data.map((d) => ({ ...d, secondary: Math.floor(d.secondary) })),
  };
};

const diffYear = (
  projectedStream: ReturnType<typeof projectStream>,
  year: number
) => {
  const prev = projectedStream.data.find((d) => d.primary === year - 1) ?? {
    secondary: 0,
  };
  const cur = projectedStream.data.find((d) => d.primary === year) ?? {
    secondary: 0,
  };
  return cur.secondary - prev.secondary;
};

const getSumStream = (
  projectedStreams: ReturnType<typeof projectStream>[],
  roi: number
) => {
  // primary: date, secondary: amount
  const data: { primary: number; secondary: number }[] = [];
  const firstYear = projectedStreams[0].data[0].primary;
  const lastYear =
    projectedStreams[0].data[projectedStreams[0].data.length - 1].primary;
  for (let year = firstYear, i = 0; year <= lastYear; year++, i++) {
    const diffs = projectedStreams.map((s) => diffYear(s, year));
    const sum = diffs.reduce((acc, cur) => acc + cur, 0);
    const lastTotal = data[i - 1]?.secondary ?? 0;
    const apy = lastTotal * roi;
    const total = sum + apy + lastTotal;
    data.push({ primary: year, secondary: total });
  }
  return { data, label: "sum" };
};

const useLineData = () => {
  const s = store((s) => s.moneyStreams);
  const roi = store((s) => s.roi);
  const ss = React.useMemo(() => Object.values(s), [s]);
  const startYear = React.useMemo(() => {
    if (!ss.length) {
      return 0;
    }
    let min = Number.MAX_SAFE_INTEGER;
    for (const e of ss) {
      min = Math.min(min, e.startYear);
    }
    return min;
  }, [ss]);

  const endYear = React.useMemo(() => {
    if (!ss.length) {
      return 0;
    }
    let max = 0;
    for (const e of ss) {
      max = Math.max(max, e.endYear);
    }
    return max;
  }, [ss]);

  const data = React.useMemo(() => {
    if (!ss.length) {
      return null;
    }
    const given = ss.map((e) => projectStream({ startYear, endYear, s: e }));
    const derived = getSumStream(given, roi);
    return [...given, derived];
  }, [ss, startYear, endYear, roi]);
  return data;
};

const Line = () => {
  const data = useLineData();

  const primaryAxis = React.useMemo(
    () => ({
      getValue: (datum: any) => datum.primary as unknown as Date,
    }),
    []
  );

  const secondaryAxes = React.useMemo(
    () => [
      {
        getValue: (datum: any) => datum.secondary,
      },
    ],
    []
  );

  if (!data) {
    return null;
  }

  return (
    <>
      <div style={css.grow}>
        <Chart
          options={{
            data,
            primaryAxis,
            secondaryAxes,
            dark: true,
          }}
        />
      </div>
      {/* <pre style={css.pre}>
        {JSON.stringify({ data, state: store.getState() }, null, 2)}
      </pre> */}
    </>
  );
};

const Options = () => {
  const value = store((s) => s.roi);
  const lastSaved = store((s) => s.lastSaved);
  const autoSAve = store((s) => s.autoSave);
  const handleShare = () => {
    try {
      const currentUrl = window.location.href;
      const url = new URL(currentUrl);
      const currentUrlParams = url.searchParams;
      const currentToken = currentUrlParams.get("state");
      const newToken = dehydrate(store.getState());
      if (currentToken === newToken) {
        alert("saved in url and copied to clipboard");
        return;
      }
      currentUrlParams.set("state", newToken);
      url.search = currentUrlParams.toString();
      window.history.pushState({}, "", url.toString());
      navigator.clipboard.writeText(url.toString()).then(() => {
        alert("saved in url and copied to clipboard");
      });
      store.setState({ lastSaved: new Date().toISOString() });
    } catch {
      alert("unable to save");
    }
  };

  React.useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const token = searchParams.get("state");
      if (token) {
        const state = rehydrate(token);
        store.setState(state);
      }
    } catch (e) {
      console.error(e);
      alert("unable to load save, check you copied the full url");
    }
  }, []);
  return (
    <div style={css.card}>
      <h1>options</h1>
      <label htmlFor="roi">roi</label>
      <input
        id="roi"
        type="number"
        value={value}
        onChange={(e) => store.setState({ roi: +e.target.value })}
      />
      <label htmlFor="autosave">autosave</label>
      <input
        id="autosave"
        type="checkbox"
        checked={autoSAve}
        onChange={(e) => store.setState({ autoSave: e.target.checked })}
      />
      <label htmlFor="save">
        last saved {new Date(lastSaved).toLocaleDateString()}{" "}
        {new Date(lastSaved).toLocaleTimeString()}
      </label>
      <button id="save" onClick={handleShare}>{`save / share`}</button>
    </div>
  );
};

const Share = () => {
  return;
};

const Fallback = (props: { resetErrorBoundary: () => void }) => {
  return (
    <div style={css.center}>
      <label>something went wrong</label>
      <button onClick={props.resetErrorBoundary}>undo</button>
    </div>
  );
};

const RootErrorBoundary = (props: React.PropsWithChildren<{}>) => {
  return (
    <ErrorBoundary FallbackComponent={Fallback} onReset={store.getState().undo}>
      {props.children}
    </ErrorBoundary>
  );
};

export default function App() {
  return (
    <>
      <Head>
        <title>FIRE Calculator</title>
      </Head>
      <div style={css.root}>
        <h1 style={css.h1}>FIRE Calculator</h1>
        <RootErrorBoundary>
          <Options />
          <AddStream />
          <StreamList />
          <Line />
        </RootErrorBoundary>
      </div>
    </>
  );
}
