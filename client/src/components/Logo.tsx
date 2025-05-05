import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/constants";
import { motion } from "framer-motion";

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
      {showText && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={cn("font-extrabold tracking-tight flex items-baseline", textSizes[size])}
        >
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-400">
            Tbz
          </span>
          <span className="text-gray-900 dark:text-white">
            <span className="relative">
              R
              <motion.span
                className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-purple-500 rounded-full"
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.7, 1, 0.7] 
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </span>
            esume
          </span>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
            Builder
          </span>
        </motion.div>
      )}
    </div>
  );
};

export default Logo;
