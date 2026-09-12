function BinderDots({ count = 15 }: { count?: number }) {
  return (
    <div className='hidden md:flex flex-col items-center justify-between h-full py-2'>
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className='w-2.5 h-2.5 rounded-full'
          style={{ backgroundColor: "rgba(90,66,46,0.35)" }}
        />
      ))}
    </div>
  );
}

export default BinderDots;
