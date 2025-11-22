import React from "react";

export default function HeroVideo() {
  return (
    <section className="w-full py-8 bg-gradient-to-b from-blue-50 via-white to-blue-50">
      
      <div className="w-full flex flex-col items-center justify-center px-6 md:px-12">

        <div className="
          w-full 
          grid 
          grid-cols-1 
          xl:grid-cols-[1.6fr_0.8fr] 
          gap-24 
          items-center 
          max-w-[1800px]
        ">

          <div className="flex justify-center xl:justify-end w-full pr-0 xl:pr-10">
            <div
              className="
                w-full
                rounded-[40px]
                overflow-hidden
                shadow-[0_25px_80px_-20px_rgba(0,0,0,0.25)]
                border border-white/70
                backdrop-blur-xl
                bg-white/40
                transition-all
                hover:shadow-[0_35px_100px_-10px_rgba(0,0,0,0.30)]
              "
              style={{
                maxWidth: "800px",
              }}
            >
              <video
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                className="w-full h-auto"
              >
                <source src="/videos/preview.webm" type="video/webm" />
                <source src="/videos/preview.mp4" type="video/mp4" />
              </video>
            </div>
          </div>

          <div className="space-y-4 text-center xl:text-left max-w-[260px] mx-auto xl:mx-0">

            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 leading-snug">
              Conversational Data Intelligence.
            </h2>

            <p className="text-gray-700 text-sm leading-relaxed">
              Ask natural questions about your dataset and get instant insights powered by AI.
            </p>

            <p className="text-gray-600 text-sm leading-relaxed">
              Xclarity understands your columns, categories and patterns — and responds instantly.
            </p>

          </div>

        </div>

      </div>

    </section>
  );
}
