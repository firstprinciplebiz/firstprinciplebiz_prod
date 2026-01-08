import { View, Text, TouchableOpacity, Modal, ScrollView } from "react-native";
import { useState } from "react";
import { ChevronDown, Check, X } from "lucide-react-native";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  value: string;
  options: SelectOption[];
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export function Select({ label, value, options, onValueChange, placeholder = "Select..." }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <View className="mb-4">
      {label && (
        <Text className="text-sm font-medium text-slate-700 mb-1.5">{label}</Text>
      )}
      <TouchableOpacity
        className="flex-row items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3"
        onPress={() => setIsOpen(true)}
      >
        <Text className={selectedOption ? "text-slate-900" : "text-slate-400"}>
          {selectedOption?.label || placeholder}
        </Text>
        <ChevronDown color="#64748B" size={20} />
      </TouchableOpacity>

      <Modal visible={isOpen} animationType="slide" transparent>
        <TouchableOpacity
          className="flex-1 bg-black/50"
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View className="flex-1 justify-end">
            <View className="bg-white rounded-t-3xl max-h-[70%]">
              <View className="flex-row items-center justify-between p-4 border-b border-slate-100">
                <Text className="text-lg font-semibold text-slate-900">{label || "Select"}</Text>
                <TouchableOpacity onPress={() => setIsOpen(false)}>
                  <X color="#64748B" size={24} />
                </TouchableOpacity>
              </View>
              <ScrollView className="p-2">
                {options.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    className={`flex-row items-center justify-between p-4 rounded-xl mb-1 ${
                      value === option.value ? "bg-primary/10" : ""
                    }`}
                    onPress={() => {
                      onValueChange(option.value);
                      setIsOpen(false);
                    }}
                  >
                    <Text
                      className={`text-base ${
                        value === option.value ? "text-primary font-medium" : "text-slate-900"
                      }`}
                    >
                      {option.label}
                    </Text>
                    {value === option.value && <Check color="#2563EB" size={20} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

interface MultiSelectProps {
  label?: string;
  value: string[];
  options: SelectOption[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  maxSelections?: number;
}

export function MultiSelect({
  label,
  value,
  options,
  onValueChange,
  placeholder = "Select...",
  maxSelections,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabels = options
    .filter((opt) => value.includes(opt.value))
    .map((opt) => opt.label);

  const toggleOption = (optValue: string) => {
    if (value.includes(optValue)) {
      onValueChange(value.filter((v) => v !== optValue));
    } else {
      if (maxSelections && value.length >= maxSelections) {
        return;
      }
      onValueChange([...value, optValue]);
    }
  };

  return (
    <View className="mb-4">
      {label && (
        <Text className="text-sm font-medium text-slate-700 mb-1.5">{label}</Text>
      )}
      <TouchableOpacity
        className="flex-row items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3 min-h-[48px]"
        onPress={() => setIsOpen(true)}
      >
        <Text
          className={selectedLabels.length > 0 ? "text-slate-900 flex-1" : "text-slate-400"}
          numberOfLines={2}
        >
          {selectedLabels.length > 0 ? selectedLabels.join(", ") : placeholder}
        </Text>
        <ChevronDown color="#64748B" size={20} />
      </TouchableOpacity>

      <Modal visible={isOpen} animationType="slide" transparent>
        <TouchableOpacity
          className="flex-1 bg-black/50"
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View className="flex-1 justify-end">
            <View className="bg-white rounded-t-3xl max-h-[70%]">
              <View className="flex-row items-center justify-between p-4 border-b border-slate-100">
                <View>
                  <Text className="text-lg font-semibold text-slate-900">{label || "Select"}</Text>
                  {maxSelections && (
                    <Text className="text-xs text-slate-500">
                      {value.length}/{maxSelections} selected
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  className="bg-primary px-4 py-2 rounded-lg"
                  onPress={() => setIsOpen(false)}
                >
                  <Text className="text-white font-medium">Done</Text>
                </TouchableOpacity>
              </View>
              <ScrollView className="p-2">
                {options.map((option) => {
                  const isSelected = value.includes(option.value);
                  const isDisabled = !isSelected && maxSelections && value.length >= maxSelections;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      className={`flex-row items-center justify-between p-4 rounded-xl mb-1 ${
                        isSelected ? "bg-primary/10" : ""
                      } ${isDisabled ? "opacity-50" : ""}`}
                      onPress={() => toggleOption(option.value)}
                      disabled={isDisabled}
                    >
                      <Text
                        className={`text-base ${
                          isSelected ? "text-primary font-medium" : "text-slate-900"
                        }`}
                      >
                        {option.label}
                      </Text>
                      {isSelected && <Check color="#2563EB" size={20} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}





