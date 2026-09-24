/* Reusable markdown-to-HTML for document modals.
   Include this script, then call renderMarkdown(source).
   Wrap the result in an element with class "md-body". */
(function (root) {
  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }

  function inline(s) {
    return escapeHtml(s)
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (match, label, href) => {
        if (/\.md(?:#.*)?$/.test(href)) {
          const file = href.split("#")[0];
          return '<a href="' + file + '" data-doc="' + file + '">' + label + "</a>";
        }
        if (/^https?:\/\//.test(href)) {
          return '<a href="' + href + '" target="_blank" rel="noopener noreferrer">' + label + "</a>";
        }
        return label;
      })
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/`([^`]+)`/g, "<code>$1</code>");
  }

  function isRule(line) {
    return /^(-{3,}|\*{3,}|_{3,})$/.test(line.trim());
  }

  function isSeparator(line) {
    return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line.trim());
  }

  function splitRow(line) {
    let raw = line.trim();
    if (raw.startsWith("|")) raw = raw.slice(1);
    if (raw.endsWith("|")) raw = raw.slice(0, -1);
    return raw.split("|").map(cell => cell.trim());
  }

  function renderTable(lines) {
    const rows = lines.map(splitRow);
    const sepAt = lines.findIndex(isSeparator);
    const head = rows[0] || [];
    const body = rows.filter((_, index) => index !== 0 && index !== sepAt);
    let html = '<div class="md-table"><table><thead><tr>';
    head.forEach(cell => { html += "<th>" + inline(cell) + "</th>"; });
    html += "</tr></thead><tbody>";
    body.forEach(row => {
      html += "<tr>";
      head.forEach((_, index) => { html += "<td>" + inline(row[index] || "") + "</td>"; });
      html += "</tr>";
    });
    html += "</tbody></table></div>";
    return html;
  }

  function renderMarkdown(md) {
    const lines = String(md).replace(/\r/g, "").split("\n");
    let html = "";
    let i = 0;
    let para = [];

    function flushPara() {
      if (!para.length) return;
      html += "<p>" + para.join(" ") + "</p>";
      para = [];
    }

    while (i < lines.length) {
      const line = lines[i];
      if (!line.trim()) {
        flushPara();
        i += 1;
        continue;
      }
      if (isRule(line)) {
        flushPara();
        html += "<hr>";
        i += 1;
        continue;
      }
      if (line.trim().startsWith("|") && i + 1 < lines.length && isSeparator(lines[i + 1])) {
        flushPara();
        const block = [];
        while (i < lines.length && lines[i].trim().startsWith("|")) {
          block.push(lines[i]);
          i += 1;
        }
        html += renderTable(block);
        continue;
      }
      const heading = line.match(/^(#{1,4})\s+(.*)/);
      if (heading) {
        flushPara();
        const tag = "h" + Math.min(heading[1].length + 1, 4);
        const id = heading[2].toLowerCase().replace(/[^a-z0-9]+/g, "-");
        html += "<" + tag + ' id="' + escapeHtml(id) + '">' + inline(heading[2]) + "</" + tag + ">";
        i += 1;
        continue;
      }
      const list = line.match(/^([-*]|\d+\.)\s+/);
      if (list) {
        flushPara();
        const ordered = /^\d+\./.test(list[1]);
        const tag = ordered ? "ol" : "ul";
        const item = ordered ? /^\d+\.\s+(.*)/ : /^[-*]\s+(.*)/;
        html += "<" + tag + ">";
        while (i < lines.length && item.test(lines[i])) {
          html += "<li>" + inline(lines[i].match(item)[1]) + "</li>";
          i += 1;
        }
        html += "</" + tag + ">";
        continue;
      }
      para.push(inline(line));
      i += 1;
    }
    flushPara();
    return html;
  }

  root.renderMarkdown = renderMarkdown;
})(window);
