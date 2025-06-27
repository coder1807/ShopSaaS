import React from 'react';

type ProfileIconProps = {
  width?: number | string;
  height?: number | string;
  fill?: string;
  className?: string;
};

const ProfileIcon: React.FC<ProfileIconProps> = ({
  width = 24,
  height = 24,
  fill = 'currentColor',
  className = '',
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
        fill={fill}
      />
      <path
        d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20V21H4V20Z"
        fill={fill}
      />
    </svg>
  );
};

export default ProfileIcon;
