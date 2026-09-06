
// export default function ChatPage() {
//   return (
//     <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
//       <div className="text-center">
//         <div className="text-5xl mb-5">⏳</div>



//         <h1 className="text-3xl font-bold mb-3">
//           Finding someone...
//         </h1>

//         <p className="text-zinc-400">
//           Looking for a stranger to chat with.
//         </p>
//       </div>
//     </main>
//   );
// }



import ChatWindow from "@/components/ChatWindow";

export default function ChatPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center px-4 py-8">
      <ChatWindow />
    </main>
  );
}


