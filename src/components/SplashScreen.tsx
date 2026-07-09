'use client'
export default function SplashScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center animate-fade-in-up">
      <img src="/logo/splash.png" alt="Stradeo" className="w-[120px] h-[120px] rounded-full mb-5" />
      <h1 className="text-4xl font-extrabold tracking-tight text-center mb-2">Stradeo</h1>
      <p className="text-sm text-gray-500 text-center">Your Italian driving license companion</p>
      <div className="flex justify-center mt-8">
        <div className="w-10 h-1 rounded bg-white/[0.08] overflow-hidden">
          <div className="w-full h-full bg-gradient-to-r from-stradeo-accent to-stradeo-accent2 animate-[loading_2s_ease-in-out]" />
        </div>
      </div>
      <style>{`@keyframes loading{from{transform:translateX(-100%)}to{transform:translateX(0)}}`}</style>
    </div>
  )
}
