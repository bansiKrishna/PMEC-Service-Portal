
import type { LucideIcon } from "lucide-react";

interface RegistrationStatCardProps {
  label: string;
  value: number | string;
  description: string;
  icon: LucideIcon;
}

export const RegistrationStatCard: React.FC<
  RegistrationStatCardProps
> = ({ label, value, description, icon: Icon }) => {
  return (
    <section className="min-w-0 border border-border bg-card p-3 transition-colors hover:bg-muted/10">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-muted-foreground sm:text-[10px]">
            {label}
          </p>

          <p className="mt-2 break-words text-lg font-semibold leading-none tracking-tight tabular-nums text-foreground sm:text-xl">
            {value}
          </p>

          <p
            className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground"
            title={description}
          >
            {description}
          </p>
        </div>

        <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-border bg-muted/30">
          <Icon
            aria-hidden="true"
            className="h-3.5 w-3.5 text-muted-foreground"
          />
        </span>
      </div>
    </section>
  );
};
