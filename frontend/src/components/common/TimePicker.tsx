import React, { useState, useEffect } from 'react';

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
  error?: string;
}

const TimePicker: React.FC<TimePickerProps> = ({
  value,
  onChange,
  label,
  disabled = false,
  className = "",
  error
}) => {
  const [hours, setHours] = useState<string>('09');
  const [minutes, setMinutes] = useState<string>('00');

  // แปลงค่า value เป็น hours และ minutes
  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':');
      setHours(h || '09');
      setMinutes(m || '00');
    }
  }, [value]);

  // สร้างตัวเลือกชั่วโมง (00-23)
  const hourOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return (
      <option key={hour} value={hour}>
        {hour}
      </option>
    );
  });

  // สร้างตัวเลือกนาที (00, 15, 30, 45)
  const minuteOptions = [0, 15, 30, 45].map(minute => {
    const min = minute.toString().padStart(2, '0');
    return (
      <option key={min} value={min}>
        {min}
      </option>
    );
  });

  // อัปเดตค่าเมื่อมีการเปลี่ยนแปลง
  const handleTimeChange = (newHours: string, newMinutes: string) => {
    setHours(newHours);
    setMinutes(newMinutes);
    onChange(`${newHours}:${newMinutes}`);
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      
      <div className="flex items-center space-x-2">
        <select
          value={hours}
          onChange={(e) => handleTimeChange(e.target.value, minutes)}
          disabled={disabled}
          className={`
            px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            ${error ? 'border-red-500' : 'border-gray-300'}
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
          `}
        >
          {hourOptions}
        </select>
        
        <span className="text-gray-500 font-medium">:</span>
        
        <select
          value={minutes}
          onChange={(e) => handleTimeChange(hours, e.target.value)}
          disabled={disabled}
          className={`
            px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            ${error ? 'border-red-500' : 'border-gray-300'}
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
          `}
        >
          {minuteOptions}
        </select>
      </div>
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default TimePicker;
