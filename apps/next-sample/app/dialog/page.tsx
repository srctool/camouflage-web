import { renderCamo } from "../../lib/camo-ssr";
import { dialogPage } from "../../lib/page";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ skin?: string; scheme?: string }>;
}) {
  const { skin = "minimal", scheme = "light" } = await searchParams;
  const html = await renderCamo(dialogPage(skin, scheme));
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
