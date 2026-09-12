import type { CSSProperties, ReactNode } from "react";

function Panel({
  children,
  style,
  className = "",
}: {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border p-5 ${className}`}
      style={{
        backgroundColor: "#FBF6EB",
        borderColor: "rgba(90,66,46,0.18)",
        ...style,
      }}>
      {children}
    </section>
  );
}

export default Panel;
