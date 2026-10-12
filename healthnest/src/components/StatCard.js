// A headline number with an icon, for the admin dashboard. tone: default (indigo), ok, warn, bad.
export default function StatCard({ icon: Icon, label, value, tone = "default" }) {
  return (
    <div className="stat">
      <div className="stat-top">
        <small>{label}</small>
        <span className={`stat-icon ${tone === "default" ? "" : tone}`}><Icon aria-hidden="true" strokeWidth={1.75} /></span>
      </div>
      <div className="n">{value}</div>
    </div>
  );
}
