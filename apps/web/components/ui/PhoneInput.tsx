"use client";

import { useState, useEffect } from "react";

// Common country codes
const COUNTRY_CODES = [
  { code: "+1", country: "US/CA", flag: "🇺🇸" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
  { code: "+91", country: "IN", flag: "🇮🇳" },
  { code: "+61", country: "AU", flag: "🇦🇺" },
  { code: "+49", country: "DE", flag: "🇩🇪" },
  { code: "+33", country: "FR", flag: "🇫🇷" },
  { code: "+81", country: "JP", flag: "🇯🇵" },
  { code: "+86", country: "CN", flag: "🇨🇳" },
  { code: "+55", country: "BR", flag: "🇧🇷" },
  { code: "+52", country: "MX", flag: "🇲🇽" },
  { code: "+39", country: "IT", flag: "🇮🇹" },
  { code: "+34", country: "ES", flag: "🇪🇸" },
  { code: "+82", country: "KR", flag: "🇰🇷" },
  { code: "+31", country: "NL", flag: "🇳🇱" },
  { code: "+46", country: "SE", flag: "🇸🇪" },
  { code: "+41", country: "CH", flag: "🇨🇭" },
  { code: "+65", country: "SG", flag: "🇸🇬" },
  { code: "+971", country: "UAE", flag: "🇦🇪" },
  { code: "+966", country: "SA", flag: "🇸🇦" },
  { code: "+27", country: "ZA", flag: "🇿🇦" },
];

interface PhoneInputProps {
  value?: string;
  onChange: (value: string) => void;
  error?: boolean;
  placeholder?: string;
  className?: string;
}

export function PhoneInput({
  value = "",
  onChange,
  error = false,
  placeholder = "1234567890",
  className = "",
}: PhoneInputProps) {
  // Parse the initial value to extract country code and number
  const parsePhone = (phone: string) => {
    if (!phone) return { countryCode: "+1", number: "" };
    
    // Try to find matching country code
    for (const cc of COUNTRY_CODES) {
      if (phone.startsWith(cc.code)) {
        return {
          countryCode: cc.code,
          number: phone.slice(cc.code.length).replace(/\D/g, ""),
        };
      }
    }
    
    // Default to +1 and treat the rest as number
    return { countryCode: "+1", number: phone.replace(/\D/g, "") };
  };

  const parsed = parsePhone(value);
  const [countryCode, setCountryCode] = useState(parsed.countryCode);
  const [phoneNumber, setPhoneNumber] = useState(parsed.number);

  // Update parent when values change
  useEffect(() => {
    if (phoneNumber) {
      onChange(`${countryCode}${phoneNumber}`);
    } else {
      onChange("");
    }
  }, [countryCode, phoneNumber, onChange]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits, max 10 characters
    const cleaned = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhoneNumber(cleaned);
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <select
        value={countryCode}
        onChange={(e) => setCountryCode(e.target.value)}
        className={`w-28 px-3 py-3 rounded-xl border bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
          error ? "border-red-500" : "border-slate-200"
        }`}
      >
        {COUNTRY_CODES.map((cc) => (
          <option key={cc.code} value={cc.code}>
            {cc.flag} {cc.code}
          </option>
        ))}
      </select>
      <input
        type="tel"
        value={phoneNumber}
        onChange={handlePhoneChange}
        placeholder={placeholder}
        maxLength={10}
        className={`flex-1 px-4 py-3 rounded-xl border bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
          error ? "border-red-500" : "border-slate-200"
        }`}
      />
    </div>
  );
}

export default PhoneInput;

