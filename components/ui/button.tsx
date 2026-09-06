import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "group/button inline-flex shrink-0 cursor-pointer items-center justify-center rounded-[10px] border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap shadow-[0_1px_2px_rgba(17,20,15,0.05)] transition-[background-color,border-color,box-shadow,color] duration-[140ms] ease-[cubic-bezier(.2,.8,.2,1)] select-none aria-disabled:cursor-not-allowed aria-disabled:border-border aria-disabled:bg-muted aria-disabled:text-muted-foreground aria-disabled:shadow-none disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none data-disabled:cursor-not-allowed data-disabled:border-border data-disabled:bg-muted data-disabled:text-muted-foreground data-disabled:shadow-none aria-invalid:border-destructive [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        accent:
          'bg-accent text-accent-foreground [&:is(a)]:text-accent-foreground [@media(hover:hover)_and_(pointer:fine)]:[&:not(:disabled):not([aria-disabled=true]):not([data-disabled]):hover]:bg-[color-mix(in_oklab,var(--color-accent),var(--color-foreground)_8%)] [@media(hover:hover)_and_(pointer:fine)]:[&:not(:disabled):not([aria-disabled=true]):not([data-disabled]):hover]:shadow-[0_2px_8px_rgba(17,20,15,0.12)]',
        default:
          'bg-primary text-primary-foreground [&:is(a)]:text-primary-foreground [@media(hover:hover)_and_(pointer:fine)]:[&:not(:disabled):not([aria-disabled=true]):not([data-disabled]):hover]:bg-[color-mix(in_oklab,var(--color-primary),white_10%)] [@media(hover:hover)_and_(pointer:fine)]:[&:not(:disabled):not([aria-disabled=true]):not([data-disabled]):hover]:shadow-[0_2px_8px_rgba(17,20,15,0.14)]',
        outline:
          'border-border bg-card text-foreground [&:is(a)]:text-foreground aria-expanded:border-foreground aria-expanded:bg-muted [@media(hover:hover)_and_(pointer:fine)]:[&:not(:disabled):not([aria-disabled=true]):not([data-disabled]):hover]:border-muted-foreground [@media(hover:hover)_and_(pointer:fine)]:[&:not(:disabled):not([aria-disabled=true]):not([data-disabled]):hover]:bg-muted',
        secondary:
          'bg-accent text-accent-foreground [&:is(a)]:text-accent-foreground aria-expanded:bg-accent aria-expanded:text-accent-foreground [@media(hover:hover)_and_(pointer:fine)]:[&:not(:disabled):not([aria-disabled=true]):not([data-disabled]):hover]:bg-[color-mix(in_oklab,var(--color-accent),var(--color-foreground)_8%)]',
        ghost:
          'bg-transparent text-foreground [&:is(a)]:text-foreground shadow-none aria-expanded:bg-muted [@media(hover:hover)_and_(pointer:fine)]:[&:not(:disabled):not([aria-disabled=true]):not([data-disabled]):hover]:bg-muted',
        destructive:
          'border-destructive/20 bg-destructive/10 text-destructive [&:is(a)]:text-destructive shadow-none [@media(hover:hover)_and_(pointer:fine)]:[&:not(:disabled):not([aria-disabled=true]):not([data-disabled]):hover]:border-destructive/30 [@media(hover:hover)_and_(pointer:fine)]:[&:not(:disabled):not([aria-disabled=true]):not([data-disabled]):hover]:bg-destructive/20',
      },
      size: {
        default:
          'h-10 gap-2 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3',
        xs: "h-9 gap-1.5 px-3 in-data-[slot=button-group]:rounded-[10px] has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-3.5",
        sm: "h-9 gap-1.5 px-3 in-data-[slot=button-group]:rounded-[10px] has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: 'h-12 gap-2 px-5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4',
        icon: 'size-10 p-0',
        'icon-xs':
          "size-10 p-0 in-data-[slot=button-group]:rounded-[10px] [&_svg:not([class*='size-'])]:size-3.5",
        'icon-sm': 'size-10 p-0 in-data-[slot=button-group]:rounded-[10px]',
        'icon-lg': 'size-12 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
