import { connectionTypes, graphLimits, type ConnectionType } from './contract';

export interface ConnectionState {
  focus: string | null;
  query: string;
  selected: { kind: 'node' | 'edge'; id: string } | null;
  direction: 'in' | 'out' | 'both';
  types: ConnectionType[];
  kinds: string[];
  expanded: { id: string; steps: number }[];
  mode: 'graph' | 'list';
  budget: number;
  corpus: string | null;
  index: string | null;
}
export class ConnectionQueryError extends Error {}
const keys = new Set(['q', 'focus', 'selected', 'direction', 'types', 'kinds', 'expanded', 'mode', 'budget', 'corpus', 'index']);
const fail = (message: string): never => { throw new ConnectionQueryError(message); };
const text = (value: string, maximum = 240) => {
  if (!value || value.length > maximum || /[\u0000-\u001f\u007f]/u.test(value)) fail('Invalid connection identifier');
  return value;
};
const integer = (value: string, min: number, max: number) => {
  if (!/^[1-9]\d*$/u.test(value)) fail('Invalid connection count');
  const number = Number(value);
  if (number < min || number > max) fail('Connection count outside supported bounds');
  return number;
};
const sorted = (values: string[]) => [...new Set(values)].sort();

/** Parsing does not resolve IDs or scan the corpus. Unknown IDs are handled by the snapshot resolver. */
export function parseConnectionState(params: URLSearchParams, knownKinds: readonly string[]): ConnectionState {
  if (params.toString().length > graphLimits.maxQueryLength) fail('Connection URL is too long');
  for (const key of params.keys()) {
    if (!keys.has(key) || params.getAll(key).length !== 1) fail(`Unknown or repeated connection parameter: ${key}`);
  }
  const direction = params.get('direction') ?? 'both';
  const mode = params.get('mode') ?? 'list';
  if (!['in', 'out', 'both'].includes(direction)) fail('Invalid connection direction');
  if (!['graph', 'list'].includes(mode)) fail('Invalid connection mode');
  const list = (key: string, allowed: readonly string[]) => {
    if (!params.has(key)) return sorted([...allowed]);
    const values = params.get(key) === '' ? [] : params.get(key)!.split(',');
    if (values.length > allowed.length || values.some(value => !allowed.includes(value))) fail(`Invalid connection ${key}`);
    return sorted(values);
  };
  const expanded: ConnectionState['expanded'] = [];
  if (params.has('expanded')) {
    // JSON tuples avoid delimiter ambiguities in canonical record identifiers.
    let value: unknown;
    try { value = JSON.parse(params.get('expanded')!); } catch { fail('Invalid expansion state'); }
    if (!Array.isArray(value) || value.length > graphLimits.maxExpansions) fail('Too many or invalid expansions');
    for (const item of value as unknown[]) {
      if (!Array.isArray(item) || item.length !== 2 || typeof item[0] !== 'string' || !Number.isInteger(item[1])) fail('Invalid expansion tuple');
      const tuple = item as [string, number];
      if (expanded.some(entry => entry.id === tuple[0])) fail('Repeated expansion identifier');
      expanded.push({ id: text(tuple[0]), steps: integer(String(tuple[1]), 1, 8) });
    }
  }
  const selectedValue = params.get('selected');
  let selected: ConnectionState['selected'] = null;
  if (selectedValue !== null) {
    const separator = selectedValue.indexOf(':');
    const kind = selectedValue.slice(0, separator);
    if (kind !== 'node' && kind !== 'edge') fail('Invalid selection kind');
    selected = { kind: kind as 'node' | 'edge', id: text(selectedValue.slice(separator + 1), 1600) };
  }
  const focus = params.has('focus') ? text(params.get('focus')!) : null;
  if (!focus && (expanded.length || selected)) fail('Selection and expansion require a focus');
  return {
    focus, query: params.get('q') ? text(params.get('q')!) : '', selected, direction: direction as ConnectionState['direction'],
    types: list('types', connectionTypes) as ConnectionType[], kinds: list('kinds', knownKinds),
    expanded, mode: mode as ConnectionState['mode'],
    budget: params.has('budget') ? integer(params.get('budget')!, 1, graphLimits.maxNodes) : graphLimits.defaultNodes,
    corpus: params.has('corpus') ? text(params.get('corpus')!, 100) : null,
    index: params.has('index') ? text(params.get('index')!, 100) : null,
  };
}

/** The URL is the whole portable exploration state. Expansion order records ownership priority. */
export function connectionURL(state: ConnectionState, knownKinds?: readonly string[]): string {
  const params = new URLSearchParams();
  if (state.query) params.set('q', state.query);
  if (state.focus) params.set('focus', state.focus);
  if (state.selected) params.set('selected', `${state.selected.kind}:${state.selected.id}`);
  if (state.direction !== 'both') params.set('direction', state.direction);
  if (sorted(state.types).join(',') !== sorted([...connectionTypes]).join(',')) params.set('types', sorted(state.types).join(','));
  if (!knownKinds || sorted(state.kinds).join(',') !== sorted([...knownKinds]).join(',')) params.set('kinds', sorted(state.kinds).join(','));
  if (state.expanded.length) params.set('expanded', JSON.stringify(state.expanded.map(({ id, steps }) => [id, steps])));
  if (state.mode !== 'list') params.set('mode', state.mode);
  if (state.budget !== graphLimits.defaultNodes) params.set('budget', String(state.budget));
  if (state.corpus) params.set('corpus', state.corpus);
  if (state.index) params.set('index', state.index);
  return `/connections?${params}`;
}
