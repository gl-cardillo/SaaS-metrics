export const EmptyState = ({ message }: { message: string }) => (
  <div className="flex min-h-24 items-center justify-center py-8 text-center">
    <p className="text-sm text-(--text-muted)">{message}</p>
  </div>
);
