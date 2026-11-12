import { permanentRedirect } from "next/navigation";

/** The cartoon concept is now the home page; keep old links working. */
export default async function CartoonRedirect({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  permanentRedirect(`/${locale}`);
}
