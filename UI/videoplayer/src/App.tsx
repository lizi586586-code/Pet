import { Plus, ArrowUp, Heart, Book, X, Calendar } from 'lucide-react';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Bubble {
  id: number;
  text: string;
}

export default function App() {
  const [inputValue, setInputValue] = useState('');
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [replyText, setReplyText] = useState('主人你好呀！今天想和我玩点什么呢？');
  const [showMemories, setShowMemories] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const sentText = inputValue.trim();

    const newBubble: Bubble = {
      id: Date.now(),
      text: sentText,
    };

    setBubbles((prev) => [...prev, newBubble]);
    setInputValue('');

    // Remove user bubble after animation completes
    setTimeout(() => {
      setBubbles((prev) => prev.filter((b) => b.id !== newBubble.id));
    }, 2000);

    // Simulate reply after a short delay
    setTimeout(() => {
      setReplyText(`你说了：“${sentText}”，这听起来很有趣！`);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-white to-blue-100 font-sans text-gray-800 antialiased">
      {/* Mobile App Container */}
      <div className="w-full max-w-[390px] h-[844px] bg-white/40 backdrop-blur-3xl rounded-[3rem] border border-white/50 shadow-2xl shadow-blue-200/50 relative overflow-hidden flex flex-col z-0">
        
        {/* Room Interior Background */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <img 
            src="https://images.unsplash.com/photo-1598928506311-c55dd1b48bfe?q=80&w=800&auto=format&fit=crop" 
            alt="Room Interior"
            className="w-full h-full object-cover"
          />
          {/* Color tint overlay to match UI (light blue pastel) */}
          <div className="absolute inset-0 bg-blue-300/20 mix-blend-multiply"></div>
          {/* Gradients to fade out the top and bottom to seamlessly blend with header/footer */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-50/90 via-transparent to-blue-50/90"></div>
          
          {/* Window Light Stream effect */}
          <div className="absolute top-[-10%] left-[-20%] w-[120%] h-[120%] bg-gradient-to-br from-white/40 via-transparent to-transparent rotate-[25deg] pointer-events-none mix-blend-overlay"></div>
        </div>

        {/* Background glow effects */}
        <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-64 h-64 bg-blue-300/30 blur-3xl rounded-full pointer-events-none z-0" />

        {/* Top Header */}
        <div className="w-full flex justify-between items-center px-8 pt-6 pb-2 z-10 relative">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold opacity-60">23:08</span>
            <button onClick={() => setShowMemories(true)} className="p-1.5 bg-white/50 backdrop-blur-md rounded-full shadow-sm border border-white/60 hover:bg-white/80 transition-colors tooltip relative group">
              <Book size={14} className="text-blue-600" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Online</span>
            <div className="flex gap-1">
              <div className="w-4 h-2 bg-blue-300 rounded-full" />
              <div className="w-2 h-2 bg-blue-200 rounded-full" />
            </div>
          </div>
        </div>

        {/* Status Tags */}
        <div className="flex justify-end flex-wrap gap-2 px-8 pt-4 z-10 relative">
          <div className="px-3 py-1.5 bg-white/60 backdrop-blur-md rounded-full border border-white/40 flex items-center gap-1.5 shadow-sm">
            <Heart size={14} className="text-pink-400 fill-pink-400" />
            <span className="text-[11px] font-bold tracking-wide text-pink-500">亲密度 128</span>
          </div>
          <div className="px-3 py-1.5 bg-white/60 backdrop-blur-md rounded-full border border-white/40 flex items-center gap-1.5 shadow-sm">
            <span className="text-blue-500 text-xs italic font-bold">zZz</span>
            <span className="text-[11px] font-bold tracking-wide text-blue-700">默认</span>
          </div>
          <div className="px-3 py-1.5 bg-white/60 backdrop-blur-md rounded-full border border-white/40 flex items-center gap-1.5 shadow-sm">
            <span className="text-sm -my-1">😊</span>
            <span className="text-[11px] font-bold tracking-wide text-orange-500">心情 81</span>
          </div>
        </div>

        {/* Center Pet Character & Floating Bubbles Area */}
        <div className="flex-1 flex flex-col justify-center items-center relative z-10 px-4">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={replyText}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="w-fit max-w-[340px] px-[20px] py-[12px] leading-[1.6] bg-white/80 backdrop-blur-md shadow-sm border border-white/60 rounded-[28px] text-blue-900 font-medium text-[15px] text-center break-words"
            >
              {replyText}
            </motion.div>
          </AnimatePresence>

          {/* Bubbles Container */}
          <div className="absolute bottom-[-20px] right-10 z-20 flex flex-col items-end pointer-events-none w-full px-8">
            <AnimatePresence>
              {bubbles.map((bubble) => (
                <motion.div
                  key={bubble.id}
                  initial={{ opacity: 0, y: 50, scale: 0.8 }}
                  animate={{ opacity: 1, y: -180, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 1.8, ease: "easeOut" }}
                  className="bg-white/90 backdrop-blur-md text-blue-700 text-sm font-medium px-4 py-2.5 rounded-2xl rounded-br-sm shadow-xl shadow-blue-200/50 mb-2 border border-white max-w-[80%] whitespace-normal break-words"
                >
                  {bubble.text}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Memories Drawer */}
        <AnimatePresence>
          {showMemories && (
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute inset-x-0 bottom-0 top-[35%] z-50 bg-white/80 backdrop-blur-2xl rounded-t-[3rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t border-white/60 flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex justify-between items-center px-8 pt-8 pb-4 border-b border-blue-900/5">
                <h2 className="text-xl font-bold text-blue-900">成长时光记</h2>
                <button 
                  onClick={() => setShowMemories(false)}
                  className="w-8 h-8 flex items-center justify-center bg-blue-100/50 rounded-full text-blue-600 hover:bg-blue-200/50 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Timeline Content */}
              <div className="flex-1 overflow-y-auto bg-[#FAFAFA] custom-scrollbar">
                
                {/* Photo Wall / Sticky Notes Area */}
                <div className="relative w-full h-[400px] mt-6 px-4">
                  
                  {/* Item 1: Pink Sticky Note */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20, rotate: -20 }}
                    animate={{ opacity: 1, y: 0, rotate: -6 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 100 }}
                    className="absolute top-[20px] left-[5%] w-[130px] bg-[#FCE4EC] p-3 shadow-md z-10 
                               hover:z-50 hover:scale-110 transition-transform cursor-pointer"
                  >
                    <div className="absolute -left-2 top-4 opacity-50">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F06292" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transform -rotate-45"><path d="M13.234 3.558a4.5 4.5 0 0 0-6.364 0l-3.328 3.328a4.5 4.5 0 0 0 0 6.364l9.192 9.192a4.5 4.5 0 0 0 6.364 0l3.328-3.328a4.5 4.5 0 0 0 0-6.364l-9.192-9.192z"></path><path d="m11.82 4.97 7.21 7.21"></path></svg>
                    </div>
                    <p className="text-[12px] text-gray-700 leading-relaxed font-medium min-h-[50px] mb-2 z-10">今天主人带我去了公园，草地好软，疯狂打滚真开心！</p>
                    <div className="text-[9px] text-gray-400 w-full mb-1">🐾 桃桃</div>
                    <div className="text-[9px] text-pink-300 font-mono mb-2">2023-05-20</div>
                    <div className="bg-white/80 px-2 py-1 flex items-center gap-1 overflow-hidden shadow-sm">
                      <span className="text-[9px] text-gray-500 whitespace-nowrap truncate">[日记] 阳光明媚的下午</span>
                      <img src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=400&auto=format&fit=crop" alt="park" className="w-4 h-4 object-cover rounded-[1px] ml-auto shrink-0" />
                    </div>
                  </motion.div>

                  {/* Item 2: Yellow Sticky Note */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20, rotate: 20 }}
                    animate={{ opacity: 1, y: 0, rotate: 4 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
                    className="absolute top-[10px] right-[28%] w-[140px] bg-[#FFF59D] p-4 shadow-lg z-20 
                               hover:z-50 hover:scale-110 transition-transform cursor-pointer"
                    onClick={() => setShowVideoModal(true)}
                  >
                    <p className="text-[12px] text-gray-800 font-bold leading-relaxed min-h-[60px] mb-4">只要我疯狂摇尾巴，主人就会给我吃肉干对吧！！！🤤</p>
                    <div className="flex flex-col">
                       <span className="text-[10px] text-yellow-600 mb-0.5">想吃零食的桃桃</span>
                       <span className="text-[9px] text-yellow-500 font-mono">08-15</span>
                    </div>
                  </motion.div>

                  {/* Item 3: Polaroid */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8, rotate: -15 }}
                    animate={{ opacity: 1, scale: 1, rotate: 8 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
                    className="absolute top-[5px] -right-[4%] w-[150px] bg-white p-2 pb-4 shadow-xl z-30 
                               hover:z-50 hover:scale-110 hover:rotate-0 transition-all cursor-pointer border border-gray-100"
                  >
                    <div className="absolute -left-2 bottom-12 opacity-80 z-20">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F5B041" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transform -rotate-[30deg]"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                    </div>
                    <div className="w-full h-[150px] bg-gray-200 overflow-hidden mb-3 relative z-10">
                       <img src="https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=400&auto=format&fit=crop" className="w-full h-full object-cover" alt="Corgi smile" />
                    </div>
                    <p className="text-[11px] font-bold text-gray-800 px-1 mb-1 relative z-10">第一次坐车兜风🚗~</p>
                    <div className="flex flex-col px-1 relative z-10">
                       <span className="text-[9px] text-gray-500 mb-0.5">桃桃的副驾</span>
                       <span className="text-[8px] text-gray-400 font-mono">10-01</span>
                    </div>
                  </motion.div>

                  {/* Item 4: Bottom Left Note */}
                   <motion.div 
                    initial={{ opacity: 0, y: 30, rotate: 10 }}
                    animate={{ opacity: 1, y: 0, rotate: -2 }}
                    transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
                    className="absolute top-[230px] left-[3%] w-[130px] bg-white p-3 shadow-md border border-gray-100 z-20 
                               hover:z-50 hover:scale-110 transition-transform cursor-pointer"
                  >
                    <p className="text-[12px] text-gray-600 leading-relaxed font-medium">主人今天好像有点难过，我就默默趴在她脚边陪着她。没关系的，桃桃会一直在这里保护你汪～🐶</p>
                  </motion.div>

                  {/* Item 5: Center Minimal Photo */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1, rotate: 2 }}
                    transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
                    className="absolute top-[210px] left-[36%] w-[140px] bg-white shadow-sm z-10 overflow-hidden
                               hover:z-50 hover:scale-110 transition-transform cursor-pointer"
                  >
                     <img src="https://images.unsplash.com/photo-1615751072497-5f5169febe17?q=80&w=400&auto=format&fit=crop" className="w-full h-[150px] object-cover" alt="Sleepy corgi" />
                  </motion.div>

                  {/* Item 6: Bottom Right Blue Note */}
                  <motion.div 
                    initial={{ opacity: 0, x: 20, rotate: -15 }}
                    animate={{ opacity: 1, x: 0, rotate: -4 }}
                    transition={{ delay: 0.6, type: "spring", stiffness: 100 }}
                    className="absolute top-[230px] -right-[2%] w-[130px] bg-[#E1F5FE] p-4 shadow-sm z-20 
                               hover:z-50 hover:scale-110 transition-transform cursor-pointer"
                  >
                    <p className="text-[12px] text-gray-700 leading-relaxed font-medium">要是再随地大小便<br/>我就是小狗汪！</p>
                  </motion.div>
                </div>

                {/* Bottom Spacer */}
                <div className="pb-12"></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Video Player Modal/Drawer */}
        <AnimatePresence>
          {showVideoModal && (
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute inset-x-0 bottom-0 top-[20%] z-[60] bg-black/95 backdrop-blur-3xl rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-gray-800 flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex justify-between items-center px-6 pt-6 pb-4 bg-gradient-to-b from-black/80 to-transparent">
                <div className="text-white">
                  <h3 className="font-bold text-lg">摇尾巴骗零食！🤤</h3>
                  <p className="text-xs text-gray-400 font-mono">08-15 | 桃桃</p>
                </div>
                <button 
                  onClick={() => setShowVideoModal(false)}
                  className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Video Content */}
              <div className="flex-1 flex flex-col items-center justify-center p-4">
                <div className="w-full relative rounded-2xl overflow-hidden bg-gray-900 shadow-2xl ring-1 ring-white/10">
                  <video 
                    className="w-full h-auto max-h-[500px]"
                    controls
                    autoPlay
                    playsInline
                    poster="https://images.unsplash.com/photo-1544568100-847a948585b9?q=80&w=600&auto=format&fit=crop"
                  >
                    {/* Using a sample open-source video as placeholder */}
                    <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" type="video/mp4" />
                    您的浏览器不支持视频播放。
                  </video>
                </div>
                
                <div className="mt-8 text-center text-gray-400 text-sm max-w-[80%]">
                  <p>"为了拿到那块香喷喷的肉干，我可是把尾巴摇出了直升机螺旋桨的速度哦！🚁"</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Action Area */}
        <div className="px-6 pb-6 z-10 w-full flex flex-col gap-6">
          
          {/* Action Cards */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { iconSrc: "/bottle.png", label: "喂养", iconBg: "bg-orange-100/50" },
              { iconSrc: "/soccer.png", label: "玩耍", iconBg: "bg-pink-100/50" },
              { iconSrc: "/sleep.png", label: "睡觉", iconBg: "bg-blue-100/50" },
            ].map((item, i) => (
              <button 
                key={i} 
                className="flex flex-col items-center justify-center gap-2 bg-white/80 backdrop-blur-md py-4 px-2 rounded-3xl border border-white/60 shadow-md shadow-blue-100/50 hover:bg-blue-50/50 transition-colors group"
              >
                <div className={`w-14 h-14 ${item.iconBg} rounded-2xl flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105`}>
                  <img src={item.iconSrc} alt={item.label} className="w-full h-full object-cover" />
                </div>
                <span className="text-[11px] font-bold text-gray-700 mt-1">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="relative flex items-center w-full">
            <button className="absolute left-3 w-10 h-10 flex items-center justify-center text-blue-400 hover:text-blue-600 transition-colors z-10">
              <Plus size={22} className="stroke-[2.5]" />
            </button>
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="和它说点什么..." 
              className="w-full h-14 bg-white/60 border border-white/80 rounded-2xl pl-12 pr-14 shadow-inner text-sm outline-none focus:ring-2 focus:ring-blue-300 transition-all placeholder:text-blue-400/70 text-blue-900 font-medium z-0"
            />
            <button 
              onClick={handleSend}
              className="absolute right-2 w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 hover:bg-blue-600 transition-colors z-10 group"
            >
              <ArrowUp size={20} className="stroke-[2.5] text-white transition-transform group-hover:-translate-y-0.5" />
            </button>
          </div>
        </div>

        {/* Screen Indicator Bar */}
        <div className="w-full flex justify-center pb-4 z-10">
          <div className="w-32 h-1.5 bg-blue-900/10 rounded-full"></div>
        </div>

      </div>
    </div>
  );
}
