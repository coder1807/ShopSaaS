import * as React from 'react';
const GoogleButton = () => {
  return (
    <div className="w-full flex justify-center">
      <div className="h-[46px] cursor-pointer border border-blue-100 flex items-center gap-2 px-3 rounded my-2 bg-[rgba(210,227,252,0.3)]">
        <svg
          width="30"
          height="30"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M15.001 8.155c0 -0.575 -0.048 -0.995 -0.15 -1.431H8.143v2.598h3.937c-0.08 0.645 -0.508 1.618 -1.46 2.271l-0.013 0.087 2.12 1.61 0.147 0.015c1.349 -1.222 2.127 -3.018 2.127 -5.149"
            fill="#4285F4"
          />
          <path
            d="M8.143 15c1.929 0 3.547 -0.623 4.73 -1.696l-2.253 -1.712c-0.604 0.412 -1.413 0.7 -2.477 0.7A4.29 4.29 0 0 1 4.08 9.385l-0.084 0.007 -2.205 1.672 -0.029 0.079C2.937 13.428 5.35 15 8.143 15"
            fill="#34A853"
          />
          <path
            d="M4.08 9.384A4.25 4.25 0 0 1 3.842 8c0 -0.482 0.087 -0.949 0.23 -1.385l-0.004 -0.092L1.835 4.824l-0.073 0.035A6.9 6.9 0 0 0 1 8c0 1.128 0.278 2.193 0.762 3.143z"
            fill="#FBBC05"
          />
          <path
            d="M8.143 3.707c1.341 0 2.246 0.568 2.762 1.042l2.016 -1.929C11.683 1.692 10.072 1 8.143 1 5.35 1 2.937 2.571 1.762 4.857l2.31 1.758c0.579 -1.688 2.183 -2.909 4.071 -2.909"
            fill="#EB4335"
          />
        </svg>
        <span className="text-[16px] opacity-[.8] font-medium font-Poppins">
          Sign In With Google
        </span>
      </div>
    </div>
  );
};
export default GoogleButton;
