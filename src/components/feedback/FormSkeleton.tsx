import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * FormSkeleton — skeleton for forms (auth, address, profile, contact).
 * Renders N labeled input rows + a submit button skeleton.
 *
 * Used by: Login/Register, Address add/edit, Profile edit, Contact form.
 */
export interface FormSkeletonProps {
  fields?: number;
  className?: string;
  showSubmit?: boolean;
}

export function FormSkeleton({
  fields = 4,
  className,
  showSubmit = true,
}: FormSkeletonProps) {
  return (
    <div className={cn("space-y-5", className)} aria-hidden="true">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3 w-24 bg-sand" />
          <Skeleton className="h-10 w-full rounded-xl bg-sand" />
        </div>
      ))}
      {showSubmit && <Skeleton className="h-10 w-full rounded-full bg-sand" />}
    </div>
  );
}
