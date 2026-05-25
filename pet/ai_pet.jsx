export default function AIPetPrototype() {
  return (
    <div className="w-full h-screen bg-[#f5f7fb] flex items-center justify-center p-6">
      <div className="w-[390px] h-[844px] rounded-[40px] overflow-hidden shadow-2xl bg-white border border-gray-200 flex flex-col relative">

        {/* Top Pet Area */}
        <div className="relative flex-1 bg-gradient-to-b from-[#eef4ff] to-[#f8fbff] overflow-hidden">

          {/* Ambient Background */}
          <div className="absolute inset-0 opacity-60">
            <div className="absolute top-10 left-8 w-20 h-20 bg-white/50 rounded-full blur-2xl" />
            <div className="absolute bottom-24 right-6 w-32 h-32 bg-blue-100 rounded-full blur-3xl" />
          </div>

          {/* Status Bar */}
          <div className="relative z-10 flex items-center justify-between px-6 pt-6 text-sm text-gray-500">
            <div>22:41</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Online
            </div>
          </div>

          {/* Room */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pb-10">

            {/* Emotion Bubble */}
            <div className="mb-6 px-4 py-2 bg-white/80 backdrop-blur-md rounded-full text-sm text-gray-700 shadow-sm">
              今天辛苦啦，我在陪你。
            </div>

            {/* Pet Character */}
            <div className="relative">

              {/* Shadow */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-40 h-8 bg-black/10 blur-xl rounded-full" />

              {/* Body */}
              <div className="w-44 h-44 rounded-full bg-gradient-to-b from-[#ffe8c7] to-[#ffd69a] flex items-center justify-center relative animate-bounce">

                {/* Ears */}
                <div className="absolute -top-4 left-6 w-10 h-16 bg-[#ffd69a] rounded-full rotate-[-20deg]" />
                <div className="absolute -top-4 right-6 w-10 h-16 bg-[#ffd69a] rounded-full rotate-[20deg]" />

                {/* Face */}
                <div className="relative flex flex-col items-center">
                  <div className="flex gap-8 mb-4">
                    <div className="w-3 h-5 bg-black rounded-full" />
                    <div className="w-3 h-5 bg-black rounded-full" />
                  </div>

                  <div className="w-5 h-2 bg-[#d47a55] rounded-full" />

                  {/* Blush */}
                  <div className="absolute left-[-28px] top-8 w-5 h-3 bg-pink-200 rounded-full blur-sm" />
                  <div className="absolute right-[-28px] top-8 w-5 h-3 bg-pink-200 rounded-full blur-sm" />
                </div>
              </div>
            </div>

            {/* Interactive Props */}
            <div className="absolute bottom-10 right-10 w-14 h-14 rounded-2xl bg-white/70 backdrop-blur-md flex items-center justify-center shadow-md text-2xl">
              ☕
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="h-[320px] bg-white border-t border-gray-100 flex flex-col">

          {/* Tabs */}
          <div className="flex items-center gap-3 px-5 pt-4 pb-2 overflow-x-auto">
            <div className="px-4 py-2 rounded-full bg-black text-white text-sm whitespace-nowrap">
              对话
            </div>
            <div className="px-4 py-2 rounded-full bg-gray-100 text-gray-600 text-sm whitespace-nowrap">
              情绪状态
            </div>
            <div className="px-4 py-2 rounded-full bg-gray-100 text-gray-600 text-sm whitespace-nowrap">
              今日记忆
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

            <div className="flex justify-end">
              <div className="max-w-[75%] bg-[#2b6fff] text-white px-4 py-3 rounded-3xl rounded-br-md text-sm leading-relaxed shadow-sm">
                今天工作有点累。
              </div>
            </div>

            <div className="flex items-end gap-2">
              <div className="w-8 h-8 rounded-full bg-[#ffe0b2] flex items-center justify-center text-sm">
                🐶
              </div>

              <div className="max-w-[75%] bg-gray-100 px-4 py-3 rounded-3xl rounded-bl-md text-sm text-gray-700 leading-relaxed">
                我给你准备了热饮，休息一下吧。
              </div>
            </div>

            {/* System Emotion Feedback */}
            <div className="flex justify-center">
              <div className="px-3 py-1.5 rounded-full bg-orange-50 text-orange-500 text-xs border border-orange-100">
                宠物情绪：担心你 · 亲密度 +2
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-100 bg-white">
            <div className="flex items-center gap-3 bg-[#f5f7fb] rounded-2xl px-4 py-3">
              <button className="text-xl text-gray-400">＋</button>

              <input
                className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-400"
                placeholder="和它说点什么…"
              />

              <button className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shadow-md">
                ↑
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
