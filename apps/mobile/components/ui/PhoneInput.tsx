import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  SafeAreaView,
} from "react-native";
import { Search, ChevronDown, X } from "lucide-react-native";

// Comprehensive list of country codes
const COUNTRY_CODES = [
  { code: "+1", country: "USA", flag: "🇺🇸" },
  { code: "+1", country: "Canada", flag: "🇨🇦" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+61", country: "Australia", flag: "🇦🇺" },
  { code: "+49", country: "Germany", flag: "🇩🇪" },
  { code: "+33", country: "France", flag: "🇫🇷" },
  { code: "+81", country: "Japan", flag: "🇯🇵" },
  { code: "+86", country: "China", flag: "🇨🇳" },
  { code: "+55", country: "Brazil", flag: "🇧🇷" },
  { code: "+52", country: "Mexico", flag: "🇲🇽" },
  { code: "+39", country: "Italy", flag: "🇮🇹" },
  { code: "+34", country: "Spain", flag: "🇪🇸" },
  { code: "+82", country: "South Korea", flag: "🇰🇷" },
  { code: "+31", country: "Netherlands", flag: "🇳🇱" },
  { code: "+46", country: "Sweden", flag: "🇸🇪" },
  { code: "+41", country: "Switzerland", flag: "🇨🇭" },
  { code: "+65", country: "Singapore", flag: "🇸🇬" },
  { code: "+971", country: "UAE", flag: "🇦🇪" },
  { code: "+966", country: "Saudi Arabia", flag: "🇸🇦" },
  { code: "+27", country: "South Africa", flag: "🇿🇦" },
  { code: "+62", country: "Indonesia", flag: "🇮🇩" },
  { code: "+60", country: "Malaysia", flag: "🇲🇾" },
  { code: "+63", country: "Philippines", flag: "🇵🇭" },
  { code: "+66", country: "Thailand", flag: "🇹🇭" },
  { code: "+84", country: "Vietnam", flag: "🇻🇳" },
  { code: "+92", country: "Pakistan", flag: "🇵🇰" },
  { code: "+880", country: "Bangladesh", flag: "🇧🇩" },
  { code: "+234", country: "Nigeria", flag: "🇳🇬" },
  { code: "+20", country: "Egypt", flag: "🇪🇬" },
  { code: "+254", country: "Kenya", flag: "🇰🇪" },
  { code: "+90", country: "Turkey", flag: "🇹🇷" },
  { code: "+48", country: "Poland", flag: "🇵🇱" },
  { code: "+380", country: "Ukraine", flag: "🇺🇦" },
  { code: "+7", country: "Russia", flag: "🇷🇺" },
  { code: "+54", country: "Argentina", flag: "🇦🇷" },
  { code: "+56", country: "Chile", flag: "🇨🇱" },
  { code: "+57", country: "Colombia", flag: "🇨🇴" },
  { code: "+51", country: "Peru", flag: "🇵🇪" },
  { code: "+353", country: "Ireland", flag: "🇮🇪" },
  { code: "+47", country: "Norway", flag: "🇳🇴" },
  { code: "+45", country: "Denmark", flag: "🇩🇰" },
  { code: "+358", country: "Finland", flag: "🇫🇮" },
  { code: "+43", country: "Austria", flag: "🇦🇹" },
  { code: "+32", country: "Belgium", flag: "🇧🇪" },
  { code: "+351", country: "Portugal", flag: "🇵🇹" },
  { code: "+30", country: "Greece", flag: "🇬🇷" },
  { code: "+972", country: "Israel", flag: "🇮🇱" },
  { code: "+64", country: "New Zealand", flag: "🇳🇿" },
];

interface PhoneInputProps {
  label?: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  placeholder?: string;
}

export function PhoneInput({
  label,
  value,
  onChangeText,
  error,
  placeholder = "1234567890",
}: PhoneInputProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [phoneNumber, setPhoneNumber] = useState("");

  // Parse initial value
  useEffect(() => {
    if (value) {
      const sortedCodes = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
      for (const cc of sortedCodes) {
        if (value.startsWith(cc.code)) {
          setSelectedCountry(cc);
          setPhoneNumber(value.slice(cc.code.length).replace(/\D/g, ""));
          return;
        }
      }
      setPhoneNumber(value.replace(/\D/g, ""));
    }
  }, []);

  const handlePhoneChange = (text: string) => {
    const cleaned = text.replace(/\D/g, "").slice(0, 10);
    setPhoneNumber(cleaned);
    if (cleaned) {
      onChangeText(`${selectedCountry.code}${cleaned}`);
    } else {
      onChangeText("");
    }
  };

  const handleCountrySelect = (country: typeof COUNTRY_CODES[0]) => {
    setSelectedCountry(country);
    setModalVisible(false);
    if (phoneNumber) {
      onChangeText(`${country.code}${phoneNumber}`);
    }
  };

  const filteredCountries = COUNTRY_CODES.filter(
    (c) =>
      c.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.includes(searchQuery)
  );

  const isValidLength = phoneNumber.length === 10 || phoneNumber.length === 0;

  return (
    <View className="mb-4">
      {label && (
        <Text className="text-sm font-medium text-slate-700 mb-2">{label}</Text>
      )}
      
      <View className="flex-row">
        {/* Country Code Selector */}
        <TouchableOpacity
          className={`flex-row items-center px-3 py-3 rounded-l-xl border bg-white ${
            error ? "border-red-500" : "border-slate-200"
          }`}
          onPress={() => setModalVisible(true)}
        >
          <Text className="text-lg mr-1">{selectedCountry.flag}</Text>
          <Text className="text-slate-800 font-medium">{selectedCountry.code}</Text>
          <ChevronDown color="#64748B" size={16} />
        </TouchableOpacity>

        {/* Phone Number Input */}
        <View className="flex-1 relative">
          <TextInput
            className={`flex-1 px-4 py-3 rounded-r-xl border-t border-r border-b bg-white text-slate-800 ${
              error || (!isValidLength && phoneNumber.length > 0)
                ? "border-red-500"
                : "border-slate-200"
            }`}
            value={phoneNumber}
            onChangeText={handlePhoneChange}
            placeholder={placeholder}
            placeholderTextColor="#94A3B8"
            keyboardType="phone-pad"
            maxLength={10}
          />
          {phoneNumber.length > 0 && (
            <Text
              className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${
                phoneNumber.length === 10 ? "text-green-600" : "text-slate-400"
              }`}
            >
              {phoneNumber.length}/10
            </Text>
          )}
        </View>
      </View>

      {error && <Text className="text-red-500 text-sm mt-1">{error}</Text>}
      {!isValidLength && phoneNumber.length > 0 && !error && (
        <Text className="text-amber-600 text-sm mt-1">Phone number must be 10 digits</Text>
      )}

      {/* Country Selector Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row items-center justify-between p-4 border-b border-slate-200">
            <Text className="text-lg font-semibold text-slate-900">Select Country</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <X color="#64748B" size={24} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View className="p-4">
            <View className="flex-row items-center bg-slate-100 rounded-xl px-4 py-2">
              <Search color="#64748B" size={20} />
              <TextInput
                className="flex-1 ml-2 text-slate-800"
                placeholder="Search country..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          {/* Country List */}
          <FlatList
            data={filteredCountries}
            keyExtractor={(item, index) => `${item.code}-${item.country}-${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                className="flex-row items-center px-4 py-3 border-b border-slate-100"
                onPress={() => handleCountrySelect(item)}
              >
                <Text className="text-2xl mr-3">{item.flag}</Text>
                <Text className="flex-1 text-slate-800">{item.country}</Text>
                <Text className="text-slate-600 font-mono">{item.code}</Text>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

// Validation helper
export function isValidPhoneNumber(phone: string): boolean {
  if (!phone) return false;
  const sortedCodes = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
  for (const cc of sortedCodes) {
    if (phone.startsWith(cc.code)) {
      const number = phone.slice(cc.code.length).replace(/\D/g, "");
      return number.length === 10;
    }
  }
  return false;
}







