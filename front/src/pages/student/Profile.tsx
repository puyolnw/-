import React, { useState } from 'react';
import LoggedLayout from '../../components/layouts/LoggedLayout';
import ProfileView from '../../components/profile/ProfileView';
import ProfileEdit from '../../components/profile/ProfileEdit';

const StudentProfile: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <LoggedLayout currentPage="ข้อมูลส่วนตัว">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Action Buttons */}
        {!isEditing && (
          <div className="flex justify-end">
            <button
              onClick={handleEdit}
              className="flex items-center px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              แก้ไขข้อมูล
            </button>
          </div>
        )}

        {/* Profile Content */}
        {isEditing ? (
          <ProfileEdit onSave={handleSave} onCancel={handleCancel} />
        ) : (
          <ProfileView />
        )}
      </div>
    </LoggedLayout>
  );
};

export default StudentProfile;
