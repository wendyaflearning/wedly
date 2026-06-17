export default function Loading() {
  return (
    <div className="fixed inset-0 bg-creme flex items-center justify-center">
      <img
        src="/logo_dark.png"
        alt="Wedly"
        className="loader-logo"
        style={{ height: '72px', width: 'auto' }}
      />
    </div>
  );
}
