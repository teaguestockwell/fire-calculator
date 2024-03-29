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
  annualAdditionIncrease: number;
};

const getInitStoreState = () => ({
  roi: 0.06,
  moneyStreams: {} as Record<string, Stream>,
  lastSaved: new Date().toISOString(),
  autoSave: true,
});

type StoreState = ReturnType<typeof getInitStoreState>;

const getDemo = (): StoreState => ({
  lastSaved: new Date().toISOString(),
  autoSave: true,
  roi: 0.06,
  moneyStreams: {
    1: {
      key: 1,
      name: "job (net)",
      startYear: new Date().getFullYear(),
      endYear: new Date().getFullYear() + 10,
      startValue: 0,
      annualAddition: 80000,
      annualAdditionIncrease: 0.02,
    },
    2: {
      key: 2,
      name: "mortgage",
      startYear: new Date().getFullYear(),
      endYear: new Date().getFullYear() + 15,
      startValue: 0,
      annualAddition: -20000,
      annualAdditionIncrease: 0,
    },
    3: {
      key: 3,
      name: "cost of living",
      startYear: new Date().getFullYear(),
      endYear: new Date().getFullYear() + 50,
      startValue: 0,
      annualAddition: -30000,
      annualAdditionIncrease: 0,
    },
    4: {
      key: 4,
      name: "social security",
      startYear: new Date().getFullYear() + 30,
      endYear: new Date().getFullYear() + 50,
      startValue: 0,
      annualAddition: 12000,
      annualAdditionIncrease: 0,
    },
    5: {
      key: 5,
      name: "nest egg",
      startYear: new Date().getFullYear(),
      endYear: new Date().getFullYear(),
      startValue: 100000,
      annualAddition: 0,
      annualAdditionIncrease: 0,
    },
  },
});

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
  reset: () => {
    set(getInitStoreState());
  },
  resetDemo: () => {
    set(getDemo());
  },
});

export const store = create(combine(getDemo(), actions));

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
      const currentToken = currentUrlParams.get("s");
      const newToken = dehydrate(store.getState());
      if (currentToken === newToken) {
        return;
      }
      currentUrlParams.set("s", newToken);
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
    border: "1px solid var(--fc-1)",
    borderRadius: 4,
  },
  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fill, minmax(min(500px, calc(100vw - 10px)), 1fr))",
    justifyContent: "center",
    gap: 10,
  },
  pre: {
    whiteSpace: "pre-wrap",
    color: "white",
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
    padding: 10,
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
  },
  table: {
    display: "flex",
    flexDirection: "column",
    color: "var(--fc-0)",
    borderRadius: 4,
  },
  tableHead: {
    position: "sticky",
    top: 0,
    zIndex: 1,
    display: "flex",
    alignItems: "center",
    overflow: "hidden",
  },
  tableBody: {
    overflowX: "auto",
  },
  tableRow: {
    display: "flex",
    alignItems: "center",
    scrollSnapAlign: "start",
  },
  tableData: {
    borderTop: "0.5px solid var(--bgc-1)",
    borderRight: "0.5px solid var(--bgc-1)",
    borderBottom: "0.5px solid var(--bgc-1)",
    borderLeft: "0.5px solid var(--bgc-1)",
    backgroundColor: "black",
    padding: 10,
    minWidth: 120,
  },
  stream: {
    display: "flex",
    flexDirection: "column",
  },
  buttonRow: {
    display: "flex",
    flexDirection: "row",
    gap: 10,
  },
  button: {
    flex: 1,
  },
}));

