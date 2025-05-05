import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  size?: "small" | "medium" | "large";
};

const Logo = ({ className, size = "medium" }: LogoProps) => {
  const sizes = {
    small: "w-8 h-8 text-base",
    medium: "w-10 h-10 text-xl",
    large: "w-12 h-12 text-2xl",
  };

  return (
    <div className="flex items-center">
      <div
        className={cn(
          "rounded-lg bg-primary flex items-center justify-center text-white font-bold mr-2",
          sizes[size],
          className
        )}
      >
        <span>T</span>
      </div>
      <span className={cn("font-bold tracking-tight", {
        "text-lg": size === "small",
        "text-xl": size === "medium",
        "text-2xl": size === "large",
      })}>
        TbzResumeBuilder
      </span>
    </div>
  );
};

export default Logo;
