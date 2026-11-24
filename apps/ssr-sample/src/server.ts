// First: it installs the server DOM shim and defines the elements, which must happen before `lit` loads anywhere else.
import { render } from "./render.ts";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dialogPage, feedbackPage, inputsPage, spikePage, structurePage } from "./page.ts";
import { documentShell } from "./document.ts";

const port = Number(process.env["PORT"] ?? 4173);
const clientFile = fileURLToPath(new URL("./client.js", import.meta.url));

createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://localhost:${port}`);
  if (url.pathname === "/client.js") {
    try {
      response.writeHead(200, { "content-type": "text/javascript" });
      response.end(await readFile(clientFile));
    } catch {
      response.writeHead(404).end("Run `pnpm build` first.");
    }
    return;
  }
  // `?nojs` leaves the script out: the page must look right without it.
  const script = !url.searchParams.has("nojs");
  let title = "Camouflage spike";
  let page;
  if (url.pathname === "/") page = spikePage();
  else if (url.pathname === "/feedback") {
    title = "Camouflage feedback and navigation";
    page = feedbackPage(
      url.searchParams.get("skin") ?? "minimal",
      url.searchParams.get("scheme") ?? "light",
    );
  } else if (url.pathname === "/structure") {
    title = "Camouflage structure";
    page = structurePage(
      url.searchParams.get("skin") ?? "minimal",
      url.searchParams.get("scheme") ?? "light",
    );
  } else if (url.pathname === "/inputs") {
    title = "Camouflage inputs";
    page = inputsPage(
      url.searchParams.get("skin") ?? "minimal",
      url.searchParams.get("scheme") ?? "light",
    );
  } else if (url.pathname === "/dialog") {
    title = "Camouflage dialog";
    page = dialogPage(
      url.searchParams.get("skin") ?? "minimal",
      url.searchParams.get("scheme") ?? "light",
    );
  } else {
    response.writeHead(404).end("Not found");
    return;
  }
  const shell = documentShell(title, script);
  response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  response.write(shell.head);
  // Streamed: the server rendering is an iterable of chunks.
  for (const chunk of render(page)) response.write(chunk);
  response.end(shell.tail);
}).listen(port, () => {
  console.warn(
    `Camouflage SSR sample on http://localhost:${port} (also /dialog?skin=cupertino&scheme=dark, add &nojs)`,
  );
});
