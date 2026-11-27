import Link from "next/link";
import { t } from "@/lib/i18n";

export default function NotFound() {
  return (
    <div className="container-page py-20">
      <p className="eyebrow">404</p>
      <h1 className="mt-2 text-4xl">{t("common.notFound")}</h1>
      <p className="mt-3 max-w-xl text-ink-soft">{t("common.notFoundBody")}</p>
      <div className="mt-6 flex gap-3">
        <Link href="/" className="btn-primary">{t("common.home")}</Link>
        <Link href="/search" className="btn">{t("nav.search")}</Link>
      </div>
    </div>
  );
}
