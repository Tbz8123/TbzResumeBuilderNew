import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/constants";

type LogoProps = {
  className?: string;
  size?: "small" | "medium" | "large";
  showText?: boolean;
};

const Logo = ({ className, size = "medium", showText = true }: LogoProps) => {
  const sizes = {
    small: "w-8 h-8 text-base",
    medium: "w-10 h-10 text-xl",
    large: "w-12 h-12 text-2xl",
  };

  const textSizes = {
    small: "text-lg",
    medium: "text-xl",
    large: "text-2xl",
  };

  return (
    <div className="flex items-center">
      <div
        className={cn(
          "rounded-lg flex items-center justify-center font-bold mr-2",
          BRAND.logo.bgColor,
          BRAND.logo.textColor,
          sizes[size],
          className
        )}
      >
        <span>{BRAND.logo.symbol}</span>
      </div>
      {showText && (
        <span className={cn("font-bold tracking-tight", textSizes[size])}>
          {BRAND.name}
        </span>
      )}
    </div>
  );
};

export default Logo;
