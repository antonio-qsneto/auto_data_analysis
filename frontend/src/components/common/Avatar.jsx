import React from "react";

export default function Avatar({ name, imageUrl, size = 40 }) {
  const getInitials = (fullName) => {
    if (!fullName) return "?";
    const names = fullName.trim().split(" ");
    if (names.length === 1) return names[0][0].toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };

  return imageUrl ? (
    <img
      src={imageUrl}
      alt={name}
      className={`w-${size} h-${size} rounded-full object-cover`}
    />
  ) : (
    <div
      className={`w-${size} h-${size} rounded-full bg-gray-400 flex items-center justify-center text-white font-semibold`}
      style={{ width: size, height: size }}
    >
      {getInitials(name)}
    </div>
  );
}
