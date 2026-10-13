export default async function CustomerProfilePage({
  params,
}: {
  params: Promise<{ phone: string }>;
}) {
  const { phone } = await params;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold text-amber-400">
        Customer Profile
      </h1>

      <div className="rounded-xl border border-amber-500/20 bg-[#1a1714] p-6">
        <p className="text-amber-200">
          Phone: {decodeURIComponent(phone)}
        </p>
      </div>
    </div>
  );
}
