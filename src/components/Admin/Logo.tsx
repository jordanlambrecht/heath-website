import React from 'react'
import Image from 'next/image'
import LogoImg from './logo.webp'
export default function Logo() {
  return (
    <div className="flex justify-center items-center w-full h-16 bg-white dark:bg-gray-900">
      <Image src={LogoImg} alt="Heath Johnston Logo" />
    </div>
  )
}
