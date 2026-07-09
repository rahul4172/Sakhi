export default function Aurora({ color1 = '#C17767', color2 = '#E8A33D', children }) {
  return (
    <div className="relative w-full overflow-hidden">
      <div 
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 0% 0%, ${color1} 0%, transparent 50%), radial-gradient(circle at 100% 100%, ${color2} 0%, transparent 50%)`,
          filter: 'blur(60px)'
        }}
      />
      <div className="relative z-10 w-full">
        {children}
      </div>
    </div>
  );
}
