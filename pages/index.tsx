import React from "react";
import { SetState, create } from "zustand";
import { combine, devtools, persist } from "zustand/middleware";
import type { Chart as ChartType } from "react-charts";
const Chart = dynamic(() => import("react-charts").then((mod) => mod.Chart), {
  ssr: false,
}) as typeof ChartType;
import type * as C from "csstype";
import dynamic from "next/dynamic";

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

const initState = {
  roi: 0.07,
  moneyStreams: {} as Record<string, Stream>,
};

const actions = (set: SetState<typeof initState>) => ({
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
});

export const store = create(
  persist(combine(initState, actions), { name: "store" })
);

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
        onChange={(e) =>
          ss((p) => ({ ...p, startYear: Math.floor(+e.target.value) }))
        }
        value={s.startYear}
      />
      <label htmlFor="end year">end year</label>
      <input
        id="end year"
        type="number"
        onChange={(e) => ss((p) => ({ ...p, endYear: +e.target.value }))}
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
    </div>
  );
};

export default function App() {
  return (
    <div style={css.root}>
      <Options />
      <AddStream />
      <StreamList />
      <Line />
    </div>
  );
}
