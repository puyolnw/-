import React, { useState, useEffect } from 'react';
import { schoolSystemApiService } from '../../services/schoolSystemApi';
import type { AcademicYear } from '../../types/school-system';

interface AcademicYearSelectorProps {
  selectedYear?: AcademicYear | null;
  onYearChange: (year: AcademicYear | null) => void;
  showAll?: boolean; // แสดงตัวเลือก "ทั้งหมด" หรือไม่
  className?: string;
}

const AcademicYearSelector: React.FC<AcademicYearSelectorProps> = ({
  selectedYear,
  onYearChange,
  showAll = false,
  className = ''
}) => {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  const fetchAcademicYears = async () => {
    try {
      const response = await schoolSystemApiService.getAllAcademicYears();
      console.log('Academic Years API Response:', response);
      if (response.success && response.data) {
        console.log('Academic Years Data:', response.data.academicYears);
        setAcademicYears(response.data.academicYears);
        
        // ถ้ายังไม่ได้เลือก ให้เลือก active year อัตโนมัติ
        if (!selectedYear) {
          const activeYear = response.data.academicYears.find(year => year.is_active);
          if (activeYear) {
            onYearChange(activeYear);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching academic years:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const yearId = e.target.value;
    console.log('Year Selection Changed:', {
      selectedValue: yearId,
      selectedText: e.target.options[e.target.selectedIndex]?.text
    });
    
    if (yearId === 'all') {
      onYearChange(null);
    } else {
      const year = academicYears.find(y => y.id.toString() === yearId);
      console.log('Selected Year Object:', year);
      onYearChange(year || null);
    }
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-10 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        ปีการศึกษา
      </label>
      <select
        value={selectedYear?.id || 'all'}
        onChange={handleYearChange}
        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
      >
        {showAll && <option value="all">ทุกปีการศึกษา</option>}
        {academicYears.map((year) => {
          const displayText = `${year.year}/${year.semester}${year.is_active ? ' (ปัจจุบัน)' : ''}`;
          console.log('Academic Year Display:', {
            id: year.id,
            year: year.year,
            semester: year.semester,
            is_active: year.is_active,
            displayText: displayText
          });
          return (
            <option key={year.id} value={year.id}>
              {displayText}
            </option>
          );
        })}
      </select>
      
      {selectedYear && (
        <p className="text-xs text-gray-500 mt-1">
          {new Date(selectedYear.start_date).toLocaleDateString('th-TH')} - {new Date(selectedYear.end_date).toLocaleDateString('th-TH')}
        </p>
      )}
    </div>
  );
};

export default AcademicYearSelector;

