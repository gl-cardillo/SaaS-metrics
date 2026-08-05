"use client";

import { downloadCsv } from "@/lib/exportCsv";

export const ExportButton = ({
  filename,
  rows,
}: {
  filename: string;
  rows: Record<string, unknown>[];
}) => (
  <button
    type="button"
    onClick={() => downloadCsv(filename, rows)}
    disabled={rows.length === 0}
    className="text-xs font-medium text-(--text-secondary) underline underline-offset-2 hover:text-(--text-primary) disabled:cursor-not-allowed disabled:no-underline disabled:opacity-40"
  >
    Export CSV
  </button>
);
