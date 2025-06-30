
const AnimatedWave = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg
        className="absolute bottom-0 left-0 w-full h-32 text-purple-500/20"
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
      >
        <path
          d="M0,60 C150,120 350,0 600,60 C850,120 1050,0 1200,60 L1200,120 L0,120 Z"
          fill="currentColor"
          className="animate-pulse"
        />
      </svg>
      <svg
        className="absolute bottom-0 left-0 w-full h-24 text-pink-500/10"
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        style={{ animationDelay: '1s' }}
      >
        <path
          d="M0,80 C200,120 400,40 600,80 C800,120 1000,40 1200,80 L1200,120 L0,120 Z"
          fill="currentColor"
          className="animate-pulse"
        />
      </svg>
    </div>
  );
};

export default AnimatedWave;
