export const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;
export const trimLower = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;
// accepts ?x=a&x=b and ?x=a,b
export const toStringArray = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null) return value;
  const items = Array.isArray(value) ? value : [value];
  return items
    .flatMap((v) => (typeof v === 'string' ? v.split(',') : [v]))
    .map((v) => (typeof v === 'string' ? v.trim() : v))
    .filter((v) => v !== '');
};
