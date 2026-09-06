"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="w-full bg-zinc-950 border-b border-zinc-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="text-sm sm:text-base flex items-center gap-2 font-medium text-zinc-300 hover:text-white transition-colors duration-200"
        > 
          <svg 
            xmlns="http://w3.org" 
            className="h-5 w-5 fill-white" 
            viewBox="0 -960 960 960"
          >
            <path d="M240-200h120v-240h240v240h120v-360L480-740 240-560v360Zm-80 80v-480l320-240 320 240v480H520v-240h-80v240H160Zm320-350Z"/>
          </svg>
          <span>Home</span>
        </Link>
      </div>
    </nav>
  );
}
