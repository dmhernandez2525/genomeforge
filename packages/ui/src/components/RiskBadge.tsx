import { forwardRef, type HTMLAttributes } from 'react';
import { cn, getRiskColorPair } from '../utils';
import type { RiskLevel } from '@genomeforge/types';

export interface RiskBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  risk: RiskLevel;
  showIcon?: boolean;
}

const riskIcons: Record<RiskLevel, string> = {
  high: '⚠️',
  moderate: '⚡',
  low: '✓',
  unknown: '?'
};

const riskLabels: Record<RiskLevel, string> = {
  high: 'High Risk',
  moderate: 'Moderate',
  low: 'Low Risk',
  unknown: 'Unknown'
};

export const RiskBadge = forwardRef<HTMLSpanElement, RiskBadgeProps>(
  ({ className, risk, showIcon = true, ...props }, ref) => {
    const colors = getRiskColorPair(risk);

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 text-sm font-medium rounded-full border',
          colors.text,
          colors.bg,
          colors.border,
          className
        )}
        {...props}
      >
        {showIcon && (
          <span className="text-xs" aria-hidden="true">
            {riskIcons[risk]}
          </span>
        )}
        {riskLabels[risk]}
      </span>
    );
  }
);

RiskBadge.displayName = 'RiskBadge';
