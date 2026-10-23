
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface RegistrationPageHeaderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  action?: ReactNode;
}

export const RegistrationPageHeader: React.FC<
  RegistrationPageHeaderProps
> = ({ title, description, icon: Icon, action }) => {
  return (
    <header className="flex w-full min-w-0 flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-border bg-muted/30">
            <Icon
              aria-hidden="true"
              className="h-3.5 w-3.5 text-muted-foreground"
            />
          </span>

          <h1 className="text-sm font-semibold tracking-tight text-foreground sm:text-base">
            {title}
          </h1>
        </div>

        <p className="mt-1.5 pl-0 text-[11px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>

      {action && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 [&_button]:h-8 [&_button]:rounded-none [&_button]:px-3 [&_button]:text-xs">
          {action}
        </div>
      )}
    </header>
  );
};
