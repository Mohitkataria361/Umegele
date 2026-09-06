"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/logo";

export default function Home() {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);

  const startChat = () => {
    if (!accepted) return;

    router.push("/chat");
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-6">
      <div className="w-full max-w-2xl text-center">
        
        {/* Logo */}
       <Logo/>

        {/* Main heading */}
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-6">
          Talk to someone new.
        </h1>

        <p className="text-zinc-400 text-lg sm:text-xl max-w-xl mx-auto leading-relaxed mb-10">
          Meet random people from around the world.
          <br />
          No profile. No followers. Just a conversation.
        </p>

        {/* Chat card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-7 sm:p-9 max-w-lg mx-auto shadow-2xl">
          
          <div className="flex items-start gap-4 text-left mb-7">
            <div className="text-2xl">
              
            </div>

            <div>
              <h2 className="font-semibold text-lg mb-1 flex items-center gap-2">
               <img src="/hat.svg" alt="Logo" className="w-15 h-15 invert text-zinc-800 mix-blend-screen" /> Anonymous chatting
              </h2>

              <p className="text-sm text-zinc-400 leading-relaxed">
                Your identity is not shared with the person you meet.
                You can leave a conversation whenever you want.
              </p>
            </div>
          </div>

          {/* Agreement */}
          <label className="flex items-start gap-3 text-left cursor-pointer mb-6">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-1 h-4 w-4 accent-white cursor-pointer"
            />

            <span className="text-sm text-zinc-400 leading-relaxed">
              I agree to use this service responsibly and follow the
              community guidelines.
            </span>
          </label>

          {/* Start button */}
          <button
            onClick={startChat}
            disabled={!accepted}
            className="w-full h-14 rounded-2xl bg-white text-zinc-950 font-semibold text-lg transition-all hover:bg-zinc-200 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Start Chat →
          </button>
        </div>

        {/* Footer */}
        <p className="text-xs text-zinc-600 mt-8">
          Be respectful. Don't share personal information.
        </p>
      </div>
    </main>
  );
}

