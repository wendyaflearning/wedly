import PhotoPlaceholder from "./PhotoPlaceholder";

export default function StorySection() {
  return (
    <section className="bg-bordeaux flex flex-col md:flex-row">
      <div className="px-6 md:px-[120px] py-14 md:py-20 md:flex-none md:w-[45%] flex md:items-center">
        <div>
          <p
            className="text-creme mb-5 md:mb-7"
            style={{
              fontFamily: "var(--font-cormorant-var)",
              fontStyle: "italic",
              fontWeight: 300,
              fontSize: "clamp(1.55rem, 2.6vw, 2.125rem)",
              lineHeight: 1.4,
              letterSpacing: "-0.01em",
            }}
          >
            Wedly n&apos;est pas né d&apos;une idée. Il est né d&apos;un tableur que ma sœur a dû inventer
            elle-même.
          </p>
          <p
            className="text-creme/75 max-w-[420px]"
            style={{ fontFamily: "var(--font-manrope-var)", fontWeight: 400, fontSize: "14px", lineHeight: 1.65 }}
          >
            Un mariage porte toujours une histoire, des racines, une sensibilité. On a voulu que la plateforme
            sache les entendre, sans jamais les réduire à une case.
          </p>
        </div>
      </div>

      <div className="md:flex-1">
        <PhotoPlaceholder label="Photo des fondatrices" variant="dark" className="w-full h-[420px] md:h-full" />
      </div>
    </section>
  );
}
