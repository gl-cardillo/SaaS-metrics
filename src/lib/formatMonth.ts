const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function formatMonth(iso: string): string {
  const [year, month] = iso.split("-");
  return `${MONTH_ABBR[Number(month) - 1]} '${year.slice(2)}`;
}