const EditStream = (props: { k: number }) => {
  const [dirty, setDirty] = React.useState(false);
  const _s = store((s) => s.moneyStreams[props.k]);
  const [s, _ss] = React.useState(_s);
  const ss = (key: keyof typeof _s) => {
    return (e: { target: { value: any } }) => {
      setDirty(true);
      _ss((p) => ({ ...p, [key]: e.target.value }));
    };
  };

  return (
    <div
      style={{
        ...css.card,
        ...(dirty ? { borderColor: "red" } : undefined),
      }}
    >
      <label htmlFor="name">income / expense name</label>
      <input
        id="name"
        type="text"
        onChange={ss("name")}
        value={s.name}
        autoComplete="off"
      />
      <label htmlFor="start year">start year</label>
      <input
        id="start year"
        type="number"
        onChange={ss("startYear")}
        value={s.startYear}
      />
      <label htmlFor="end year">end year</label>
      <input
        id="end year"
        type="number"
        onChange={ss("endYear")}
        value={s.endYear}
      />
      <label htmlFor="start value">start value</label>
      <input
        id="start value"
        type="number"
        onChange={ss("startValue")}
        value={s.startValue}
      />
      <label htmlFor="annual addition">annual addition</label>
      <input
        id="annual addition"
        type="number"
        onChange={ss("annualAddition")}
        value={s.annualAddition}
      />
      <label htmlFor="annual addition increase percent">
        annual addition increase percent
      </label>
      <input
        id="annual addition increase percent"
        type="number"
        onChange={ss("annualAdditionIncrease")}
        value={s.annualAdditionIncrease}
      />
      <div style={css.buttonRow}>
        <button
          style={css.button}
          onClick={() => {
            store.getState().deleteStream(s.key);
          }}
        >
          delete
        </button>
        <button
          style={css.button}
          disabled={!dirty}
          onClick={() => {
            const errors: string[] = [];
            const next = {
              name: s.name as string,
              startYear: Math.floor(+s.startYear),
              endYear: Math.floor(+s.endYear),
              startValue: Math.floor(+s.startValue),
              annualAddition: Math.floor(+s.annualAddition),
              annualAdditionIncrease: +s.annualAdditionIncrease,
              key: s.key as number,
            };
            if (!next.name) {
              errors.push("name must be defined");
            }
            if (
              Number.isNaN(next.startYear) ||
              next.startYear < 1900 ||
              next.startYear > 2200
            ) {
              errors.push("start year must be between 1900 and 2200");
            }
            if (
              Number.isNaN(next.endYear) ||
              next.startYear > next.endYear ||
              next.endYear > 2300
            ) {
              errors.push(
                "end year must be after start year and less than 2300"
              );
            }
            if (Number.isNaN(next.startValue)) {
              errors.push("start value must be a number");
            }
            if (Number.isNaN(next.annualAddition)) {
              errors.push("annual addition must be a number");
            }
            if (Number.isNaN(next.annualAdditionIncrease)) {
              errors.push("annual addition increase must be a number");
            }
            if (errors.length) {
              alert(errors.join("\n"));
              return;
            }
            setDirty(false);
            _ss(next)
            store.getState().putStream(next);
          }}
        >
          save
        </button>
      </div>
    </div>
  );
};

