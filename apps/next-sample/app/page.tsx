import { renderCamo } from "../lib/camo-ssr";
import { spikePage } from "../lib/page";

export const dynamic = "force-dynamic";

export default async function Page() {
  const html = await renderCamo(spikePage());
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
