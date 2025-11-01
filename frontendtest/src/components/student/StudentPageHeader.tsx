import { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  right?: ReactNode;
};

export default function StudentPageHeader({ title, subtitle, right }: Props) {
  return (
    <div className="mb-4">
      <div className="rounded-2xl p-4 bg-muted border shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-2xl font-extrabold leading-tight text-foreground">{title}</h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          {right && <div className="shrink-0">{right}</div>}
        </div>
      </div>
    </div>
  );
}
