import { View, Text, ViewProps } from "react-native";

interface BadgeProps extends ViewProps {
  children: React.ReactNode;
  variant?: "primary" | "success" | "warning" | "danger" | "secondary";
  className?: string;
}

export function Badge({
  children,
  variant = "primary",
  className = "",
  ...props
}: BadgeProps) {
  const variantStyles = {
    primary: "bg-primary/10",
    success: "bg-green-100",
    warning: "bg-amber-100",
    danger: "bg-red-100",
    secondary: "bg-slate-100",
  };

  const textVariantStyles = {
    primary: "text-primary",
    success: "text-green-700",
    warning: "text-amber-700",
    danger: "text-red-700",
    secondary: "text-slate-700",
  };

  return (
    <View
      className={`px-2.5 py-1 rounded-full ${variantStyles[variant]} ${className}`}
      {...props}
    >
      <Text className={`text-xs font-medium ${textVariantStyles[variant]}`}>
        {children}
      </Text>
    </View>
  );
}


