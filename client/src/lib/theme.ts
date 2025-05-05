// Theme constants for the application
// This helps with consistent styling across all pages and components

export const COLORS = {
  // Primary brand colors
  primary: "#5E17EB",
  primaryLight: "#7E3FFF",
  primaryDark: "#4A11C0",
  
  // Secondary brand colors
  secondary: "#FFCC00",
  secondaryDark: "#E6B800",
  secondaryLight: "#FFD633",
  
  // Gray scale
  white: "#FFFFFF",
  grayLight: "#F8F9FA",
  grayMedium: "#E9ECEF",
  grayDark: "#6C757D",
  black: "#212529",
  
  // UI colors
  success: "#28A745",
  warning: "#FFC107",
  danger: "#DC3545",
  info: "#17A2B8",
};

export const FONTS = {
  primary: {
    family: "sans-serif",
    weights: {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  secondary: {
    family: "serif",
  },
  monospace: {
    family: "monospace",
  },
};

export const SPACING = {
  xs: "0.25rem", // 4px
  sm: "0.5rem",  // 8px
  md: "1rem",    // 16px
  lg: "1.5rem",  // 24px
  xl: "2rem",    // 32px
  xxl: "3rem",   // 48px
};

export const BREAKPOINTS = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1400,
};

export const SHADOWS = {
  sm: "0 1px 2px rgba(0, 0, 0, 0.05)",
  md: "0 4px 6px rgba(0, 0, 0, 0.1)",
  lg: "0 10px 15px rgba(0, 0, 0, 0.1)",
  xl: "0 20px 25px rgba(0, 0, 0, 0.15)",
};

export const BORDER_RADIUS = {
  sm: "0.25rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "1rem",
  full: "9999px",
};

export const ANIMATIONS = {
  fast: "0.15s ease-in-out",
  medium: "0.3s ease-in-out",
  slow: "0.5s ease-in-out",
};

// Theme object combining all theme values
export const THEME = {
  colors: COLORS,
  fonts: FONTS,
  spacing: SPACING,
  breakpoints: BREAKPOINTS,
  shadows: SHADOWS,
  borderRadius: BORDER_RADIUS,
  animations: ANIMATIONS,
};