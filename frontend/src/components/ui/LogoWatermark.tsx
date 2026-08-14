import { motion } from "framer-motion";
import { cn } from "../../utils/cn";

type WatermarkVariant = "single" | "double" | "corner" | "center" | "hero";
type WatermarkPosition =
  | "right"
  | "left"
  | "center"
  | "bottom-right"
  | "top-left";

interface LogoWatermarkProps {
  variant?: WatermarkVariant;
  position?: WatermarkPosition;
  opacity?: number;
  size?: "sm" | "md" | "lg" | "xl" | "hero";
  animate?: boolean;
  className?: string;
}

const SIZE_MAP = {
  sm: "h-40 sm:h-56",
  md: "h-64 sm:h-80",
  lg: "h-[400px] sm:h-[500px]",
  xl: "h-[500px] sm:h-[650px]",
  hero: "h-[80%] max-h-[700px] w-auto",
};

const POSITION_MAP: Record<WatermarkPosition, string> = {
  right: "-right-20 top-1/2 -translate-y-1/2 sm:-right-32",
  left: "-left-20 top-1/2 -translate-y-1/2 sm:-left-32",
  center: "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
  "bottom-right": "-right-10 -bottom-10",
  "top-left": "-left-10 -top-10",
};

const LOGO_SRC = "/images/city-snack-logo.png";

export function LogoWatermark({
  variant = "single",
  position = "right",
  opacity = 0.06,
  size = "lg",
  animate = true,
  className,
}: LogoWatermarkProps) {
  // 🌟 HERO variant — giant centered watermark for page headers
  if (variant === "hero") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className={cn(
          "pointer-events-none absolute inset-0 flex items-center justify-center select-none",
          className,
        )}
      >
        <img
          src={LOGO_SRC}
          alt=""
          aria-hidden="true"
          className="h-[85%] max-h-[600px] w-auto object-contain sm:h-[90%] sm:max-h-[750px]"
        />
      </motion.div>
    );
  }

  const baseClasses = cn(
    "pointer-events-none absolute w-auto select-none",
    SIZE_MAP[size],
    POSITION_MAP[position],
    className,
  );

  if (variant === "double") {
    return (
      <>
        {animate ? (
          <motion.img
            src={LOGO_SRC}
            alt=""
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2 }}
            className={baseClasses}
          />
        ) : (
          <img
            src={LOGO_SRC}
            alt=""
            aria-hidden="true"
            className={baseClasses}
            style={{ opacity }}
          />
        )}

        <img
          src={LOGO_SRC}
          alt=""
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute h-40 w-auto select-none",
            position === "right" ? "-left-10 bottom-10" : "-right-10 top-10",
          )}
          style={{ opacity: opacity * 0.6 }}
        />
      </>
    );
  }

  if (variant === "corner") {
    return (
      <img
        src={LOGO_SRC}
        alt=""
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute h-32 w-auto select-none sm:h-48",
          POSITION_MAP[position],
        )}
        style={{ opacity }}
      />
    );
  }

  if (variant === "center") {
    return animate ? (
      <motion.img
        src={LOGO_SRC}
        alt=""
        aria-hidden="true"
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.5 }}
        className={cn(
          baseClasses,
          "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
        )}
      />
    ) : (
      <img
        src={LOGO_SRC}
        alt=""
        aria-hidden="true"
        className={cn(
          baseClasses,
          "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
        )}
        style={{ opacity }}
      />
    );
  }

  return animate ? (
    <motion.img
      src={LOGO_SRC}
      alt=""
      aria-hidden="true"
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1.2 }}
      className={baseClasses}
    />
  ) : (
    <img
      src={LOGO_SRC}
      alt=""
      aria-hidden="true"
      className={baseClasses}
      style={{ opacity }}
    />
  );
}