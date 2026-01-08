import { View, Text, TextInput, TextInputProps } from "react-native";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export function Input({
  label,
  error,
  containerClassName = "",
  className = "",
  ...props
}: InputProps) {
  return (
    <View className={containerClassName}>
      {label && (
        <Text className="text-sm font-medium text-slate-700 mb-1.5">
          {label}
        </Text>
      )}
      <TextInput
        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-slate-900 ${
          error ? "border-red-500" : "border-slate-200"
        } ${className}`}
        placeholderTextColor="#94A3B8"
        {...props}
      />
      {error && (
        <Text className="text-sm text-red-500 mt-1">{error}</Text>
      )}
    </View>
  );
}





