const Block = ({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) => (
  <div
    className={`animate-pulse rounded-md ${className}`}
    style={{ background: "var(--card-bg-raised)", ...style }}
  />
);

const StatTileSkeleton = () => (
  <div
    className="flex flex-col gap-3 rounded-xl border p-5"
    style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
  >
    <Block className="h-4 w-24" />
    <Block className="h-9 w-32" />
  </div>
);

const ChartCardSkeleton = ({ height = 220 }: { height?: number }) => (
  <div
    className="flex flex-col gap-3 rounded-xl border p-4"
    style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
  >
    <Block className="h-4 w-32" />
    <Block style={{ height }} />
  </div>
);

export const DashboardSkeleton = () => (
  <div className="flex flex-col gap-6">
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {Array.from({ length: 5 }, (_, i) => (
        <StatTileSkeleton key={i} />
      ))}
    </div>
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <div className="flex flex-col gap-4">
        <ChartCardSkeleton height={220} />
        <ChartCardSkeleton height={240} />
      </div>
      <div className="flex flex-col gap-4">
        <ChartCardSkeleton height={240} />
        <ChartCardSkeleton height={200} />
        <ChartCardSkeleton height={160} />
      </div>
    </div>
    <ChartCardSkeleton height={280} />
  </div>
);
