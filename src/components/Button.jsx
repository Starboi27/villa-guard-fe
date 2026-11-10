import { buttonVariants } from "./ui/button-variants.js";
import { cn } from "../lib/cn.js";
import { Slot } from "../lib/slot.jsx";
import styles from "./Button.module.css";

const primitiveVariant = {
  primary: "default",
  secondary: "secondary",
  ghost: "ghost",
  selected: "secondary",
  danger: "destructive",
  icon: "outline",
  video: "outline",
};

export const Button = ({
  children,
  type = "button",
  variant = "primary",
  className = "",
  asChild = false,
  ...props
}) => {
  const buttonClassName = cn(
    buttonVariants({
      variant: primitiveVariant[variant] ?? "default",
      size: variant === "icon" ? "icon" : "default",
    }),
    styles.button,
    styles[variant] ?? styles.primary,
    className,
  );

  if (asChild) {
    return (
      <Slot {...props} className={buttonClassName} data-slot="button">
        {children}
      </Slot>
    );
  }

  return (
    <button
      type={type}
      className={buttonClassName}
      data-slot="button"
      {...props}
    >
      {children}
    </button>
  );
};
