(function (root) {
  const cache = new Map();

  function decodeXml(value) {
    return String(value).replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, ent) => {
      if (ent === "amp") return "&";
      if (ent === "lt") return "<";
      if (ent === "gt") return ">";
      if (ent === "quot") return '"';
      if (ent === "apos") return "'";
      if (ent[0] !== "#") return match;
      const code = ent[1] === "x" || ent[1] === "X" ? parseInt(ent.slice(2), 16) : parseInt(ent.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    });
  }

  function colIndex(letters) {
    let n = 0;
    for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
    return n - 1;
  }

  async function inflate(bytes) {
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  async function unzip(buf) {
    const view = new DataView(buf);
    const bytes = new Uint8Array(buf);
    const files = {};
    let off = 0;
    while (off + 30 <= bytes.length) {
      if (view.getUint32(off, true) !== 0x04034b50) break;
      const method = view.getUint16(off + 8, true);
      const comp = view.getUint32(off + 18, true);
      const nameLen = view.getUint16(off + 26, true);
      const extraLen = view.getUint16(off + 28, true);
      const name = new TextDecoder().decode(bytes.subarray(off + 30, off + 30 + nameLen));
      const start = off + 30 + nameLen + extraLen;
      const raw = bytes.subarray(start, start + comp);
      if (!name.endsWith("/")) {
        if (method === 0) files[name] = raw;
        else if (method === 8) files[name] = await inflate(raw);
      }
      off = start + comp;
    }
    return files;
  }

  function sharedStrings(xml) {
    return [...xml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map((match) =>
      decodeXml([...match[1].matchAll(/<t\b[^>]*>([^<]*)<\/t>/g)].map((part) => part[1]).join(""))
    );
  }

  function cellText(attrs, inner, strings) {
    if (!inner) return "";
    if (attrs.includes('t="s"')) {
      const value = inner.match(/<v>(\d+)<\/v>/);
      return value ? strings[Number(value[1])] || "" : "";
    }
    if (attrs.includes('t="inlineStr"')) {
      return decodeXml([...inner.matchAll(/<t\b[^>]*>([^<]*)<\/t>/g)].map((part) => part[1]).join(""));
    }
    const value = inner.match(/<v>([^<]*)<\/v>/);
    return value ? decodeXml(value[1]) : "";
  }

  function rowsFromSheet(xml, strings) {
    const rows = [];
    for (const row of xml.split("<row ").slice(1)) {
      const cells = [];
      for (const cell of row.matchAll(/<c\b[^>]*\br="([A-Z]+)\d+"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        cells[colIndex(cell[1])] = cellText(cell[2], cell[3], strings);
      }
      rows.push(cells);
    }
    return rows;
  }

  function block(rows, code, epN) {
    const wanted = String(code).trim();
    const start = rows.findIndex((row) => String(row[0] || "").trim() === wanted);
    if (start < 0) return null;
    let end = start + 1;
    while (end < rows.length && String(rows[end][0] || "").trim() !== "STANDARD") end += 1;
    let width = 1;
    rows.forEach((row) => {
      if (row.length > width) width = row.length;
    });
    let epCol = -1;
    let headerAt = -1;
    for (let i = start; i < end; i += 1) {
      for (let c = 0; c < rows[i].length; c += 1) {
        if (String(rows[i][c] || "").trim() === "Elements of Performance") {
          epCol = c;
          headerAt = i;
          break;
        }
      }
      if (headerAt >= 0) break;
    }
    const token = String(epN).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const lead = new RegExp("^\\s*" + token + "(?:\\s|\\.|$)");
    let hit = -1;
    if (epCol >= 0) {
      for (let i = headerAt + 1; i < end; i += 1) {
        if (lead.test(String(rows[i][epCol] || ""))) {
          hit = i;
          break;
        }
      }
    }
    return { rows, width, headerAt, epCol, hit };
  }

  async function load(url) {
    if (cache.has(url)) return cache.get(url);
    const pending = (async () => {
      const response = await fetch(url);
      if (!response.ok) throw new Error("missing");
      const files = await unzip(await response.arrayBuffer());
      const sheet = files["xl/worksheets/sheet1.xml"];
      if (!sheet) throw new Error("nosheet");
      const strings = files["xl/sharedStrings.xml"]
        ? sharedStrings(new TextDecoder().decode(files["xl/sharedStrings.xml"]))
        : [];
      return rowsFromSheet(new TextDecoder().decode(sheet), strings);
    })();
    cache.set(url, pending);
    try {
      return await pending;
    } catch (err) {
      cache.delete(url);
      throw err;
    }
  }

  root.WorkbookSheet = { load, block };
})(typeof window !== "undefined" ? window : globalThis);