const StreamList = () => {
  const streams = store((s) => s.moneyStreams);

  if (!Object.keys(streams).length) {
    return null;
  }

  return (
    <>
      {Object.values(streams).map((s) => {
        return <EditStream k={s.key} key={s.name} />;
      })}
    </>
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
    const next = {
      primary: year,
      secondary: amount,
    };
    annualAddition += annualAddition * s.annualAdditionIncrease;
    data.push(next);
  }
  return {
    label: s.name,
    data: data.map((d) => ({
      ...d,
      secondary: Math.floor(d.secondary),
      row: null,
    })),
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
  const data: { primary: number; secondary: number; row: number[] }[] = [];
  const firstYear = projectedStreams[0].data[0].primary;
  const lastYear =
    projectedStreams[0].data[projectedStreams[0].data.length - 1].primary;
  for (let year = firstYear, i = 0; year <= lastYear; year++, i++) {
    const annualAdditions = projectedStreams.map((s) => diffYear(s, year));
    const annualAdditionSum = annualAdditions.reduce(
      (acc, cur) => acc + cur,
      0
    );
    const beginningYearSum = data[i - 1]?.secondary ?? 0;
    const prevYearAnnualGrowth = beginningYearSum * roi;
    const annualAdditionGrowth = Math.max(annualAdditionSum * 0.5 * roi, 0);
    const annualRoi = prevYearAnnualGrowth + annualAdditionGrowth;
    const endYearSum = beginningYearSum + annualAdditionSum + annualRoi;
    const row = [
      year,
      beginningYearSum,
      ...annualAdditions,
      annualRoi,
      endYearSum,
    ];
    data.push({ primary: year, secondary: endYearSum, row });
  }
  return { label: "sum", data };
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

  const { data, sumData, givenData } = React.useMemo(() => {
    if (!ss.length) {
      return { data: null, sumData: null, givenData: null };
    }
    const givenData = ss.map((e) =>
      projectStream({ startYear, endYear, s: e })
    );
    const sumData = getSumStream(givenData, roi);
    return { data: [...givenData, sumData], sumData, givenData };
  }, [ss, startYear, endYear, roi]);

  const rows = React.useMemo(() => {
    if (!sumData || !givenData) return;
    const streamLabels = givenData.map((d) => d.label);
    const header = ["year", "start", ...streamLabels, "annual roi", "end"];
    const rows: string[][] = [header];
    return sumData.data.reduce((acc, cur) => {
      acc.push(cur.row.map((n) => n.toFixed(0)));
      return acc;
    }, rows);
  }, [sumData, givenData]);
  return { data, rows };
};

const Table = ({ rows }: { rows: (string | number)[][] | undefined }) => {
  const headerRef = React.useRef<HTMLElement>(null);
  if (!rows) return null;
  return (
    <table style={css.table}>
      <th style={css.tableHead} ref={headerRef as any}>
        {rows[0].map((c, i) => (
          <td style={css.tableData} key={i}>
            {c}
          </td>
        ))}
      </th>
      <tbody
        style={css.tableBody}
        // workaround to get stick headers
        onScroll={(e) => {
          headerRef.current!.scrollLeft = e.currentTarget.scrollLeft;
        }}
      >
        {rows.slice(1).map((r, i) => (
          <tr key={i} style={css.tableRow}>
            {r.map((c, j) => (
              <td key={j} style={css.tableData}>
                {isNaN(+c) ? c : (+c).toLocaleString()}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const Line = () => {
  const { data, rows } = useLineData();

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
            data: data as any,
            primaryAxis,
            secondaryAxes,
            dark: true,
          }}
        />
      </div>
      {/* <pre style={css.pre}>
        {JSON.stringify({ data, state: store.getState() }, null, 2)}
      </pre> */}
      <Table rows={rows} />
    </>
  );
};

const Options = () => {
  const value = store((s) => s.roi);
  const lastSaved = store((s) => s.lastSaved);
  const handleShare = () => {
    try {
      const currentUrl = window.location.href;
      const url = new URL(currentUrl);
      const currentUrlParams = url.searchParams;
      const currentToken = currentUrlParams.get("s");
      const newToken = dehydrate(store.getState());
      if (currentToken === newToken) {
        alert("saved in url and copied to clipboard");
        return;
      }
      currentUrlParams.set("s", newToken);
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
      const token = searchParams.get("s");
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
      <label htmlFor="roi">{`roi (9% annual return and 3% inflation = 0.06)`}</label>
      <input
        id="roi"
        type="number"
        value={value}
        onChange={(e) => store.setState({ roi: +e.target.value })}
      />
      <label htmlFor="addnew">add</label>
      <button
        id="addnew"
        onClick={() => {
          const key = Date.now();
          store.getState().putStream({
            name: "new income / expense",
            startYear: new Date().getFullYear(),
            endYear: new Date().getFullYear() + 10,
            startValue: 0,
            annualAddition: 0,
            annualAdditionIncrease: 0,
            key,
          });
        }}
      >
        add income / expense
      </button>
      <label htmlFor="save">
        last saved {new Date(lastSaved).toLocaleDateString()}{" "}
        {new Date(lastSaved).toLocaleTimeString()}
      </label>
      <button id="save" onClick={handleShare}>{`share`}</button>
      <label htmlFor="reset">reset all data</label>
      <button id="reset" onClick={store.getState().reset}>{`reset`}</button>
      <label htmlFor="demo">reset all data and show demo</label>
      <button
        id="demo"
        onClick={store.getState().resetDemo}
      >{`show demo`}</button>
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
          <div style={css.grid}>
            <Options />
            <StreamList />
          </div>
          <Line />
        </RootErrorBoundary>
      </div>
    </>
  );
}
