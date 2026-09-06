"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="w-full bg-zinc-950">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <Link
          href="/"
          className="text-sm flex gap-2 h-3 font-medium text-zinc-300 hover:text-white  transition"
        > <svg xmlns="http://www.w3.org/2000/svg" className="h-5 fill-zinc-300 hover:fill-white" viewBox="0 -960 960 960" ><path d="M240-200h120v-240h240v240h120v-360L480-740 240-560v360Zm-80 80v-480l320-240 320 240v480H520v-240h-80v240H160Zm320-350Z"/></svg>
          Home
        </Link>
      </div>
    </nav>
  );
}