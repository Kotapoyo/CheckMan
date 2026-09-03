import { useCallback, useSyncExternalStore } from "react";
import type { PackItem, Trip } from "./trip-types";

const KEY = "tabikake.v1";

interface State {
  trips: Trip[];
  currentTripId: string | null;
}

const EMPTY: State = { trips: [], currentTripId: null };

let state: State = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load(): State {
  if (typeof window === "undefined") return EMPTY;
  if (loaded) return state;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) state = { ...EMPTY, ...(JSON.parse(raw) as State) };
  } catch {
    state = EMPTY;
  }
  return state;
}

function persist() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable */
  }
}

function setState(next: State) {
  state = next;
  persist();
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  load();
  listeners.add(l);
  return () => listeners.delete(l);
}

const getSnapshot = () => load();
const getServerSnapshot = () => EMPTY;

export function useTripState() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useCurrentTrip(): Trip | null {
  const s = useTripState();
  return s.trips.find((t) => t.id === s.currentTripId) ?? s.trips[0] ?? null;
}

export const actions = {
  addTrip(trip: Trip) {
    load();
    setState({ trips: [trip, ...state.trips], currentTripId: trip.id });
  },
  selectTrip(id: string) {
    load();
    setState({ ...state, currentTripId: id });
  },
  updateTrip(id: string, patch: Partial<Trip>) {
    load();
    setState({
      ...state,
      trips: state.trips.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    });
  },
  deleteTrip(id: string) {
    load();
    const trips = state.trips.filter((t) => t.id !== id);
    setState({
      trips,
      currentTripId: state.currentTripId === id ? (trips[0]?.id ?? null) : state.currentTripId,
    });
  },
  updateItem(tripId: string, itemId: string, patch: Partial<PackItem>) {
    load();
    setState({
      ...state,
      trips: state.trips.map((t) =>
        t.id === tripId
          ? {
              ...t,
              items: t.items.map((i) =>
                i.id === itemId ? { ...i, ...patch, updatedAt: Date.now() } : i,
              ),
            }
          : t,
      ),
    });
  },
  updateItems(tripId: string, itemIds: string[], patch: Partial<PackItem>) {
    load();
    const ids = new Set(itemIds);
    const updatedAt = Date.now();
    setState({
      ...state,
      trips: state.trips.map((t) =>
        t.id === tripId
          ? {
              ...t,
              items: t.items.map((item) =>
                ids.has(item.id) ? { ...item, ...patch, updatedAt } : item,
              ),
            }
          : t,
      ),
    });
  },
  addItem(tripId: string, item: PackItem) {
    load();
    actionsUpdateItems(tripId, (items) => [...items, item]);
  },
  removeItem(tripId: string, itemId: string) {
    load();
    actionsUpdateItems(tripId, (items) => items.filter((i) => i.id !== itemId));
  },
  setItems(tripId: string, items: PackItem[]) {
    actionsUpdateItems(tripId, () => items);
  },
  clearAll() {
    setState(EMPTY);
  },
};

function actionsUpdateItems(tripId: string, fn: (items: PackItem[]) => PackItem[]) {
  load();
  setState({
    ...state,
    trips: state.trips.map((t) => (t.id === tripId ? { ...t, items: fn(t.items) } : t)),
  });
}

export function useHydrated() {
  return useSyncExternalStore(
    useCallback((cb: () => void) => {
      cb();
      return () => {};
    }, []),
    () => true,
    () => false,
  );
}

export function progressOf(trip: Trip) {
  const counted = trip.items.filter((i) => i.status !== "unneeded");
  const packed = counted.filter((i) => i.status === "packed");
  return {
    total: counted.length,
    done: packed.length,
    percent: counted.length ? Math.round((packed.length / counted.length) * 100) : 0,
    criticalOpen: counted.filter((i) => i.priority === "high" && i.status !== "packed").length,
  };
}
