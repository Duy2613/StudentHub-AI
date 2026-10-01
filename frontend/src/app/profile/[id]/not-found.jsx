import Link from "next/link";

export default function StudentPublicProfileUnavailable() {
  return <main className="unified-workspace mx-auto max-w-xl px-6 py-16">
    <h1 className="text-xl font-semibold">Hồ sơ công khai chưa khả dụng</h1>
    <p className="mt-3 text-sm text-slate-400">Hồ sơ sinh viên chỉ được xem bởi chủ tài khoản. Bạn có thể mở hồ sơ cá nhân hoặc tìm hồ sơ chuyên gia công khai.</p>
    <div className="mt-6 flex flex-wrap gap-4">
      <Link href="/profile" className="text-link">Hồ sơ cá nhân</Link>
      <Link href="/expert" className="text-link">Tìm chuyên gia</Link>
    </div>
  </main>;
}
