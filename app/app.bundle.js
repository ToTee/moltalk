(() => {
  // src/core/dc.js
  var BASE = "https://gall.dcinside.com";
  var num = (s2) => Number(String(s2 ?? "").replace(/[^\d]/g, "")) || 0;
  var abs = (u) => !u ? "" : u.startsWith("//") ? "https:" + u : u.startsWith("/") ? BASE + u : u;
  var GTYPE = { normal: "G", minor: "M", mini: "MI" };
  function boardUrl(g, action) {
    if (!/^[A-Za-z0-9_]{1,80}$/.test(g.id || "")) throw Error("\uC62C\uBC14\uB978 \uAC24\uB7EC\uB9AC\uAC00 \uC544\uB2D9\uB2C8\uB2E4.");
    if (!GTYPE[g.type]) throw Error("\uC9C0\uC6D0\uD558\uC9C0 \uC54A\uB294 \uAC24\uB7EC\uB9AC \uC885\uB958\uC785\uB2C8\uB2E4.");
    return BASE + "/" + (g.type === "minor" ? "mgallery/" : g.type === "mini" ? "mini/" : "") + "board/" + action + "/?id=" + g.id;
  }
  function toBlocks(root) {
    const out = [];
    let buf = "";
    const flush = () => {
      const t = buf.replace(/[ \t\u00a0\u200b]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n").trim();
      if (t) out.push({ t: "text", v: t });
      buf = "";
    };
    const walk = (node) => {
      for (const c of node.childNodes) {
        if (c.nodeType === 3) {
          buf += c.textContent;
          continue;
        }
        if (c.nodeType !== 1) continue;
        const tag = c.tagName.toLowerCase();
        if (tag === "script" || tag === "style") continue;
        if (tag === "br") {
          buf += "\n";
          continue;
        }
        if (tag === "img") {
          const src = abs(c.getAttribute("data-original") || c.getAttribute("data-src") || c.getAttribute("src") || "");
          if (/^https:\/\//.test(src)) {
            flush();
            out.push({ t: /dccon/.test(c.getAttribute("class") || "") ? "dccon" : "img", src, alt: c.getAttribute("alt") || c.getAttribute("title") || "" });
          }
          continue;
        }
        if (tag === "video") {
          const con = /dccon/.test(c.getAttribute("class") || ""), file = abs(c.getAttribute("src") || c.querySelector("source")?.getAttribute("src") || ""), pic = abs(c.getAttribute("data-src") || ""), ok = (u) => /^https:\/\//.test(u);
          if (con) {
            if (ok(pic) || ok(file)) {
              flush();
              out.push(ok(pic) ? { t: "dccon", src: pic, mp4: ok(file) && file !== pic ? file : "", alt: c.getAttribute("title") || "" } : { t: "dccon", src: file, video: true, alt: c.getAttribute("title") || "" });
            }
          } else if (ok(file)) {
            flush();
            out.push({ t: "video", src: file, poster: abs(c.getAttribute("poster") || "") });
          }
          continue;
        }
        if (tag === "iframe" || tag === "embed") {
          const src = abs(c.getAttribute("src") || "");
          if (src) {
            flush();
            out.push({ t: "embed", src });
          }
          continue;
        }
        const cls = c.getAttribute("class") || "";
        if (/txtdccon/.test(cls)) {
          const v = c.textContent.trim(), inner = c.querySelector('[class*="ctxt_"]');
          if (v) {
            flush();
            out.push({ t: "txtcon", v, bg: (cls.match(/cbg_([0-9a-f]{6})/i) || [])[1] || "3b4890", fg: ((inner?.getAttribute("class") || "").match(/ctxt_([0-9a-f]{6})/i) || [])[1] || "ffffff" });
          }
          continue;
        }
        if (tag === "a") {
          const href = abs(c.getAttribute("href") || ""), before = buf.length;
          walk(c);
          if (/^https?:\/\//.test(href) && !/https?:\/\//.test(buf.slice(before))) buf += (buf.length > before ? " " : "") + href + " ";
          continue;
        }
        const block = /^(p|div|li|tr|h[1-6]|blockquote|ul|ol|table)$/.test(tag);
        if (block && buf && !buf.endsWith("\n")) buf += "\n";
        walk(c);
        if (block && buf && !buf.endsWith("\n")) buf += "\n";
      }
    };
    walk(root);
    flush();
    return out;
  }
  function writer(node) {
    return { name: node?.getAttribute("data-nick") || "\u3147\u3147", uid: node?.getAttribute("data-uid") || "", ip: node?.getAttribute("data-ip") || "" };
  }
  function parseList(doc) {
    const posts = [];
    for (const row of doc.querySelectorAll("tr.ub-content[data-no]")) {
      const id = num(row.getAttribute("data-no")), flag = row.getAttribute("data-type") || "";
      const link = [...row.querySelectorAll(".gall_tit a")].find((a) => !/reply_numbox/.test(a.getAttribute("class") || "") && /\/view\//.test(a.getAttribute("href") || ""));
      if (!id || !link) continue;
      const subject = row.querySelector(".gall_subject"), date = row.querySelector(".gall_date");
      let head = "";
      if (subject) {
        const inner = subject.querySelector(".subject_inner");
        head = (inner ? inner.textContent : subject.textContent).trim();
      }
      posts.push({
        id,
        notice: flag === "icon_notice",
        head,
        title: link.textContent.trim(),
        ...writer(row.querySelector(".gall_writer")),
        time: date?.getAttribute("title") || date?.textContent.trim() || "",
        views: num(row.querySelector(".gall_count")?.textContent),
        up: num(row.querySelector(".gall_recommend")?.textContent),
        comments: num(row.querySelector(".reply_num")?.textContent),
        hasImage: /pic|img/.test(flag),
        hasVideo: /movie/.test(flag),
        best: /recom/.test(flag)
      });
    }
    if (!posts.length && !doc.querySelector(".gall_list")) throw Error("\uAC8C\uC2DC\uAE00 \uBAA9\uB85D\uC744 \uC77D\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4. \uC811\uADFC \uC81C\uD55C\uC774\uAC70\uB098 \uD398\uC774\uC9C0 \uAD6C\uC870\uAC00 \uBC14\uB00C\uC5C8\uC744 \uC218 \uC788\uC2B5\uB2C8\uB2E4.");
    const heads = [];
    for (const n of doc.querySelectorAll('[onclick*="listSearchHead"]')) {
      const m = (n.getAttribute("onclick") || "").match(/listSearchHead\(\s*['"]?(\d{1,6})/), name2 = n.textContent.trim();
      if (m && name2 && !heads.some((h) => h.id === m[1])) heads.push({ id: m[1], name: name2 });
    }
    const name = (doc.querySelector("title")?.textContent || "").split(" - ")[0].replace(/\s*(마이너|미니|인물)?\s*갤러리$/, "").trim();
    return { posts, heads, name };
  }
  function parseView(doc, no) {
    const text = (s2) => doc.querySelector(s2)?.textContent.trim() || "";
    const title = text(".title_subject");
    if (!title) throw Error("\uC0AD\uC81C\uB418\uC5C8\uAC70\uB098 \uC811\uADFC\uD560 \uC218 \uC5C6\uB294 \uAC8C\uC2DC\uAE00\uC785\uB2C8\uB2E4.");
    const root = doc.querySelector(".write_div"), date = doc.querySelector(".gallview_head .gall_date"), blocks = root ? toBlocks(root) : [];
    const tail = blocks[blocks.length - 1];
    if (tail?.t === "text") {
      tail.v = tail.v.replace(/\n?\s*-\s*dc\s+(official\s+)?app\s*$/i, "").trim();
      if (!tail.v) blocks.pop();
    }
    return {
      id: Number(no),
      title,
      head: text(".title_headtext").replace(/^\[|\]$/g, ""),
      ...writer(doc.querySelector(".gallview_head .gall_writer")),
      time: date?.getAttribute("title") || date?.textContent.trim() || "",
      views: num(text(".gallview_head .gall_count")),
      up: num(text("#recommend_view_up_" + no)),
      down: num(text("#recommend_view_down_" + no)),
      commentCount: num(text(".gallview_head .gall_comment")),
      blocks,
      token: doc.querySelector('input[name="e_s_n_o"]')?.getAttribute("value") || ""
    };
  }
  function parseComments(data, parse) {
    if (!data || typeof data !== "object" || !("comments" in data)) throw Error("\uB313\uAE00 \uC751\uB2F5 \uD615\uC2DD\uC774 \uBC14\uB00C\uC5C8\uC2B5\uB2C8\uB2E4.");
    const out = [];
    for (const c of data.comments || []) {
      const id = String(c.no ?? "");
      if (!/^[1-9]\d*$/.test(id) || out.some((x) => x.id === id)) continue;
      const deleted = String(c.is_delete) === "1" || c.del_yn === "Y", parentId = /^[1-9]\d*$/.test(String(c.c_no ?? "")) ? String(c.c_no) : null;
      const root = parse('<div id="m">' + (c.memo || "") + "</div>").querySelector("#m");
      out.push({
        id,
        parentId,
        name: deleted ? "\uC0AD\uC81C\uB41C \uB313\uAE00" : c.name || "\u3147\u3147",
        uid: String(c.user_id || ""),
        ip: String(c.ip || ""),
        time: deleted ? "" : String(c.reg_date || ""),
        blocks: deleted ? [{ t: "text", v: "(\uC0AD\uC81C\uB41C \uB313\uAE00)" }] : toBlocks(root),
        deleted,
        mine: c.my_cmt === "Y"
      });
    }
    return { total: num(data.total_cnt), comments: out };
  }
  function parseGallerySearch(doc) {
    const out = [];
    for (const a of doc.querySelectorAll("a.gallname_txt")) {
      try {
        const u = new URL(a.getAttribute("href"), BASE), id = u.searchParams.get("id");
        if (u.hostname !== "gall.dcinside.com" || !id || out.some((g) => g.id === id)) continue;
        out.push({ id, name: a.textContent.replace(/[ⓜⓝⓟ]/g, "").trim(), type: u.pathname.includes("mgallery") ? "minor" : u.pathname.includes("mini") ? "mini" : "normal" });
      } catch {
      }
    }
    return out;
  }
  function createDc({ http, parse }) {
    const busy = () => Object.assign(Error("\uB514\uC2DC\uAC00 \uC7A0\uC2DC \uC694\uCCAD\uC744 \uB9C9\uC558\uC2B5\uB2C8\uB2E4. \uC870\uAE08 \uB4A4\uC5D0 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694."), { code: "BUSY" });
    const get = async (url) => {
      const r = await http(url, { headers: { Referer: BASE + "/" } });
      if (r.status === 429 || r.status === 403 || r.status === 200 && !r.text.trim()) throw busy();
      if (r.status !== 200) throw Error("\uB514\uC2DC\uC5D0\uC11C \uC694\uCCAD\uC744 \uAC70\uC808\uD588\uC2B5\uB2C8\uB2E4 (" + r.status + ").");
      return r.text;
    };
    return {
      async searchGalleries(q) {
        q = String(q || "").trim();
        if (!q || q.length > 60) throw Error("\uAC80\uC0C9\uC5B4\uB97C 1~60\uC790\uB85C \uC785\uB825\uD574 \uC8FC\uC138\uC694.");
        return parseGallerySearch(parse(await get("https://search.dcinside.com/gallery/q/" + encodeURIComponent(q))));
      },
      async listPosts(g, { page = 1, head = "" } = {}) {
        if (head !== "" && !/^\d{1,6}$/.test(String(head))) throw Error("\uC798\uBABB\uB41C \uB9D0\uBA38\uB9AC\uC785\uB2C8\uB2E4.");
        return parseList(parse(await get(boardUrl(g, "lists") + "&page=" + Math.max(1, page | 0) + (head !== "" ? "&search_head=" + head : ""))));
      },
      async readPost(g, no) {
        if (!/^\d+$/.test(String(no))) throw Error("\uC798\uBABB\uB41C \uAE00 \uBC88\uD638\uC785\uB2C8\uB2E4.");
        return parseView(parse(await get(boardUrl(g, "view") + "&no=" + no)), no);
      },
      async readComments(g, no, token, page = 1) {
        const r = await http(BASE + "/board/comment/", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8", "X-Requested-With": "XMLHttpRequest", Referer: boardUrl(g, "view") + "&no=" + no },
          body: new URLSearchParams({ id: g.id, no: String(no), cmt_id: g.id, cmt_no: String(no), e_s_n_o: token, comment_page: String(page), sort: "D", prevCnt: "0", _GALLTYPE_: GTYPE[g.type] }).toString()
        });
        if (r.status === 429 || r.status === 403 || r.status === 200 && !r.text.trim()) throw busy();
        if (r.status !== 200) throw Error("\uB313\uAE00\uC744 \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4 (" + r.status + ").");
        let data;
        try {
          data = JSON.parse(r.text);
        } catch {
          throw Error("\uB313\uAE00 \uC751\uB2F5\uC744 \uD574\uC11D\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.");
        }
        return parseComments(data, parse);
      }
    };
  }

  // src/core/drive.js
  var M = "https://m.dcinside.com";
  var mView = (g, no) => M + "/" + (g.type === "mini" ? "mini" : "board") + "/" + g.id + "/" + no;
  var mList = (g) => M + "/" + (g.type === "mini" ? "mini" : "board") + "/" + g.id;
  var mWrite = (g) => M + "/" + (g.type === "mini" ? "writemini" : "write") + "/" + g.id;
  var mModify = (g, no) => mWrite(g) + "/modify/" + no;
  var mGallog = (user, menu) => M + "/gallog/" + encodeURIComponent(user) + (menu ? "?menu=" + menu : "");
  var LOGIN_URL = "https://msign.dcinside.com/login?r_url=" + encodeURIComponent(M + "/");
  var LOGIN_DONE = M + "/";
  function helpers() {
    const alerts = [];
    window.alert = (m) => {
      alerts.push(String(m));
    };
    window.confirm = () => true;
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const until = async (test, ms = 1e4) => {
      const end = Date.now() + ms;
      for (; ; ) {
        const v = test();
        if (v) return v;
        if (Date.now() > end) return null;
        await wait(150);
      }
    };
    const ajax = (pat, ms = 2e4) => new Promise((res) => {
      const t = setTimeout(() => res(null), ms);
      window.jQuery(document).ajaxComplete((e, xhr, s2) => {
        if (!pat.test(s2.url || "")) return;
        clearTimeout(t);
        let j = null;
        try {
          j = xhr.responseJSON || JSON.parse(xhr.responseText);
        } catch {
        }
        res(j || {});
      });
    });
    const user = () => (document.querySelector("#user_id") || {}).value || "";
    const done = (r) => !r ? { error: alerts.join(" ") || "\uB514\uC2DC\uC5D0\uC11C \uC751\uB2F5\uC774 \uC5C6\uC2B5\uB2C8\uB2E4." } : r.result === true || r.result === 1 || r.result === "1" || r.result === "success" ? { ok: true } : r.cause === "captcha" ? { need: "captcha" } : { error: String(r.cause || r.msg || alerts.join(" ") || "\uC694\uCCAD\uC774 \uAC70\uC808\uB418\uC5C8\uC2B5\uB2C8\uB2E4.") };
    const form = (parentNo) => {
      if (!parentNo) return { form: document.querySelector("#comment_write"), memo: "#comment_memo", mode: "commentWrite", tmode: "txtconWrite" };
      const li = document.querySelector('#comment_box li.comment[no="' + parentNo + '"]');
      if (!li) return null;
      const idx = li.id.replace("comment_cnt_", "");
      if (!document.querySelector("#comment_addDiv" + idx)) window.comment_reple(idx);
      return { form: document.querySelector("#comment_write_reple"), memo: "#comment_memo_reple", mode: "commentReple", tmode: "txtconReple" };
    };
    const reveal = (on, host) => {
      let tip = document.querySelector("#yj-tip"), st = document.querySelector("#yj-human");
      if (on) {
        if (!st) {
          st = document.createElement("style");
          st.id = "yj-human";
          st.textContent = "html,body{background:#fff!important;overflow:hidden!important}body *{visibility:hidden!important}.yj-host,.yj-host *,#yj-tip{visibility:visible!important}.yj-host{position:fixed!important;left:0!important;right:0!important;top:56%!important;transform:translateY(-50%)!important;display:flex!important;justify-content:center!important;margin:0!important;z-index:2147483646!important}";
          document.head.appendChild(st);
        }
        if (host) host.classList.add("yj-host");
        if (!tip) {
          tip = document.createElement("div");
          tip.id = "yj-tip";
          tip.textContent = "\uD655\uC778\uC744 \uB204\uB974\uBA74 \uC790\uB3D9\uC73C\uB85C \uB4F1\uB85D\uB429\uB2C8\uB2E4.";
          tip.style.cssText = "position:fixed;left:0;right:0;top:0;z-index:2147483647;color:#444;font-size:14px;line-height:1.4;padding:14px 14px 0;text-align:center";
          document.body.appendChild(tip);
        }
      } else {
        if (st) st.remove();
        if (tip) tip.remove();
        for (const n of document.querySelectorAll(".yj-host")) n.classList.remove("yj-host");
      }
      try {
        if (window.__yjShow) window.__yjShow(!!on);
      } catch (e) {
      }
      console.log(on ? "__YJ_SHOW__" : "__YJ_HIDE__");
    };
    const human = async (root) => {
      const slot = root && root.querySelector("#dc-turnstile, .dc-ts-slot"), ts = window.dcTs;
      if (!slot || !ts || typeof window.dcTsLoad !== "function") return true;
      if (!ts.focusAt) ts.focusAt = Date.now();
      window.dcTsLoad();
      window.dcTsUse(root);
      const token = () => {
        try {
          return window.turnstile && ts.id !== null && window.turnstile.getResponse(ts.id) || "";
        } catch (e) {
          return "";
        }
      };
      await until(() => token() || ts.state === "interactive" || ts.state === "error", 2e4);
      if (token()) return true;
      reveal(true, ts.host || slot);
      const ok = await until(token, 17e4);
      reveal(false);
      return !!ok;
    };
    const HUMAN_FAIL = { error: "'\uC0AC\uB78C\uC778\uC9C0 \uD655\uC778'\uC744 \uB9C8\uCE58\uC9C0 \uBABB\uD574 \uB4F1\uB85D\uD558\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694." };
    return { alerts, wait, until, ajax, user, done, form, human, HUMAN_FAIL };
  }
  var SCRIPTS = {
    // 로그인 상태 확인
    state(a, h) {
      return { user: h.user() };
    },
    // 갤로그 목록 읽기. menu가 U면 방명록, 그 밖(게시글 G_all, 댓글 R_all, 스크랩 B)은 글로 가는 링크를 모읍니다.
    gallog(a, h) {
      const clean = (s2) => String(s2 || "").replace(/\s+/g, " ").trim(), items = [];
      if (a.menu === "U") {
        for (const li of document.querySelectorAll(".all-comment-lst li.comment")) items.push({ name: clean((li.querySelector(".nick") || {}).textContent), text: clean((li.querySelector(".txt") || {}).textContent), date: clean((li.querySelector(".date") || {}).textContent) });
      } else {
        const seen = /* @__PURE__ */ new Set();
        for (const li of document.querySelectorAll(".gall-detail-lst li[gall_code][gall_no]")) {
          const type = li.getAttribute("gall_type") || "", body = li.querySelector(".fxo-txt"), num2 = clean((li.querySelector(".num") || {}).textContent), orig = clean((li.querySelector(".original-tit") || {}).textContent);
          const title = clean(body && body.textContent) || (body && body.querySelector("img,video") ? "(\uB514\uC2DC\uCF58)" : "") || orig;
          items.push({
            code: li.getAttribute("gall_code"),
            no: Number(li.getAttribute("gall_no")),
            type,
            mini: /^[NISX]$/.test(type),
            person: /^[PLQ]$/.test(type),
            orig,
            title: title + (num2 ? " " + num2 : ""),
            sub: [...li.querySelectorAll(".ginfo li")].map((n) => clean(n.textContent)).filter(Boolean).concat(orig && orig !== title ? ["\uC6D0\uAE00: " + orig] : []).join(" \xB7 ").slice(0, 90)
          });
        }
        for (const link of document.querySelectorAll('.container a[href^="javascript:moveScrapView"]')) {
          const m = link.getAttribute("href").match(/moveScrapView\((\d+),\s*(\d+),\s*'(\w+)'/);
          if (!m) continue;
          items.push({ code: m[1], no: Number(m[2]), type: m[3], mini: /^[NISX]$/.test(m[3]), person: /^[PLQ]$/.test(m[3]), title: clean((link.querySelector(".fxo-txt") || link).textContent), sub: [...link.querySelectorAll(".ginfo li")].map((n) => clean(n.textContent)).filter(Boolean).join(" \xB7 ").slice(0, 90) });
        }
        for (const link of document.querySelectorAll(".container a[href]")) {
          const m = link.href.match(/m\.dcinside\.com\/(board|mini)\/([A-Za-z0-9_]+)\/(\d+)/);
          if (!m) continue;
          const key2 = m[2] + "/" + m[3] + "/" + clean(link.textContent).slice(0, 40);
          if (seen.has(key2)) continue;
          seen.add(key2);
          const row = link.closest("li") || link, parts = [...row.querySelectorAll(".tit,.subject,.txt,p,span,em")].map((n) => clean(n.textContent)).filter(Boolean);
          items.push({ mini: m[1] === "mini", id: m[2], no: Number(m[3]), title: clean(link.textContent) || parts[0] || "", sub: clean(row.textContent).replace(clean(link.textContent), "").trim().slice(0, 80) });
        }
      }
      return { items, note: items.length ? "" : clean((document.querySelector(".container") || document.body).textContent).slice(0, 100) };
    },
    // 갤로그 목록의 갤러리 번호를 갤러리 주소(id)로 바꿉니다. 디시 화면이 줄을 눌렀을 때 쓰는 것과 같은 요청입니다.
    async gallId(a, h) {
      const $2 = window.jQuery, r = await new Promise((res) => {
        const t = setTimeout(() => res(null), 15e3);
        $2.ajax({ type: "post", url: "/gallog/list-direct", headers: { "X-CSRF-TOKEN": $2('meta[name="csrf-token"]').attr("content") }, data: { gall_code: a.code, gall_type: a.type }, success: (v) => {
          clearTimeout(t);
          res(v);
        }, error: () => {
          clearTimeout(t);
          res(null);
        } });
      });
      return r && r.gall_id ? { id: String(r.gall_id) } : { error: "\uAE00\uC774 \uC788\uB294 \uAC24\uB7EC\uB9AC\uB97C \uCC3E\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4." };
    },
    // 댓글·답글 쓰기
    async comment(a, h) {
      if (!h.user()) return { need: "login" };
      const f2 = h.form(a.parentNo);
      if (!f2 || !f2.form) return { error: a.parentNo ? "\uB2F5\uAE00\uC744 \uB2EC \uB313\uAE00\uC744 \uCC3E\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4." : "\uB313\uAE00\uC744 \uC4F8 \uC218 \uC5C6\uB294 \uAE00\uC785\uB2C8\uB2E4." };
      if (f2.form.querySelector('[id^="captcha_codeC"]')) return { need: "captcha" };
      f2.form.querySelector(f2.memo).value = a.text;
      if (!await h.human(f2.form)) return h.HUMAN_FAIL;
      const p = h.ajax(/\/ajax\/comment-write/);
      window.comment_write_ok(f2.form);
      return h.done(await p);
    },
    // 사용할 수 있는 디시콘 목록 읽기
    async dcconList(a, h) {
      if (!document.querySelector("#commentWrite")) return { error: "\uC774 \uAE00\uC5D0\uC11C\uB294 \uB514\uC2DC\uCF58\uC744 \uC4F8 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." };
      window.show_dccon("commentWrite");
      const box = document.querySelector("#dcconBoxComment");
      await h.until(() => !box.querySelector(".dccon-loading"), 12e3);
      await h.wait(300);
      const items = [...box.querySelectorAll(".sm-img")].map((n) => {
        const img = n.querySelector("img");
        return { pkg: String(n.getAttribute("data-dccon-package") || ""), detail: String(n.getAttribute("data-dccon-detail") || ""), src: img ? img.getAttribute("data-src") || img.getAttribute("data-original") || img.src || "" : "", alt: img ? img.alt : "" };
      }).filter((x) => x.pkg && x.detail && /^https:/.test(x.src));
      return { user: h.user(), items, double: !!document.querySelector("#dbl_con_chk"), note: items.length ? "" : (box.textContent || "").replace(/\s+/g, " ").trim().slice(0, 120) };
    },
    // 디시콘 1개 또는 2개(더블콘) 댓글로 등록
    async dccon(a, h) {
      if (!h.user()) return { need: "login" };
      const f2 = h.form(a.parentNo);
      if (!f2 || !f2.form) return { error: "\uB514\uC2DC\uCF58\uC744 \uB2EC \uACF3\uC744 \uCC3E\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4." };
      window.show_dccon(f2.mode);
      const box = await h.until(() => {
        const b = document.querySelector(f2.mode === "commentWrite" ? "#dcconBoxComment" : "#dcconBoxReple");
        return b && !b.querySelector(".dccon-loading") ? b : null;
      }, 12e3);
      if (!box) return { error: "\uB514\uC2DC\uCF58 \uCC3D\uC744 \uC5F4\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4." };
      if (!await h.human(f2.form)) return h.HUMAN_FAIL;
      const p = h.ajax(/\/ajax\/comment-write/);
      if (a.items.length === 2) {
        const chk = document.querySelector("#dbl_con_chk");
        if (!chk) return { error: "\uC774 \uD654\uBA74\uC5D0\uC11C\uB294 \uB354\uBE14\uCF58\uC744 \uC4F8 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." };
        if (!chk.checked) chk.click();
      }
      for (const it of a.items) {
        window.insertDccon({ dcconPackage: it.pkg, dcconDetail: it.detail });
        await h.wait(400);
      }
      return h.done(await p);
    },
    // 글자콘 등록
    async txtcon(a, h) {
      if (!h.user()) return { need: "login" };
      const f2 = h.form(a.parentNo);
      if (!f2 || !f2.form) return { error: "\uAE00\uC790\uCF58\uC744 \uB2EC \uACF3\uC744 \uCC3E\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4." };
      const btn = f2.form.querySelector(".add-txtdccon");
      if (!btn || getComputedStyle(btn).display === "none") return { error: "\uC774 \uAC24\uB7EC\uB9AC\uB294 \uAE00\uC790\uCF58\uC744 \uC4F8 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." };
      window.show_txtcon(f2.tmode);
      const memo = await h.until(() => document.querySelector("#txtcon_memo"), 5e3);
      if (!memo) return { error: "\uAE00\uC790\uCF58 \uCC3D\uC744 \uC5F4\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4." };
      const pick = (list, c) => {
        const b = document.querySelector(list + ' [data-txtcon-color="' + c + '"]');
        if (b) b.click();
      };
      pick("#txtcon_bg_list", a.bg);
      pick("#txtcon_font_list", a.fg);
      memo.value = a.text;
      memo.dispatchEvent(new Event("input", { bubbles: true }));
      memo.dispatchEvent(new Event("keyup", { bubbles: true }));
      if (!await h.human(f2.form)) return h.HUMAN_FAIL;
      const p = h.ajax(/\/ajax\/comment-write/);
      window.insertTxtcon();
      return h.done(await p);
    },
    // 댓글 삭제(내 댓글, 또는 내 글에 달린 댓글)
    async delComment(a, h) {
      if (!h.user()) return { need: "login" };
      const li = document.querySelector('#comment_box li.comment[no="' + a.no + '"]');
      if (!li) return { error: "\uC0AD\uC81C\uD560 \uB313\uAE00\uC744 \uCC3E\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4." };
      if (!li.querySelector(".comment-del")) return { error: "\uC774 \uB313\uAE00\uC744 \uC0AD\uC81C\uD560 \uAD8C\uD55C\uC774 \uC5C6\uC2B5\uB2C8\uB2E4." };
      const p = h.ajax(/\/del\/comment|comment-del|\/ajax\/comment_del/);
      window.comment_del(li.id.replace("comment_cnt_", ""));
      const pw = document.querySelector("#pw_layer");
      if (pw && getComputedStyle(pw).display === "block") return { error: "\uBE44\uD68C\uC6D0 \uB313\uAE00\uC740 \uBE44\uBC00\uBC88\uD638\uAC00 \uD544\uC694\uD574 \uC5EC\uAE30\uC11C \uC0AD\uC81C\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." };
      return h.done(await p);
    },
    // 글 삭제
    async delPost(a, h) {
      if (!h.user()) return { need: "login" };
      if (typeof window.boardDel_action !== "function") return { error: "\uC0AD\uC81C\uD560 \uC218 \uC5C6\uB294 \uAE00\uC785\uB2C8\uB2E4." };
      const p = h.ajax(/\/del\/board/);
      window.boardDel_action(1);
      return h.done(await p);
    },
    // 글쓰기: 글과 사진을 보낸 순서대로 본문에 넣고 등록합니다. 등록되면 화면이 글 목록으로 넘어갑니다.
    async write(a, h) {
      if (!h.user()) return { need: "login" };
      const subject = document.querySelector("#subject"), box = await h.until(() => document.querySelector(".note-editable"), 8e3);
      if (!subject || !box) return { error: "\uAE00\uC4F0\uAE30 \uD654\uBA74\uC744 \uC5F4\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4." };
      if (!box.textContent.trim() && !box.querySelector("img,video,iframe")) box.innerHTML = "";
      const toEnd = () => {
        box.focus();
        const r = document.createRange();
        r.selectNodeContents(box);
        r.collapse(false);
        const s2 = window.getSelection();
        s2.removeAllRanges();
        s2.addRange(r);
        try {
          window.jQuery("#textbox").summernote("saveRange");
        } catch (e) {
        }
      };
      subject.value = a.title;
      subject.dispatchEvent(new Event("input", { bubbles: true }));
      if (a.head !== "" && a.head != null) {
        const pick = document.querySelector('li.swiper-slide[data-no="' + a.head + '"] a');
        if (pick) pick.click();
        const hid = document.querySelector("#headtext");
        if (hid) hid.value = a.head;
      }
      const media = () => box.querySelectorAll("img,video,.block").length;
      for (const b of a.blocks) {
        if (b.t === "text") {
          for (const line of b.v.split("\n")) {
            const p = document.createElement("p");
            if (line) p.textContent = line;
            else p.appendChild(document.createElement("br"));
            box.appendChild(p);
          }
          continue;
        }
        const bin = atob(b.b64), bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        const input = document.querySelector(b.t === "video" ? "#upload_movie" : "#upload");
        if (!input) return { error: "\uCCA8\uBD80 \uCE78\uC744 \uCC3E\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4." };
        const dt = new DataTransfer();
        dt.items.add(new File([bytes], b.name, { type: b.type }));
        input.files = dt.files;
        toEnd();
        const before = media();
        input.dispatchEvent(new Event("change", { bubbles: true }));
        if (!await h.until(() => media() > before, b.t === "video" ? 24e4 : 6e4)) return { error: (h.alerts.join(" ") || "\uCCA8\uBD80\uB97C \uC62C\uB9AC\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4") + ": " + b.name };
        await h.wait(500);
      }
      box.dispatchEvent(new Event("input", { bubbles: true }));
      if (!await h.human(document.body)) return h.HUMAN_FAIL;
      window.write_submit();
      await h.until(() => h.alerts.length, 25e3);
      return { error: h.alerts.join(" ") || "\uB4F1\uB85D \uC751\uB2F5\uC744 \uD655\uC778\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4. \uAE00 \uBAA9\uB85D\uC5D0\uC11C \uC62C\uB77C\uAC14\uB294\uC9C0 \uD655\uC778\uD574 \uC8FC\uC138\uC694." };
    }
  };
  function script(name, args = {}) {
    if (!SCRIPTS[name]) throw Error("\uC5C6\uB294 \uC870\uC791\uC785\uB2C8\uB2E4: " + name);
    return "(async()=>{const h=(" + helpers.toString() + ")();return await (" + SCRIPTS[name].toString().replace(/^(async\s+)?(\w+)\(/, "$1function(") + ")(" + JSON.stringify(args) + ",h)})()";
  }

  // src/ui/icons.js
  var s = (d, w = 24, extra = "") => '<svg viewBox="0 0 24 24" width="' + w + '" height="' + w + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' + extra + ">" + d + "</svg>";
  var f = (d, w = 28) => '<svg viewBox="0 0 24 24" width="' + w + '" height="' + w + '" fill="currentColor" aria-hidden="true">' + d + "</svg>";
  var cog = (() => {
    const pt = (r, a) => (12 + r * Math.cos(a * Math.PI / 180)).toFixed(2) + " " + (12 + r * Math.sin(a * Math.PI / 180)).toFixed(2);
    let d = "";
    for (let i = 0; i < 8; i++) {
      const a = i * 45;
      d += (i ? "L" : "M") + pt(7, a - 15) + "L" + pt(9.4, a - 9) + "L" + pt(9.4, a + 9) + "L" + pt(7, a + 15);
    }
    return s('<path d="' + d + 'Z"/><circle cx="12" cy="12" r="3"/>');
  })();
  var I = {
    person: f('<circle cx="12" cy="8" r="4.2"/><path d="M3.5 21c0-4.4 3.8-7 8.5-7s8.5 2.6 8.5 7z"/>'),
    chat: f('<path d="M12 3.5c-5 0-9 3.3-9 7.4 0 2.6 1.6 4.9 4.1 6.2L6.3 21l4.3-2.8c.5.1.9.1 1.4.1 5 0 9-3.3 9-7.4s-4-7.4-9-7.4z"/>'),
    more: f('<circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>'),
    smile: s('<circle cx="12" cy="12" r="9"/><path d="M8 14c1 1.6 2.4 2.4 4 2.4s3-.8 4-2.4"/><circle cx="9" cy="10" r=".8" fill="currentColor"/><circle cx="15" cy="10" r=".8" fill="currentColor"/>'),
    bell: s('<path d="M6 17V11a6 6 0 0 1 12 0v6l1.5 2h-15z"/><path d="M10 21h4"/>'),
    sun: s('<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>'),
    cog,
    /* 휴대폰 하단 메뉴용(속을 채운 모양) */
    personM: f('<circle cx="12" cy="7.4" r="3.9"/><path d="M12 13c-4.7 0-7.4 1.9-7.4 4.2 0 1.4 1 2.2 2.5 2.2h9.8c1.5 0 2.5-.8 2.5-2.2 0-2.3-2.7-4.2-7.4-4.2z"/>', 30),
    chatM: f('<ellipse cx="12" cy="10.8" rx="8.7" ry="7.1"/><path d="M6.9 15.6 6.3 20c-.1.6.5.9.9.6l4.6-3.3z"/>', 30),
    conM: '<svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor" aria-hidden="true"><ellipse cx="15.6" cy="9.6" rx="6.6" ry="5.7"/><path d="M19.3 13.4l.6 3.4c.1.5-.4.8-.8.5l-3.5-2.5z"/><g stroke="#fff" stroke-width="1.3"><ellipse cx="9.2" cy="12.6" rx="6.9" ry="6"/></g><path d="M5.2 16.6l-.5 3.3c-.1.5.4.8.8.5l3.6-2.6z"/><circle cx="6.9" cy="11.6" r="1" fill="#fff"/><circle cx="11.5" cy="11.6" r="1" fill="#fff"/><path d="M6.4 14.1h5.6a2.9 2.9 0 0 1-5.6 0z" fill="#fff"/></svg>',
    bellF: f('<path d="M12 2.5a6.5 6.5 0 0 0-6.5 6.5v5.2L3.6 17.6c-.4.7.1 1.4.9 1.4h15c.8 0 1.3-.7.9-1.4l-1.9-3.4V9A6.5 6.5 0 0 0 12 2.5z"/><path d="M9.6 20.2a2.5 2.5 0 0 0 4.8 0z"/>'),
    smileF: f('<path fill-rule="evenodd" d="M12 2.5a9.5 9.5 0 1 0 0 19 9.5 9.5 0 0 0 0-19zM8.9 8.6a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4zm6.2 0a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4zM7.4 13.6h9.2a4.7 4.7 0 0 1-9.2 0z"/>'),
    sunF: '<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.4" stroke="none"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7"/></svg>',
    search: s('<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/>', 22),
    plusGal: s('<circle cx="9.5" cy="8" r="3.6"/><path d="M2.5 20c0-3.6 3-6 7-6s7 2.4 7 6M19 6v6M16 9h6"/>'),
    write: s('<path d="M11 4.5c-4.4 0-8 2.8-8 6.3 0 2.2 1.4 4.1 3.5 5.2L6 19.5l3.6-2.4c.5.1.9.1 1.4.1 4.4 0 8-2.8 8-6.4"/><path d="M19 2.5v6M16 5.5h6"/>'),
    menu: s('<path d="M4 6h16M4 12h16M4 18h16"/>', 22),
    refresh: s('<path d="M20 12a8 8 0 1 1-2.5-5.8M20 4v5h-5"/>', 22),
    horn: '<svg viewBox="0 0 24 24" width="20" height="20" fill="#3b8de0" aria-hidden="true"><path d="M3 9.5h4l8-5v15l-8-5H3z"/><path d="M17.5 8.5a5 5 0 0 1 0 7" fill="none" stroke="#3b8de0" stroke-width="1.8" stroke-linecap="round"/></svg>',
    down: s('<path d="m6 9 6 6 6-6"/>', 18, ' style="color:#888"'),
    up: s('<path d="m6 15 6-6 6 6"/>', 16, ' style="color:#888"'),
    back: s('<path d="m15 5-7 7 7 7"/>', 22),
    next: s('<path d="m9 5 7 7-7 7"/>', 18, ' style="color:#888;flex:none"'),
    plus: s('<path d="M12 5v14M5 12h14"/>', 22),
    file: s('<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/>', 22),
    listp: s('<path d="M4 6h14M4 12h8M4 18h8M17 12v6M14 15h6"/>', 18),
    pin: '<svg viewBox="0 0 24 24" width="14" height="14" fill="#8a8a8a" style="margin-left:5px" role="img" aria-label="\uC0C1\uB2E8 \uACE0\uC815"><path d="M8 3h8v2l-1.5 1v5l3 3v2h-4.5v5l-1 1-1-1v-5H6.5v-2l3-3V6L8 5z"/></svg>',
    /* 기본 프로필: 머리와 어깨가 칸 한가운데에 다 들어오는 사람 모양 */
    sil: '<svg viewBox="0 0 24 24" fill="rgba(255,255,255,.7)" aria-hidden="true"><circle cx="12" cy="8.6" r="3.7"/><path d="M12 13.4c-4.2 0-7 1.9-7 4.6 0 1 .8 1.6 1.8 1.6h10.4c1 0 1.8-.6 1.8-1.6 0-2.7-2.8-4.6-7-4.6z"/></svg>'
  };

  // src/ui/native-android.js
  function androidNative(YJ) {
    const waiting = /* @__PURE__ */ new Map();
    let seq = 0;
    window.__yjReply = (id, value) => {
      const p = waiting.get(id);
      if (!p) return;
      waiting.delete(id);
      if (value && value.__error) p.reject(Error(value.__error));
      else p.resolve(value);
    };
    const call = (name, ...args) => new Promise((resolve, reject) => {
      const id = "r" + ++seq;
      waiting.set(id, { resolve, reject });
      YJ[name](id, ...args);
    });
    return {
      platform: "android",
      version: YJ.version(),
      http: (url, opt) => call("http", url, JSON.stringify(opt || {})),
      drive: (url, code, opt) => call("drive", url, code, JSON.stringify(opt || {})),
      official: (url, opt) => call("official", url, JSON.stringify(opt || {})),
      open: (url) => YJ.open(url),
      logout: () => call("logout")
    };
  }

  // src/ui/app.js
  var native = window.native || androidNative(window.YJ);
  if (window.native) document.documentElement.classList.add("win");
  var gate = Promise.resolve();
  var pvPause = 0;
  var blocked = (r) => r.status === 429 || r.status === 403 || r.status === 200 && !r.text.trim();
  function queued(url, opt) {
    const run = gate.then(() => native.http(url, opt));
    gate = run.then((r) => {
      if (blocked(r)) pvPause = Date.now() + 6e4;
    }, () => {
    }).then(() => new Promise((r) => setTimeout(r, 600)));
    return run;
  }
  var dc = createDc({ http: queued, parse: (html) => new DOMParser().parseFromString(html, "text/html") });
  var $ = (s2) => document.querySelector(s2);
  var esc = (s2) => String(s2 ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  var COLORS = ["#a4b7e8", "#8fcbd9", "#e9a9a0", "#b6a5e0", "#8ec7a2", "#e3bd7c", "#d99cc0", "#8aa3b8"];
  var hash = (s2) => [...String(s2)].reduce((a, c) => a * 31 + c.charCodeAt(0) >>> 0, 7);
  var hue = (s2) => COLORS[hash(s2) % COLORS.length];
  var userAv = (n) => '<span class="av" style="background:' + hue(n) + '">' + I.sil + "</span>";
  var LS = "yangjitalk-v1";
  var D = Object.assign({
    gals: [{ id: "dcbest", type: "normal", name: "\uC2E4\uC2DC\uAC04 \uBCA0\uC2A4\uD2B8" }, { id: "singlebungle1472", type: "minor", name: "\uC2F1\uAE00\uBC99\uAE00 \uC9C0\uAD6C\uCD0C" }, { id: "programming", type: "normal", name: "\uD504\uB85C\uADF8\uB798\uBC0D" }],
    favs: ["normal:dcbest", "minor:singlebungle1472"],
    me: { name: "\u3147\u3147", status: "" },
    photos: {},
    rooms: [],
    alias: {},
    aliasN: 0,
    aliasOn: false,
    seen: {},
    top: {},
    tbg: "3b4890",
    tfg: "ffffff",
    trecent: [],
    watch: [],
    notis: []
  }, JSON.parse(localStorage.getItem(LS) || "{}"));
  while (D.rooms.length < 10) D.rooms.push({ mode: "random", text: "" });
  var save = () => {
    const keys = Object.keys(D.seen);
    if (keys.length > 3e3) for (const k of keys.slice(0, keys.length - 2e3)) delete D.seen[k];
    localStorage.setItem(LS, JSON.stringify(D));
  };
  var key = (g) => g.type + ":" + g.id;
  var gal = (k) => D.gals.find((g) => key(g) === k);
  var SUR = [..."\uC870\uC548\uAE40\uACE0\uBC31\uAD8C\uBB38\uC11C\uC720\uD669\uCC28\uC724"];
  var GIV = ["\uBBFC\uC218", "\uC601\uD638", "\uC7AC\uC77C", "\uC740\uCC44", "\uC2B9\uC6B0", "\uC21C\uC6A9", "\uC9C0\uD604", "\uB3D9\uD601", "\uC120\uC544", "\uBCF4\uB78C", "\uC900\uC11D", "\uD558\uB298"];
  var STATS = ["\uC624\uB298\uB3C4 \uD654\uC774\uD305", "", "Carpe diem", "\uC8FC\uB9D0\uC5D4 \uB4F1\uC0B0", "", "Have a nice day :)", "\uCEE4\uD53C \uC5C6\uC778 \uBABB \uC0B4\uC544", "", "Stay hungry, stay foolish", "\uC5F0\uB77D\uC740 \uBB38\uC790\uB85C", "", "No pain, no gain", "\uBD04\uC774 \uC624\uBA74"];
  var personName = (n) => SUR[n % 12] + GIV[(n * 5 + Math.floor(n / 12)) % 12];
  function alias(g) {
    const k = key(g);
    if (!D.alias[k]) {
      D.alias[k] = { name: personName(D.aliasN++), stat: STATS[Math.floor(Math.random() * STATS.length)] };
      save();
    }
    return D.alias[k];
  }
  var gname = (g) => D.aliasOn ? alias(g).name : g.name;
  var photoAv = (src) => '<span class="av"><img src="' + esc(src) + '" alt=""></span>';
  var meAv = () => D.me.photo ? photoAv(D.me.photo) : '<span class="av" style="background:#a3c0ea">' + I.sil + "</span>";
  function pickPhoto(done) {
    const i = document.createElement("input");
    i.type = "file";
    i.accept = "image/*";
    i.onchange = () => {
      const f2 = i.files[0];
      if (!f2) return;
      const img = new Image(), u = URL.createObjectURL(f2);
      img.onload = () => {
        const s2 = Math.min(img.width, img.height), c = document.createElement("canvas");
        c.width = c.height = 160;
        c.getContext("2d").drawImage(img, (img.width - s2) / 2, (img.height - s2) / 2, s2, s2, 0, 0, 160, 160);
        URL.revokeObjectURL(u);
        done(c.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = () => {
        URL.revokeObjectURL(u);
        toast("\uC0AC\uC9C4\uC744 \uC77D\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.");
      };
      img.src = u;
    };
    i.click();
  }
  var galAv = (g) => D.photos[key(g)] ? photoAv(D.photos[key(g)]) : D.aliasOn ? userAv(alias(g).name) : '<span class="av" style="background:' + hue(g.name) + '">' + esc([...g.name][0] || "?") + "</span>";
  function noticeName(g, idx, p) {
    const r = D.rooms[idx];
    if (r && r.mode === "custom" && r.text) return r.text;
    const h = hash(key(g) + "/" + p.id);
    return [0, 1, 2, 3].map((i) => personName((h + idx * 4 + i) % 144)).join(", ");
  }
  function parseTime(s2) {
    let m = String(s2 || "").match(/(\d{4})[-.](\d{1,2})[-.](\d{1,2})\s+(\d{1,2}):(\d{2})/);
    if (m) return new Date(+m[1], m[2] - 1, +m[3], +m[4], +m[5]);
    m = String(s2 || "").match(/(\d{1,2})\.(\d{1,2})\s+(\d{1,2}):(\d{2})/);
    if (m) {
      const now = /* @__PURE__ */ new Date(), d = new Date(now.getFullYear(), m[1] - 1, +m[2], +m[3], +m[4]);
      if (d - now > 864e5) d.setFullYear(d.getFullYear() - 1);
      return d;
    }
    return null;
  }
  var clock = (d) => (d.getHours() < 12 ? "\uC624\uC804 " : "\uC624\uD6C4 ") + (d.getHours() % 12 || 12) + ":" + String(d.getMinutes()).padStart(2, "0");
  var dayKey = (d) => d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate();
  function listTime(s2) {
    const d = parseTime(s2);
    if (!d) return esc(s2 || "");
    const now = /* @__PURE__ */ new Date(), y = new Date(now);
    y.setDate(now.getDate() - 1);
    return dayKey(d) === dayKey(now) ? clock(d) : dayKey(d) === dayKey(y) ? "\uC5B4\uC81C" : d.getFullYear() === now.getFullYear() ? d.getMonth() + 1 + "\uC6D4 " + d.getDate() + "\uC77C" : d.getFullYear() + ". " + (d.getMonth() + 1) + ". " + d.getDate() + ".";
  }
  var dayLabel = (d) => d.getFullYear() + "\uB144 " + (d.getMonth() + 1) + "\uC6D4 " + d.getDate() + "\uC77C " + "\uC77C\uC6D4\uD654\uC218\uBAA9\uAE08\uD1A0"[d.getDay()] + "\uC694\uC77C";
  var R = {
    view: "friends",
    g: null,
    head: "",
    list: null,
    listErr: "",
    listBusy: false,
    seq: 0,
    room: null,
    roomSeq: 0,
    ov: "",
    pinOpen: false,
    nfold: false,
    stab: "",
    saved: false,
    latest: {},
    updated: {},
    cache: {},
    hk: {},
    pv: {},
    pc: {},
    shown: 20,
    hidden: 0,
    search: { q: "", res: null, busy: false, err: "" },
    filter: "",
    filterOn: false,
    gmenu: null,
    log: "\uAC8C\uC2DC\uAE00",
    gallog: {},
    user: "",
    userKnown: false,
    reply: null,
    menu: null,
    ask: false,
    cpanel: false,
    tpanel: false,
    cons: { items: null, busy: false, err: "" },
    con1: null,
    tcon: "",
    write: null,
    sending: false,
    toBottom: false
  };
  var who = (x) => x.name + (x.ip ? "(" + x.ip + ")" : "");
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toast.t);
    toast.t = setTimeout(() => t.hidden = true, 2600);
  }
  function unreadOf(p) {
    const s2 = D.seen[R.g + "/" + p.id];
    return s2 != null && p.comments > s2 ? p.comments - s2 : 0;
  }
  var two = (pc, mobile) => '<span class="d-only">' + pc + '</span><span class="m-only">' + mobile + "</span>";
  var cogM = '<button class="ib m-only" data-ov="set" aria-label="\uC124\uC815">' + I.cog + "</button>";
  function renderRail() {
    const n = R.list ? R.list.posts.reduce((a, p) => a + unreadOf(p), 0) : 0;
    $("#rail").innerHTML = '<button class="ic' + (R.view === "friends" ? " on" : "") + '" data-view="friends" aria-label="\uCE5C\uAD6C">' + two(I.person, I.personM) + '</button><button class="ic' + (R.view === "chats" ? " on" : "") + '" data-view="chats" aria-label="\uCC44\uD305">' + two(I.chat, I.chatM) + (n ? '<span class="cnt">' + (n > 999 ? "999+" : n) + "</span>" : "") + '</button><button class="ic deco' + (D.aliasOn ? " on" : "") + '" data-alias aria-pressed="' + D.aliasOn + '" aria-label="\uAC24\uB7EC\uB9AC \uC774\uB984\uC744 \uC0AC\uB78C \uC774\uB984\uC73C\uB85C \uBC14\uAFB8\uAE30">' + I.more + '</button><span class="sp"></span><button class="ic' + (R.ov === "con" ? " on" : "") + '" data-ov="con" aria-label="\uB514\uC2DC\uCF58">' + two(I.smile, I.conM) + '</button><button class="ic' + (R.ov === "noti" ? " on" : "") + '" data-ov="noti" aria-label="\uC54C\uB9BC">' + two(I.bell, I.bellF) + (D.notis.some((n2) => !n2.read) ? '<i class="dot" style="left:auto;right:-2px;top:-2px"></i>' : "") + '</button><button class="ic m-only' + (D.aliasOn ? " on" : "") + '" data-alias aria-pressed="' + D.aliasOn + '" aria-label="\uAC24\uB7EC\uB9AC \uC774\uB984\uC744 \uC0AC\uB78C \uC774\uB984\uC73C\uB85C \uBC14\uAFB8\uAE30">' + I.more + '</button><button class="ic' + (R.ov === "set" ? " on" : "") + '" data-ov="set" aria-label="\uC124\uC815">' + I.cog + "</button>";
  }
  function friendsHtml() {
    const row = (g) => {
      const k = key(g), st = D.aliasOn ? alias(g).stat : R.latest[k]?.title || "";
      return '<button class="row' + (k === R.g ? " sel" : "") + '" data-g="' + esc(k) + '" data-lp="gal">' + (R.updated[k] ? '<i class="dot"></i>' : "") + galAv(g) + '<span class="tx"><b>' + esc(gname(g)) + "</b>" + (st ? '<span class="st">' + esc(st) + "</span>" : "") + "</span></button>";
    };
    const favs = D.favs.map(gal).filter(Boolean), upd = D.gals.filter((g) => R.updated[key(g)]), all = [...D.gals].sort((a, b) => gname(a).localeCompare(gname(b), "ko"));
    return '<div class="head fr"><h2>\uCE5C\uAD6C</h2><button class="who m-only" data-ov="log" aria-label="\uB0B4 \uD504\uB85C\uD544 \uC5F4\uAE30">' + meAv() + "<span>" + esc(D.me.name) + '</span></button><button class="ib" data-ov="find" aria-label="\uAC24\uB7EC\uB9AC \uAC80\uC0C9">' + I.search + '</button><button class="ib" data-ov="find" aria-label="\uAC24\uB7EC\uB9AC \uCD94\uAC00">' + I.plusGal + '</button><button class="ib d-only" data-refresh aria-label="\uC0C8\uB85C\uACE0\uCE68 (F5)" title="\uC0C8\uB85C\uACE0\uCE68 (F5)">' + I.refresh + "</button>" + cogM + '</div><div class="scroll" id="fscroll"><button class="adb m-only" data-url="https://blinkarea.synology.me/" aria-label="\uAD11\uACE0: \uBE14\uCE74\uC774\uBE0C \uC5F4\uAE30"><span class="tx"><b>\uBE14\uB799\uD551\uD06C\uC758 \uBAA8\uB4E0 \uAE30\uB85D, \uBE14\uCE74\uC774\uBE0C</b><span>\uC0AC\uC9C4\xB7\uC601\uC0C1\xB7\uC74C\uC6D0 \uAE30\uB85D\uC744 \uD55C\uACF3\uC5D0\uC11C</span><i>\uC9C0\uAE08 \uAD6C\uACBD\uD558\uAE30 \u203A</i></span><span class="logo"><b>\uBE14\uCE74\uC774\uBE0C</b><i>BLINK AREA</i></span><em>AD</em></button><div class="me">' + meAv() + "<span><b>" + esc(D.me.name) + "</b><span>" + esc(D.me.status) + '</span></span><button class="pill" data-ov="log">\uD504\uB85C\uD544</button></div>' + (favs.length ? '<div class="sec"><span>\uC990\uACA8\uCC3E\uAE30 &nbsp;' + favs.length + "</span>" + I.down + '</div><div class="favs">' + favs.map((g) => '<button class="fav" data-g="' + esc(key(g)) + '" data-lp="gal" title="' + esc(gname(g)) + '">' + (R.updated[key(g)] ? '<i class="dot"></i>' : "") + galAv(g) + "<span>" + esc(gname(g)) + "</span></button>").join("") + "</div>" : "") + (upd.length ? '<div class="upd"><div class="sec"><span>\uC5C5\uB370\uC774\uD2B8\uD55C \uCE5C\uAD6C &nbsp;' + upd.length + "</span>" + I.down + "</div>" + upd.map(row).join("") + "</div>" : "") + '<div class="sec" style="margin-top:6px"><span>\uCE5C\uAD6C &nbsp;' + D.gals.length + "</span>" + I.down + "</div>" + (all.length ? all.map(row).join("") : '<div class="empty">\uC544\uC9C1 \uCD94\uAC00\uD55C \uAC24\uB7EC\uB9AC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.<br><button class="pill" data-ov="find">\uAC24\uB7EC\uB9AC \uCD94\uAC00</button></div>') + "</div>";
  }
  var PLAIN = ["\uC804\uCCB4", "\uC548\uC77D\uC74C", "ChatGPT"];
  function chatsHtml() {
    const g = gal(R.g);
    if (!g) return '<div class="head"><h2>\uCC44\uD305 <small>\u25BC</small></h2>' + cogM + '</div><div class="empty">\uCE5C\uAD6C \uBAA9\uB85D\uC5D0\uC11C \uAC24\uB7EC\uB9AC\uB97C \uACE0\uB974\uBA74<br>\uAE00 \uBAA9\uB85D\uC774 \uC5EC\uAE30\uC5D0 \uB098\uC635\uB2C8\uB2E4.</div>';
    const L = R.list;
    if (L && (L.heads?.length || !R.hk[R.g])) R.hk[R.g] = L.heads || [];
    const heads = R.hk[R.g] || [], plain = !!R.hk[R.g] && !heads.length;
    const tabs = plain ? PLAIN.map((n) => ({ id: n === "\uC804\uCCB4" ? "" : n, name: n })) : [{ id: "", name: "\uC804\uCCB4" }, ...heads];
    const pins = (L?.posts || []).filter((p) => p.notice);
    let posts = L ? L.posts : [];
    if (plain && R.head === "\uC548\uC77D\uC74C") posts = posts.filter((p) => p.notice || unreadOf(p));
    if (plain && R.head === "ChatGPT") posts = posts.filter((p) => p.notice);
    if (R.filter) posts = posts.filter((p) => p.notice || p.title.includes(R.filter));
    const rowHtml = (p) => {
      const pi = pins.indexOf(p), n = unreadOf(p), author = who(p);
      const pv = p.notice ? p.title : R.pv[R.g + "/" + p.id] || (p.hasVideo ? "\uB3D9\uC601\uC0C1\uC744 \uBCF4\uB0C8\uC2B5\uB2C8\uB2E4." : p.hasImage ? "\uC0AC\uC9C4\uC744 \uBCF4\uB0C8\uC2B5\uB2C8\uB2E4." : author + " \xB7 \uC870\uD68C " + p.views.toLocaleString());
      return '<button class="row post' + (R.room && R.room.g === R.g && R.room.no === p.id ? " sel" : "") + '" data-p="' + p.id + '">' + (p.notice ? '<span class="av grid">' + [0, 1, 2, 3].map((i) => '<i style="background:' + COLORS[(hash(p.id) + i) % COLORS.length] + '"></i>').join("") + "</span>" : userAv(author)) + '<span class="tx"><b><span class="t">' + esc(p.notice ? noticeName(g, pi, p) : p.title) + "</span><small>" + (p.notice ? pins.length : p.comments) + "</small>" + (p.notice ? I.pin : "") + '</b><span class="pv">' + esc(pv) + '</span></span><span class="rt">' + listTime(p.time) + (n ? "<br><em>" + n + "</em>" : "") + "</span></button>";
    };
    const shownPins = posts.filter((p) => p.notice), allRest = posts.filter((p) => !p.notice), rest = allRest.slice(0, R.shown);
    R.hidden = allRest.length - rest.length;
    const body = !L ? R.listErr ? '<div class="empty">' + esc(R.listErr) + '<br><button class="pill" data-reload>\uB2E4\uC2DC \uC2DC\uB3C4</button></div>' : '<div class="spin">\uBD88\uB7EC\uC624\uB294 \uC911\u2026</div>' : (R.pinOpen ? shownPins : shownPins.slice(0, 1)).map(rowHtml).join("") + (shownPins.length > 1 ? '<button class="pintog" data-pintog aria-expanded="' + R.pinOpen + '" aria-label="' + (R.pinOpen ? "\uACF5\uC9C0 \uC811\uAE30" : "\uACF5\uC9C0 " + (shownPins.length - 1) + "\uAC1C \uB354 \uBCF4\uAE30") + '"></button>' : "") + (rest.length ? rest.map(rowHtml).join("") : '<div class="empty">\uC774 \uD0ED\uC5D0\uB294 \uC544\uC9C1 \uAE00\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.</div>') + (R.hidden > 0 || L.more && !(plain && R.head) ? '<button class="more-row" data-more>' + (R.listBusy ? "\uBD88\uB7EC\uC624\uB294 \uC911\u2026" : "\uC774\uC804 \uAE00 \uB354 \uBCF4\uAE30") + "</button>" : "");
    return '<div class="head"><h2>\uCC44\uD305 <small>\u25BC</small></h2><button class="ib' + (R.filterOn ? " act" : "") + '" data-filter aria-label="\uAE00 \uAC80\uC0C9">' + I.search + '</button><button class="ib" data-write aria-label="\uAE00\uC4F0\uAE30">' + I.write + '</button><button class="ib d-only" data-refresh aria-label="\uC0C8\uB85C\uACE0\uCE68 (F5)" title="\uC0C8\uB85C\uACE0\uCE68 (F5)">' + I.refresh + "</button>" + cogM + "</div>" + (R.filterOn ? '<div class="searchbar"><input id="filter" placeholder="\uBD88\uB7EC\uC628 \uAE00 \uC81C\uBAA9\uC5D0\uC11C \uCC3E\uAE30" value="' + esc(R.filter) + '"></div>' : "") + '<div class="chips" id="chips">' + tabs.map((t) => '<button class="chip' + (String(t.id) === String(R.head) ? " on" : "") + '" data-h="' + esc(t.id) + '">' + esc(t.name) + "</button>").join("") + '<button class="chip ico' + (R.pinOpen ? " on" : "") + '" data-pintog aria-pressed="' + R.pinOpen + '" aria-label="' + (R.pinOpen ? "\uACF5\uC9C0 \uC811\uAE30" : "\uACF5\uC9C0 \uBAA8\uB450 \uBCF4\uAE30") + '">' + I.listp + (!R.pinOpen && pins.length > 1 ? '<i class="cdot"></i>' : "") + '</button></div><div class="scroll" id="cscroll">' + body + "</div>";
  }
  function overlayHtml() {
    const x = '<button class="ib" data-ov="" aria-label="\uB2EB\uAE30">\u2715</button>';
    if (R.ov === "find") {
      const S = R.search;
      return '<div class="ov"><div class="head"><h2>\uAC24\uB7EC\uB9AC \uCD94\uAC00</h2>' + x + '</div><form class="searchbar" id="findf"><input id="findq" placeholder="\uAC24\uB7EC\uB9AC \uC774\uB984 \uAC80\uC0C9" maxlength="60" value="' + esc(S.q) + '"><button class="pill">\uAC80\uC0C9</button></form><div class="scroll">' + (S.busy ? '<div class="spin">\uCC3E\uB294 \uC911\u2026</div>' : S.err ? '<div class="empty">' + esc(S.err) + "</div>" : !S.res ? '<div class="empty">\uBCF4\uACE0 \uC2F6\uC740 \uAC24\uB7EC\uB9AC \uC774\uB984\uC744 \uAC80\uC0C9\uD574 \uCE5C\uAD6C\uB85C \uCD94\uAC00\uD558\uC138\uC694.</div>' : !S.res.length ? '<div class="empty">\uAC80\uC0C9 \uACB0\uACFC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.</div>' : S.res.map((g, i) => '<div class="row"><span class="av" style="background:' + hue(g.name) + '">' + esc([...g.name][0] || "?") + '</span><span class="tx"><b>' + esc(g.name) + '</b><span class="st">' + { normal: "\uAC24\uB7EC\uB9AC", minor: "\uB9C8\uC774\uB108 \uAC24\uB7EC\uB9AC", mini: "\uBBF8\uB2C8 \uAC24\uB7EC\uB9AC" }[g.type] + " \xB7 " + esc(g.id) + "</span></span>" + (gal(key(g)) ? '<span class="st">\uCD94\uAC00\uB428</span>' : '<button class="pill" data-add="' + i + '">\uCD94\uAC00</button>') + "</div>").join("")) + "</div></div>";
    }
    if (R.ov === "gmenu") {
      const g = gal(R.gmenu);
      if (!g) return "";
      const fav = D.favs.includes(R.gmenu);
      return '<div class="ov"><div class="head"><h2>' + esc(gname(g)) + "</h2>" + x + '</div><div class="scroll setlist"><button class="row" data-fav="' + esc(R.gmenu) + '"><span class="tx"><b>' + (fav ? "\uC990\uACA8\uCC3E\uAE30 \uD574\uC81C" : "\uC990\uACA8\uCC3E\uAE30 \uCD94\uAC00") + '</b></span></button><button class="row" data-gphoto="' + esc(R.gmenu) + '"><span class="tx"><b>' + (D.photos[R.gmenu] ? "\uD504\uB85C\uD544 \uC0AC\uC9C4 \uBC14\uAFB8\uAE30" : "\uD504\uB85C\uD544 \uC0AC\uC9C4 \uB123\uAE30") + "</b></span></button>" + (D.photos[R.gmenu] ? '<button class="row" data-gphotodel="' + esc(R.gmenu) + '"><span class="tx"><b>\uD504\uB85C\uD544 \uC0AC\uC9C4 \uC9C0\uC6B0\uAE30</b></span></button>' : "") + '<button class="row" data-open="' + esc(R.gmenu) + '"><span class="tx"><b>\uB514\uC2DC\uC5D0\uC11C \uC5F4\uAE30</b></span></button><button class="row" data-remove="' + esc(R.gmenu) + '"><span class="tx"><b>\uCE5C\uAD6C \uBAA9\uB85D\uC5D0\uC11C \uC0AD\uC81C</b></span></button></div></div>';
    }
    if (R.ov === "set") return settingsHtml(x);
    if (R.ov === "log") {
      const cur = R.gallog[R.log];
      const list = !R.userKnown ? '<div class="spin">\uB85C\uADF8\uC778 \uC0C1\uD0DC \uD655\uC778 \uC911\u2026</div>' : !R.user ? '<div class="empty">\uB85C\uADF8\uC778\uD558\uBA74 \uAC24\uB85C\uADF8\uAC00 \uC5EC\uAE30\uC5D0 \uB098\uC635\uB2C8\uB2E4.<br><button class="pill" data-login>\uB85C\uADF8\uC778</button></div>' : !cur || cur.busy ? '<div class="spin">\uBD88\uB7EC\uC624\uB294 \uC911\u2026</div>' : cur.err ? '<div class="empty">' + esc(cur.err) + '<br><button class="pill" data-log="' + R.log + '">\uB2E4\uC2DC \uC2DC\uB3C4</button></div>' : !cur.items.length ? '<div class="empty">' + (R.log === "\uBC29\uBA85\uB85D" ? "\uBC29\uBA85\uB85D\uC774 \uBE44\uC5B4 \uC788\uC2B5\uB2C8\uB2E4." : "\uD45C\uC2DC\uD560 " + R.log + "\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.") + "</div>" : R.log === "\uBC29\uBA85\uB85D" ? cur.items.map((v) => '<div class="row">' + userAv(v.name) + '<span class="tx"><b>' + esc(v.name) + '</b><span class="st">' + esc(v.text) + " \xB7 " + esc(v.date) + "</span></span></div>").join("") : cur.items.map((v, i) => '<button class="row" data-glog="' + i + '"><span class="tx"><b>' + esc(v.title) + '</b><span class="st">' + esc(v.sub) + "</span></span></button>").join("");
      return '<div class="ov"><div class="cover">' + x + meAv() + "<b>" + esc(D.me.name) + "</b><span>" + esc(D.me.status) + '</span></div><div class="chips logtabs">' + Object.keys(GALLOG).map((k) => '<button class="chip' + (k === R.log ? " on" : "") + '" data-log="' + k + '">' + k + "</button>").join("") + '</div><div class="scroll wrap">' + list + '</div><div class="acts"><button class="pill" data-ov="set" data-stab="\uD504\uB85C\uD544">\uD504\uB85C\uD544 \uD3B8\uC9D1</button></div></div>';
    }
    if (R.ov === "noti") return '<div class="ov"><div class="head"><h2>\uC54C\uB9BC</h2>' + (D.notis.length ? '<button class="pill" data-noticlear>\uBAA8\uB450 \uC9C0\uC6B0\uAE30</button>' : "") + x + '</div><div class="scroll wrap">' + (D.notis.length ? D.notis.map((n, i) => '<button class="row" data-noti="' + i + '">' + userAv(n.who) + '<span class="tx"><b>' + esc(n.head) + '</b><span class="st">' + esc(n.text) + '</span><span class="st">' + esc(n.title) + "</span></span></button>").join("") : '<div class="empty">\uC0C8 \uC54C\uB9BC\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.<br>' + (R.user ? "\uB0B4\uAC00 \uC4F4 \uAE00\uACFC \uB313\uAE00\uC5D0 \uC0C8 \uB313\uAE00\uC774 \uB2EC\uB9AC\uBA74 \uC5EC\uAE30\uC5D0 \uB098\uC635\uB2C8\uB2E4." : "\uB85C\uADF8\uC778\uD558\uBA74 \uB0B4 \uAE00\uACFC \uB313\uAE00\uC758 \uC0C8 \uB313\uAE00\uC744 \uC54C\uB824 \uB4DC\uB9BD\uB2C8\uB2E4.") + "</div>") + "</div></div>";
    if (R.ov === "con") return '<div class="ov"><div class="head"><h2>\uB514\uC2DC\uCF58</h2>' + x + '</div><div class="scroll cpanel">' + (consHtml() || '<div class="spin">\uB514\uC2DC\uCF58 \uBD88\uB7EC\uC624\uB294 \uC911\u2026</div>') + "</div></div>";
    return "";
  }
  var TABS = ["\uD504\uB85C\uD544", "\uACF5\uC9C0 \uCC44\uD305\uBC29 \uC774\uB984", "\uACC4\uC815", "\uC815\uBCF4"];
  function settingsHtml(x) {
    if (!R.stab) {
      const custom = D.rooms.filter((r) => r.mode === "custom" && r.text).length;
      const sum = { "\uD504\uB85C\uD544": D.me.name + (D.me.status ? " \xB7 " + D.me.status : ""), "\uACF5\uC9C0 \uCC44\uD305\uBC29 \uC774\uB984": "\uC9C1\uC811 \uC785\uB825 " + custom + "\uAC1C \xB7 \uB79C\uB364 " + (D.rooms.length - custom) + "\uAC1C", "\uACC4\uC815": !R.userKnown ? "\uD655\uC778 \uC911\u2026" : R.user ? "\uB85C\uADF8\uC778\uB428" : "\uB85C\uADF8\uC778\uD558\uC9C0 \uC54A\uC74C", "\uC815\uBCF4": "\uC591\uC9C0\uD1A1 " + (native.version || "") };
      return '<div class="ov"><div class="head"><h2>\uC124\uC815</h2>' + x + '</div><div class="scroll setlist">' + TABS.map((t) => '<button class="row" data-stab="' + t + '"><span class="tx"><b>' + t + '</b><span class="st">' + esc(sum[t]) + "</span></span>" + I.next + "</button>").join("") + "</div></div>";
    }
    const body = R.stab === "\uD504\uB85C\uD544" ? '<div class="photoset">' + meAv() + '<button type="button" class="pill" data-mephoto>' + (D.me.photo ? "\uC0AC\uC9C4 \uBC14\uAFB8\uAE30" : "\uC0AC\uC9C4 \uACE0\uB974\uAE30") + "</button>" + (D.me.photo ? '<button type="button" class="pill" data-mephotodel>\uC0AC\uC9C4 \uC9C0\uC6B0\uAE30</button>' : "") + '</div><label>\uC774\uB984<input name="name" maxlength="20" value="' + esc(D.me.name) + '"></label><label>\uC0C1\uD0DC\uBA54\uC2DC\uC9C0<input name="status" maxlength="40" value="' + esc(D.me.status) + '"></label><p>\uCE5C\uAD6C \uD654\uBA74 \uB9E8 \uC704 \uB0B4 \uD504\uB85C\uD544\uC5D0 \uD45C\uC2DC\uB418\uB294 \uBB38\uAD6C\uC785\uB2C8\uB2E4.</p>' : R.stab === "\uACF5\uC9C0 \uCC44\uD305\uBC29 \uC774\uB984" ? D.rooms.map((r, i) => '<div class="slot"><span>' + (i + 1) + '</span><select name="m' + i + '" aria-label="\uACF5\uC9C0 ' + (i + 1) + ' \uC774\uB984 \uBC29\uC2DD"><option value="random"' + (r.mode === "random" ? " selected" : "") + '>\uB79C\uB364 \uC774\uB984</option><option value="custom"' + (r.mode === "custom" ? " selected" : "") + '>\uC9C1\uC811 \uC785\uB825</option></select><input name="t' + i + '" maxlength="30" placeholder="\uC608: \uB300\uD559 \uB3D9\uAE30 \uBAA8\uC784" aria-label="\uACF5\uC9C0 ' + (i + 1) + ' \uC774\uB984" value="' + esc(r.text) + '"' + (r.mode === "custom" ? "" : " disabled") + "></div>").join("") + "<p>\uAC24\uB7EC\uB9AC\uB9C8\uB2E4 \uC704\uC5D0\uC11C\uBD80\uD130 1\uBC88\uC9F8, 2\uBC88\uC9F8 \uACF5\uC9C0\uC5D0 \uCC28\uB840\uB85C \uC801\uC6A9\uB429\uB2C8\uB2E4. \uC9C1\uC811 \uC785\uB825 \uCE78\uC774 \uBE44\uC5B4 \uC788\uC73C\uBA74 \uB79C\uB364 \uC774\uB984\uC774 \uC4F0\uC785\uB2C8\uB2E4.</p>" : R.stab === "\uACC4\uC815" ? "<p>" + (!R.userKnown ? "\uB85C\uADF8\uC778 \uC0C1\uD0DC\uB97C \uD655\uC778\uD558\uB294 \uC911\uC785\uB2C8\uB2E4\u2026" : R.user ? "\uB85C\uADF8\uC778\uB428: " + esc(R.user) : "\uB85C\uADF8\uC778\uD558\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.") + '</p><p>\uB85C\uADF8\uC778\uC740 \uB514\uC2DC\uC778\uC0AC\uC774\uB4DC \uACF5\uC2DD \uB85C\uADF8\uC778 \uD654\uBA74\uC5D0\uC11C \uC9C1\uC811 \uD569\uB2C8\uB2E4. \uC591\uC9C0\uD1A1\uC740 \uBE44\uBC00\uBC88\uD638\uB97C \uC800\uC7A5\uD558\uC9C0\uB3C4, \uBCFC \uC218\uB3C4 \uC5C6\uC2B5\uB2C8\uB2E4.</p><div class="savebar">' + (R.user ? '<button type="button" class="pill" data-logout>\uB85C\uADF8\uC544\uC6C3</button>' : '<button type="button" class="save" data-login>\uB85C\uADF8\uC778</button>') + "</div>" : "<p>\uC591\uC9C0\uD1A1 " + esc(native.version || "") + "</p><p>\uB514\uC2DC\uC778\uC0AC\uC774\uB4DC\uB97C \uBA54\uC2E0\uC800 \uD654\uBA74\uC73C\uB85C \uBCF4\uB294 \uBE44\uACF5\uC2DD \uC5F4\uB78C \uC571\uC785\uB2C8\uB2E4. \uB514\uC2DC\uC778\uC0AC\uC774\uB4DC\uC640 \uAD00\uB828\uC774 \uC5C6\uC73C\uBA70, \uAC8C\uC2DC\uBB3C\uACFC \uCCA8\uBD80\uBB3C\uC758 \uAD8C\uB9AC\uB294 \uAC01 \uC791\uC131\uC790\uC5D0\uAC8C \uC788\uC2B5\uB2C8\uB2E4.</p>";
    return '<div class="ov"><div class="head"><button type="button" class="ib bk" data-stab="" aria-label="\uC124\uC815 \uBAA9\uB85D\uC73C\uB85C">' + I.back + "</button><h2>" + R.stab + "</h2>" + x + '</div><form id="setf" class="setf">' + body + (R.stab === "\uC815\uBCF4" || R.stab === "\uACC4\uC815" ? "" : '<div class="savebar"><span role="status">' + (R.saved ? "\uC800\uC7A5\uD588\uC2B5\uB2C8\uB2E4." : "") + '</span><button class="save">\uD655\uC778</button></div>') + "</form></div>";
  }
  function renderPane() {
    const keep = { f: $("#fscroll")?.scrollTop || 0, c: $("#cscroll")?.scrollTop || 0, ch: $("#chips")?.scrollLeft || 0, fv: $("#pane .favs")?.scrollLeft || 0 };
    $("#pane").innerHTML = (R.view === "friends" ? friendsHtml() : chatsHtml()) + overlayHtml();
    if ($("#fscroll")) $("#fscroll").scrollTop = keep.f;
    if ($("#cscroll")) $("#cscroll").scrollTop = keep.c;
    if ($("#chips")) $("#chips").scrollLeft = keep.ch;
    if ($("#pane .favs")) $("#pane .favs").scrollLeft = keep.fv;
    renderRail();
    previews();
  }
  var pvBusy = /* @__PURE__ */ new Set();
  var PVLS = "yangjitalk-pv";
  Object.assign(R.pv, JSON.parse(localStorage.getItem(PVLS) || "{}"));
  var savePv = () => {
    const e = Object.entries(R.pv).filter((x) => x[1]);
    localStorage.setItem(PVLS, JSON.stringify(Object.fromEntries(e.slice(-600))));
  };
  var pvRunning = false;
  async function previews() {
    if (R.view !== "chats" || !R.list || R.ov || pvRunning || Date.now() < pvPause) return;
    const gk = R.g, g = gal(gk);
    const todo = [...document.querySelectorAll("#cscroll .row.post[data-p]")].map((b) => +b.dataset.p).filter((no) => {
      const k = gk + "/" + no, p = R.list.posts.find((x) => x.id === no);
      return p && !p.notice && R.pv[k] == null && !pvBusy.has(k);
    });
    for (const no of todo) pvBusy.add(gk + "/" + no);
    if (!todo.length) return;
    pvRunning = true;
    const work = async () => {
      for (let no; (no = todo.shift()) != null; ) {
        const k = gk + "/" + no;
        if (R.g === gk && Date.now() >= pvPause) try {
          await new Promise((r) => setTimeout(r, 1400));
          const post = await dc.readPost(g, no), t = post.blocks.find((b) => b.t === "text");
          R.pc[k] = { post, at: Date.now() };
          R.pv[k] = t ? t.v.replace(/\s+/g, " ").slice(0, 120) : post.blocks.some((b) => b.t === "video" || b.t === "embed") ? "\uB3D9\uC601\uC0C1\uC744 \uBCF4\uB0C8\uC2B5\uB2C8\uB2E4." : post.blocks.length ? "\uC0AC\uC9C4\uC744 \uBCF4\uB0C8\uC2B5\uB2C8\uB2E4." : "";
          const el = document.querySelector('#cscroll .row.post[data-p="' + no + '"] .pv');
          if (el && R.g === gk && R.view === "chats" && R.pv[k]) el.textContent = R.pv[k];
        } catch (e) {
          if (e.code === "BUSY") pvPause = Date.now() + 6e4;
          else R.pv[k] = "";
        }
        pvBusy.delete(k);
      }
    };
    await work();
    pvRunning = false;
    savePv();
    if (R.g !== gk || document.querySelector("#cscroll .row.post")) setTimeout(previews, 50);
  }
  var moreHold = 0;
  function showMore(auto) {
    if (R.hidden > 0) {
      R.shown += 10;
      renderPane();
    } else if (auto && Date.now() < Math.max(moreHold, pvPause)) return;
    else if (R.list?.more && !R.listBusy && !(!R.list.heads.length && R.head)) {
      R.shown += 10;
      loadList({ append: true });
    }
  }
  document.addEventListener("scroll", (e) => {
    const t = e.target;
    if (t.id === "cscroll" && t.scrollTop + t.clientHeight > t.scrollHeight - 200) showMore(true);
  }, true);
  var linkify = (t) => t.split(/(https?:\/\/[^\s<>"']+)/).map((s2, i) => i % 2 ? '<a class="lk" href="' + esc(s2) + '" data-url="' + esc(s2) + '">' + esc(s2) + "</a>" : esc(s2)).join("");
  var bub = (t, q = "") => '<div class="bub">' + q + linkify(t) + (t.length > 280 || t.split("\n").length > 8 ? '<div class="more" aria-hidden="true"><span>\uC804\uCCB4\uBCF4\uAE30</span>' + I.next + "</div>" : "") + "</div>";
  var conVideo = (src, alt) => '<video class="dcon1" autoplay loop muted playsinline src="' + esc(src) + '" aria-label="' + esc(alt || "\uB514\uC2DC\uCF58") + '"></video>';
  document.addEventListener("error", (e) => {
    const n = e.target;
    if (n.tagName === "IMG" && n.classList.contains("dcon1") && n.isConnected) n.outerHTML = conVideo(n.dataset.mp4 || n.src, n.alt);
  }, true);
  function blockHtml(b, q = "") {
    if (b.t === "text") return bub(b.v, q);
    if (b.t === "img") return '<img class="media" loading="lazy" src="' + esc(b.src) + '" alt="' + esc(b.alt || "\uBCF8\uBB38 \uC0AC\uC9C4") + '" data-zoom>';
    if (b.t === "txtcon") return '<div class="tcon" style="' + tstyle(b.v, b.bg, b.fg) + '">' + esc(b.v) + "</div>";
    if (b.t === "dccon") return b.video ? conVideo(b.src, b.alt) : '<img class="dcon1" loading="lazy" src="' + esc(b.src) + '"' + (b.mp4 ? ' data-mp4="' + esc(b.mp4) + '"' : "") + ' alt="' + esc(b.alt || "\uB514\uC2DC\uCF58") + '">';
    if (b.t === "video") return '<video class="media" controls preload="none" src="' + esc(b.src) + '"' + (b.poster ? ' poster="' + esc(b.poster) + '"' : "") + "></video>";
    return '<button class="embed" data-url="' + esc(b.src) + '">\uB3D9\uC601\uC0C1\xB7\uC678\uBD80 \uCF58\uD150\uCE20 \uC5F4\uAE30</button>';
  }
  function renderRoom(keep) {
    if (R.write) return renderWrite();
    const el = $("#room"), r = R.room;
    if (!r) {
      el.innerHTML = "";
      $("#app").classList.remove("in-room");
      return;
    }
    const g = gal(r.g), p = r.post, meta = r.meta, top = keep ? $("#rscroll")?.scrollTop || 0 : 0, draft = keep ? $("#room textarea")?.value || "" : "";
    el.className = "room";
    $("#app").classList.add("in-room");
    const title = meta.notice ? noticeName(g, r.pinIdx, meta) : meta.title, author = who(p || meta);
    let h = "";
    if (p) {
      const merged = [];
      for (const b of p.blocks) {
        const l = merged[merged.length - 1];
        if (b.t === "text" && l && l.t === "text") l.v += "\n" + b.v;
        else merged.push({ ...b });
      }
      const msgs = merged.map((b) => ({ w: author, b, d: parseTime(p.time) }));
      msgs.push({ sys: "\uB313\uAE00 " + (r.total ?? p.commentCount) + "\uAC1C" });
      const byId = new Map((r.comments || []).map((c) => [c.id, c]));
      for (const c of r.comments || []) {
        const par = c.parentId && byId.get(c.parentId);
        const q = par ? '<div class="q"><b>' + esc(who(par)) + "\uC5D0\uAC8C \uB2F5\uC7A5</b><span>" + esc(par.blocks.map((b) => b.t === "text" ? b.v : b.t === "dccon" ? "(\uB514\uC2DC\uCF58)" : "(\uC0AC\uC9C4)").join(" ")) + "</span></div>" : "";
        c.blocks.forEach((b, i) => msgs.push({ w: who(c), b, d: parseTime(c.time), q: i === 0 ? q : "", mine: c.mine, c, lastBlock: i === c.blocks.length - 1, isAuthor: !!p.uid && c.uid === p.uid || !p.uid && !c.uid && c.ip && c.ip === p.ip && c.name === p.name }));
      }
      const myPost = !!R.user && p.uid === R.user;
      let day = "";
      msgs.forEach((m, i) => {
        if (m.sys) {
          h += '<div class="sys"><span>' + esc(m.sys) + "</span></div>";
          return;
        }
        if (m.d && dayKey(m.d) !== day) {
          day = dayKey(m.d);
          h += '<div class="sys"><span>' + dayLabel(m.d) + "</span></div>";
        }
        const prev = msgs[i - 1], next = msgs[i + 1], first = !prev || prev.sys || prev.w !== m.w || prev.mine !== m.mine, last = !next || next.sys || next.w !== m.w;
        const body = m.q && m.b.t !== "text" ? bub("", m.q) + '</div><div class="ln blk">' + blockHtml(m.b) : blockHtml(m.b, m.q || "");
        const lp2 = m.c ? m.c.deleted ? "" : ' data-lp="msg" data-cid="' + m.c.id + '"' : myPost ? ' data-lp="msg" data-cid="body"' : "";
        const menu = m.c ? R.menu === m.c.id && m.lastBlock ? '<button class="delbtn edit" data-reply="' + m.c.id + '">\uB2F5\uC7A5</button>' + (m.c.mine || myPost ? '<button class="delbtn" data-cdel="' + m.c.id + '">\uC0AD\uC81C</button>' : "") : "" : R.menu === "body" && i === merged.length - 1 ? '<button class="delbtn edit" data-pedit>\uC218\uC815</button><button class="delbtn" data-postdel>' + (R.ask ? "\uC815\uB9D0 \uC0AD\uC81C" : "\uC0AD\uC81C") + "</button>" : "";
        const ln = '<div class="ln"' + lp2 + ">" + body + menu + (last && m.d ? '<span class="tm">' + clock(m.d) + "</span>" : "") + "</div>";
        h += m.mine ? '<div class="m mine' + (first ? " first" : "") + '"><div class="col">' + ln + "</div></div>" : '<div class="m' + (first ? " first" : "") + '"><div class="avc">' + (first ? userAv(m.w) : "") + '</div><div class="col">' + (first ? '<div class="nm">' + esc(m.w) + (i < merged.length || m.isAuthor ? "<i>\uAE00\uC4F4\uC774</i>" : "") + "</div>" : "") + ln + "</div></div>";
      });
      if (r.cerr) h += '<div class="sys err"><span>' + esc(r.cerr) + "</span></div>";
      else if (!r.comments) h += '<div class="sys"><span>\uB313\uAE00 \uBD88\uB7EC\uC624\uB294 \uC911\u2026</span></div>';
      else if (r.total > r.comments.length && !r.noMore) h += '<div class="sys"><button data-cmore>' + (r.cbusy ? "\uBD88\uB7EC\uC624\uB294 \uC911\u2026" : "\uB313\uAE00 \uB354 \uBCF4\uAE30") + "</button></div>";
    } else h = r.err ? '<div class="sys err"><span>' + esc(r.err) + '</span></div><div class="sys"><button data-rreload>\uB2E4\uC2DC \uC2DC\uB3C4</button></div>' : '<div class="sys"><span>\uBD88\uB7EC\uC624\uB294 \uC911\u2026</span></div>';
    const people = p ? (/* @__PURE__ */ new Set([author, ...(r.comments || []).map(who)])).size : 1;
    el.innerHTML = '<div class="rhead"><button class="ib back" data-back aria-label="\uBAA9\uB85D\uC73C\uB85C">' + I.back + "</button>" + userAv(author) + '<span class="tt"><b>' + esc(title) + "</b><span>" + esc(gname(g)) + " \xB7 \uCC38\uC5EC " + people + '\uBA85</span></span><button class="ib" data-rreload aria-label="\uC0C8\uB85C\uACE0\uCE68">' + I.refresh + '</button><button class="ib" data-url="' + esc(postUrl(g, r.no)) + '" aria-label="\uB514\uC2DC\uC5D0\uC11C \uC5F4\uAE30">' + I.menu + "</button></div>" + (R.nfold ? '<button class="nmini" data-nfold aria-label="\uACF5\uC9C0 \uD3BC\uCE58\uAE30">' + I.horn + "</button>" : '<div class="notice">' + I.horn + '<span class="tx"><div>' + ((p || meta).head ? "[" + esc((p || meta).head) + "] " : "") + esc(meta.title) + "</div><div>" + esc(author) + " \xB7 \uC870\uD68C " + ((p || meta).views || 0).toLocaleString() + " \xB7 \uCD94\uCC9C " + ((p || meta).up || 0) + '</div></span><button class="nbtn" data-nfold aria-label="\uACF5\uC9C0 \uC811\uAE30">' + I.up + "</button></div>") + '<div class="scroll" id="rscroll"><div class="msgs">' + h + "</div></div>" + (R.cpanel ? '<div class="cpanel">' + consHtml() + "</div>" : "") + (R.tpanel ? txtconHtml() : "") + (R.reply ? '<div class="replybar"><span>' + esc(who(R.reply)) + '\uC5D0\uAC8C \uB2F5\uC7A5</span><button class="ib" data-noreply aria-label="\uB2F5\uC7A5 \uCDE8\uC18C">\u2715</button></div>' : "") + '<form class="inp" id="cform"><textarea placeholder="\uBA54\uC2DC\uC9C0 \uC785\uB825" aria-label="\uB313\uAE00 \uC785\uB825" maxlength="200">' + esc(draft) + '</textarea><div class="bar"><button type="button" class="ib" data-url="' + esc(mView(g, r.no)) + '" aria-label="\uB514\uC2DC \uD654\uBA74\uC5D0\uC11C \uC5F4\uAE30">' + I.plus + '</button><button type="button" class="ib' + (R.cpanel ? " act" : "") + '" data-cpanel aria-expanded="' + R.cpanel + '" aria-label="\uB514\uC2DC\uCF58">' + I.smile + '</button><button type="button" class="ib' + (R.tpanel ? " act" : "") + '" data-tpanel aria-expanded="' + R.tpanel + '" aria-label="\uAE00\uC790\uCF58">' + I.file + '</button><span></span><button class="send' + (draft.trim() && !R.sending ? " ok" : "") + '"' + (R.sending ? " disabled" : "") + ">" + (R.sending ? "\uBCF4\uB0B4\uB294 \uC911\u2026" : "\uC804\uC1A1") + "</button></div></form>";
    const sc = $("#rscroll");
    if (R.toBottom) {
      sc.scrollTop = sc.scrollHeight;
      R.toBottom = false;
    } else sc.scrollTop = top;
  }
  var postUrl = (g, no) => "https://gall.dcinside.com/" + (g.type === "minor" ? "mgallery/" : g.type === "mini" ? "mini/" : "") + "board/view/?id=" + g.id + "&no=" + no;
  var TBG = ["3b4890", "b4b4e1", "f5e1f0", "d2f0e6", "ffffff", "333333"];
  var TFG = ["ffffff", "333333"];
  function tstyle(t, bg, fg) {
    const n = [...String(t)].length;
    return "background:#" + bg + ";color:#" + fg + ";font-size:" + (n <= 2 ? 44 : n <= 4 ? 30 : n <= 8 ? 22 : n <= 12 ? 18 : 15) + "px";
  }
  function consHtml() {
    const C = R.cons;
    if (C.busy) return '<div class="spin">\uB514\uC2DC\uCF58 \uBD88\uB7EC\uC624\uB294 \uC911\u2026</div>';
    if (C.err) return '<p class="hint">' + esc(C.err) + "</p>";
    if (!C.items) return "";
    if (!C.items.length) return '<p class="hint">' + esc(C.note || (R.user ? "\uC0AC\uC6A9\uD560 \uC218 \uC788\uB294 \uB514\uC2DC\uCF58\uC774 \uC5C6\uC2B5\uB2C8\uB2E4." : "\uB514\uC2DC\uCF58\uC740 \uB85C\uADF8\uC778 \uD6C4 \uC0AC\uC6A9\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.")) + "</p>";
    return '<div class="cons">' + C.items.map((c, i) => '<button class="con' + (i === R.con1 ? " sel" : "") + '" data-con="' + i + '" data-lp="con" aria-label="' + esc(c.alt || "\uB514\uC2DC\uCF58") + '"><img loading="lazy" src="' + esc(c.src) + '" alt=""></button>').join("") + '</div><p class="hint">' + (R.con1 != null ? "\uD558\uB098\uB97C \uACE8\uB790\uC2B5\uB2C8\uB2E4. \uB2E4\uB978 \uB514\uC2DC\uCF58\uC744 \uB204\uB974\uBA74 2\uAC1C\uAC00 \uC88C\uC6B0\uB85C \uD568\uAED8 \uC62C\uB77C\uAC11\uB2C8\uB2E4." : "\uB204\uB974\uBA74 1\uAC1C \uB4F1\uB85D \xB7 \uAFB9 \uB204\uB978 \uB4A4 \uB2E4\uB978 \uB514\uC2DC\uCF58\uC744 \uB204\uB974\uBA74 \uB354\uBE14\uCF58") + "</p>";
  }
  function txtconHtml() {
    return '<div class="cpanel tpanel"><div class="tcon" id="tcprev" style="' + tstyle(R.tcon, D.tbg, D.tfg) + '">' + esc(R.tcon) + '</div><div class="tcolors"><span>\uBC30\uACBD\uC0C9</span>' + TBG.map((c) => '<button type="button" class="sw' + (c === D.tbg ? " on" : "") + '" data-tbg="' + c + '" style="background:#' + c + '" aria-label="\uBC30\uACBD\uC0C9 ' + c + '" aria-pressed="' + (c === D.tbg) + '"></button>').join("") + "<i></i><span>\uAE00\uC790\uC0C9</span>" + TFG.map((c) => '<button type="button" class="sw' + (c === D.tfg ? " on" : "") + '" data-tfg="' + c + '" style="background:#' + c + '" aria-label="\uAE00\uC790\uC0C9 ' + c + '" aria-pressed="' + (c === D.tfg) + '"></button>').join("") + "</div>" + (D.trecent.length ? '<div class="trecent">' + D.trecent.map((t) => '<button type="button" data-tuse="' + esc(t) + '">' + esc(t) + "</button>").join("") + '<button type="button" class="tclr" data-tclear>\uC0AD\uC81C</button></div>' : "") + '<div class="trow"><input id="tcin" maxlength="20" placeholder="\uAE00\uC790\uCF58 \uB0B4\uC6A9 \uC785\uB825 (\uCD5C\uB300 20\uC790)" aria-label="\uAE00\uC790\uCF58 \uB0B4\uC6A9" value="' + esc(R.tcon) + '"><button type="button" class="pub" data-tsend>\uB4F1\uB85D</button></div></div>';
  }
  async function loadCons() {
    const g = gal(R.room?.g || R.g) || D.gals[0], no = R.room?.no || R.latest[key(g)]?.id, C = R.cons;
    if (!g || !no || C.busy) return;
    C.busy = true;
    C.err = "";
    renderRoom(true);
    if (R.ov === "con") renderPane();
    const r = await drive("dcconList", {}, mView(g, no));
    C.busy = false;
    if (r.error) {
      C.err = r.error;
      C.items = null;
    } else {
      C.items = r.items;
      C.note = r.note;
      if (r.user != null) {
        R.user = r.user;
        R.userKnown = true;
      }
    }
    renderRoom(true);
    if (R.ov === "con") renderPane();
  }
  async function drive(name, args, url, opt) {
    try {
      return await native.drive(url, script(name, args), opt) || { error: "\uC751\uB2F5\uC774 \uC5C6\uC2B5\uB2C8\uB2E4." };
    } catch (e) {
      return { error: e.message };
    }
  }
  async function checkUser() {
    const r = await drive("state", {}, mList({ id: "dcbest", type: "normal" }));
    if (!r.error) {
      R.user = r.user || "";
      R.userKnown = true;
    }
    if (R.ov === "set" || R.ov === "log") renderPane();
    if (R.ov === "log" && R.user && !R.gallog[R.log]) loadGallog();
    return R.user;
  }
  async function login() {
    await native.official(LOGIN_URL, { closeOn: LOGIN_DONE });
    R.cons.items = null;
    R.gallog = {};
    await checkUser();
    if (R.user) toast("\uB85C\uADF8\uC778\uD588\uC2B5\uB2C8\uB2E4.");
    return !!R.user;
  }
  async function withAuth(name, args, url, opt) {
    let r = await drive(name, args, url, opt);
    if (r.need === "login") {
      toast("\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD574 \uB514\uC2DC \uB85C\uADF8\uC778 \uD654\uBA74\uC744 \uC5FD\uB2C8\uB2E4.");
      if (await login()) r = await drive(name, args, url, opt);
      else return { error: "\uB85C\uADF8\uC778\uD558\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4." };
    }
    if (r.need === "captcha") {
      toast("\uBCF4\uC548 \uBB38\uC790 \uC785\uB825\uC774 \uD544\uC694\uD574 \uB514\uC2DC \uD654\uBA74\uC744 \uC5FD\uB2C8\uB2E4.");
      await native.official(url);
      return { manual: true, error: "\uB514\uC2DC \uD654\uBA74\uC5D0\uC11C \uC9C1\uC811 \uB9C8\uBB34\uB9AC\uD574 \uC8FC\uC138\uC694. \uCC98\uB9AC\uB410\uB294\uC9C0\uB294 \uC0C8\uB85C\uACE0\uCE68\uD558\uBA74 \uBCF4\uC785\uB2C8\uB2E4." };
    }
    if (r.need) return { error: "\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." };
    return r;
  }
  async function sendToRoom(name, args) {
    const room = R.room;
    if (!room || R.sending) return false;
    R.sending = true;
    renderRoom(true);
    const r = await withAuth(name, { ...args, parentNo: R.reply?.id || "" }, mView(gal(room.g), room.no));
    R.sending = false;
    if (R.room !== room) return false;
    if (r.manual) {
      await openPost(room.no, true);
      return false;
    }
    if (!r.ok) {
      toast(r.error || "\uBCF4\uB0B4\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.");
      renderRoom(true);
      return false;
    }
    R.reply = null;
    R.toBottom = true;
    await openPost(room.no, true);
    return true;
  }
  async function removeComment(id) {
    const room = R.room;
    R.menu = null;
    renderRoom(true);
    const r = await withAuth("delComment", { no: id }, mView(gal(room.g), room.no));
    if (r.ok) {
      toast("\uB313\uAE00\uC744 \uC0AD\uC81C\uD588\uC2B5\uB2C8\uB2E4.");
      if (R.room === room) openPost(room.no, true);
    } else toast(r.error || "\uC0AD\uC81C\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.");
  }
  async function removePost() {
    const room = R.room, g = room.g;
    R.menu = null;
    R.ask = false;
    renderRoom(true);
    const r = await withAuth("delPost", {}, mView(gal(g), room.no));
    if (r.ok) {
      toast("\uAE00\uC744 \uC0AD\uC81C\uD588\uC2B5\uB2C8\uB2E4.");
      if (R.room === room) {
        R.room = null;
        R.roomSeq++;
        renderRoom();
      }
      delete R.cache[g + "|"];
      if (R.g === g) loadList({ fresh: true });
    } else toast(r.error || "\uC0AD\uC81C\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.");
  }
  var GALLOG = { "\uAC8C\uC2DC\uAE00": "G_all", "\uB313\uAE00": "R_all", "\uC2A4\uD06C\uB7A9": "B", "\uBC29\uBA85\uB85D": "U" };
  async function loadGallog() {
    if (!R.user || R.gallog[R.log]?.busy) return;
    const tab = R.log, box = R.gallog;
    box[tab] = { busy: true };
    renderPane();
    const r = await drive("gallog", { menu: GALLOG[tab] }, mGallog(R.user, GALLOG[tab]));
    box[tab] = r.error ? { err: r.error } : { items: r.items || [] };
    if (R.ov === "log") renderPane();
  }
  async function jump(v) {
    if (!v.id && v.code) {
      toast("\uAE00\uC744 \uC5EC\uB294 \uC911\u2026");
      const r = await drive("gallId", { code: v.code, type: v.type }, mGallog(R.user, ""));
      if (!r.id) {
        toast(r.error || "\uAE00\uC744 \uC5F4\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.");
        return;
      }
      v.id = r.id;
    }
    if (v.person) {
      native.open("https://m.dcinside.com/person/" + v.id + "/" + v.no);
      return;
    }
    const g = D.gals.find((x) => x.id === v.id && x.type === "mini" === !!v.mini);
    if (!g) {
      native.open("https://m.dcinside.com/" + (v.mini ? "mini" : "board") + "/" + v.id + "/" + v.no);
      return;
    }
    await openGallery(key(g));
    openPost(v.no, false, { id: v.no, title: v.orig || v.title || "", notice: false, head: "", name: "", uid: "", ip: "", comments: 0, views: 0, up: 0 });
  }
  function watch(gk, no, title, count, mine) {
    const old = D.watch.find((w) => w.g === gk && w.no === no);
    if (old) {
      old.count = count;
      old.mine = old.mine || mine;
    } else {
      D.watch.unshift({ g: gk, no, title, count, mine });
      D.watch.length = Math.min(D.watch.length, 20);
    }
    save();
  }
  var polling = false;
  async function poll() {
    if (polling || !R.user) return;
    polling = true;
    for (const w of D.watch.slice(0, 5)) {
      const g = gal(w.g);
      if (!g) continue;
      if (Date.now() < pvPause) break;
      try {
        await new Promise((r) => setTimeout(r, 1500));
        const post = await dc.readPost(g, w.no);
        await new Promise((r) => setTimeout(r, 1500));
        const cm = await dc.readComments(g, w.no, post.token, 1);
        if (cm.total > w.count) {
          const mineIds = new Set(cm.comments.filter((c) => c.mine).map((c) => c.id));
          for (const c of cm.comments.filter((c2) => !c2.mine && !c2.deleted).slice(-(cm.total - w.count))) {
            const toMe = c.parentId && mineIds.has(c.parentId);
            if (!w.mine && !toMe) continue;
            D.notis.unshift({ g: w.g, no: w.no, id: g.id, mini: g.type === "mini", title: w.title, who: who(c), head: who(c) + (toMe ? "\uB2D8\uC774 \uB2F5\uAE00\uC744 \uB0A8\uACBC\uC2B5\uB2C8\uB2E4" : "\uB2D8\uC774 \uB313\uAE00\uC744 \uB0A8\uACBC\uC2B5\uB2C8\uB2E4"), text: c.blocks.map((b) => b.t === "text" ? b.v : b.t === "img" ? "(\uC0AC\uC9C4)" : "(\uB514\uC2DC\uCF58)").join(" ").slice(0, 100), read: false });
          }
          D.notis.length = Math.min(D.notis.length, 50);
          w.count = cm.total;
          save();
          renderRail();
          if (R.ov === "noti") renderPane();
        }
      } catch (e) {
        if (e.code === "BUSY") break;
      }
    }
    polling = false;
  }
  setTimeout(poll, 9e4);
  setInterval(poll, 6e5);
  function renderWrite() {
    const el = $("#room"), w = R.write, g = gal(w.g), heads = R.list?.heads || [];
    el.className = "room";
    $("#app").classList.add("in-room");
    const blk = (x) => typeof x === "string" ? bub(x) : x.video ? '<video class="media" src="' + x.url + '" controls aria-label="' + esc(x.name) + '"></video>' : '<img class="media" src="' + x.url + '" alt="' + esc(x.name) + '">';
    el.innerHTML = '<div class="rhead"><button class="ib back" data-wcancel aria-label="\uAE00\uC4F0\uAE30 \uB2EB\uAE30">' + I.back + "</button>" + meAv() + '<span class="tt"><b>\uC0C8 \uAE00</b><span>' + esc(gname(g)) + '\uC5D0 \uC62C\uB9AC\uAE30</span></span><button class="pub" data-pub' + (w.busy ? " disabled" : "") + ">" + (w.busy ? "\uB4F1\uB85D \uC911\u2026" : "\uB4F1\uB85D") + '</button></div><div class="wtitle"><label for="wtitle">\uC81C\uBAA9</label>' + (heads.length ? '<select id="whead" aria-label="\uB9D0\uBA38\uB9AC">' + heads.map((h) => '<option value="' + esc(h.id) + '"' + (String(h.id) === String(w.head) ? " selected" : "") + ">" + esc(h.name) + "</option>").join("") + "</select>" : "") + '<input id="wtitle" maxlength="40" placeholder="\uC81C\uBAA9 \uC785\uB825" aria-label="\uC81C\uBAA9" value="' + esc(w.title) + '"></div><div class="scroll" id="wscroll"><div class="msgs">' + (w.blocks.length ? '<div class="m first"><div class="avc">' + meAv() + '</div><div class="col"><div class="nm">' + esc(D.me.name) + "<i>\uAE00\uC4F4\uC774</i></div>" + w.blocks.map((x, i) => '<div class="ln blk">' + blk(x) + '<button class="del" data-del="' + i + '" aria-label="\uC774 \uB9D0\uD48D\uC120 \uC0AD\uC81C">\u2715</button></div>').join("") + "</div></div>" : '<div class="sys"><span>\uC544\uB798\uC5D0 \uC4F0\uACE0 \uC804\uC1A1\uD558\uBA74 \uBCF8\uBB38\uC5D0 \uB4E4\uC5B4\uAC11\uB2C8\uB2E4</span></div>') + (w.err ? '<div class="sys err" role="alert"><span>' + esc(w.err) + "</span></div>" : "") + '</div></div><form class="inp" id="wform"><label class="wlab" for="wbody">\uBCF8\uBB38</label><textarea id="wbody" placeholder="\uBCF8\uBB38 \uC785\uB825">' + esc(w.text) + "</textarea>" + (w.pending.length ? '<div class="pend">' + w.pending.map((x, i) => '<span class="pthumb">' + (x.video ? '<video src="' + x.url + '" muted aria-label="' + esc(x.name) + '"></video>' : '<img src="' + x.url + '" alt="' + esc(x.name) + '">') + '<button type="button" class="del" data-pdel="' + i + '" aria-label="\uCCA8\uBD80 \uCDE8\uC18C">\u2715</button></span>').join("") + "</div>" : "") + (w.menu ? '<div class="amenu"><button type="button" data-pick="image">\uC0AC\uC9C4</button><button type="button" data-pick="video">\uB3D9\uC601\uC0C1</button></div>' : "") + '<div class="bar"><button type="button" class="ib" data-attach aria-expanded="' + !!w.menu + '" aria-label="\uC0AC\uC9C4\xB7\uB3D9\uC601\uC0C1 \uCCA8\uBD80">' + I.plus + '</button><span></span><button class="send ok">\uC804\uC1A1</button></div><input type="file" id="pick" multiple hidden></form>';
    const sc = $("#wscroll");
    sc.scrollTop = sc.scrollHeight;
  }
  function sendDraft() {
    const w = R.write, t = w.text, l = w.blocks.length - 1, has = typeof w.blocks[l] === "string";
    if (!t && !w.pending.length) {
      if (has) w.blocks[l] += "\n";
      else w.blocks.push("");
    } else if (t) {
      if (has) w.blocks[l] += "\n" + t;
      else w.blocks.push(t);
    }
    w.blocks.push(...w.pending);
    w.pending = [];
    w.text = "";
    w.err = "";
    w.menu = false;
    renderWrite();
    $("#wbody").focus({ preventScroll: true });
  }
  var b64 = (file) => new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(String(fr.result).split(",")[1] || "");
    fr.onerror = () => rej(Error("\uD30C\uC77C\uC744 \uC77D\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4: " + file.name));
    fr.readAsDataURL(file);
  });
  async function publish() {
    const w = R.write;
    if (w.busy) return;
    if (w.text || w.pending.length) sendDraft();
    if (!w.title.trim()) {
      w.err = "\uC81C\uBAA9\uC744 \uC785\uB825\uD574 \uC8FC\uC138\uC694.";
      return renderWrite();
    }
    if (!w.blocks.some((x) => typeof x !== "string" || x.trim())) {
      w.err = "\uBCF8\uBB38\uC774\uB098 \uC0AC\uC9C4\uC744 \uCD94\uAC00\uD574 \uC8FC\uC138\uC694.";
      return renderWrite();
    }
    w.busy = true;
    w.err = "";
    renderWrite();
    try {
      const blocks = [];
      for (const x of w.blocks) blocks.push(typeof x === "string" ? { t: "text", v: x } : { t: x.video ? "video" : "img", name: x.name, type: x.file.type, b64: await b64(x.file) });
      const g = gal(w.g), r = await withAuth("write", { title: w.title.trim(), head: w.head, blocks }, mWrite(g), { timeout: 3e5 });
      if (R.write !== w) return;
      if (r.navigated || r.ok) {
        for (const x of w.blocks) if (x.url) URL.revokeObjectURL(x.url);
        R.write = null;
        toast("\uAE00\uC744 \uC62C\uB838\uC2B5\uB2C8\uB2E4.");
        renderRoom();
        delete R.cache[w.g + "|"];
        if (R.g === w.g) {
          R.head = "";
          loadList({ fresh: true });
        }
        return;
      }
      w.err = r.error || "\uAE00\uC744 \uC62C\uB9AC\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.";
    } catch (e) {
      w.err = e.message;
    }
    w.busy = false;
    if (R.write === w) renderWrite();
  }
  async function loadList({ append = false, fresh = false } = {}) {
    const g = gal(R.g);
    if (!g) return;
    const seq = ++R.seq, head = R.list && !R.list.heads.length ? "" : R.head;
    const ck = R.g + "|" + head, c = R.cache[ck];
    if (!append && !fresh && c && Date.now() - c.at < 6e4) {
      R.list = c.list;
      R.listErr = "";
      R.listBusy = false;
      renderPane();
      return;
    }
    if (!append) {
      R.list = null;
      R.listErr = "";
    }
    R.listBusy = true;
    renderPane();
    try {
      const page = append ? R.list.page + 1 : 1, res = await dc.listPosts(g, { page, head });
      if (seq !== R.seq) return;
      if (append) {
        const ids = new Set(R.list.posts.map((p) => p.id)), add = res.posts.filter((p) => !p.notice && !ids.has(p.id));
        R.list.posts.push(...add);
        R.list.page = page;
        R.list.more = add.length > 0;
      } else {
        if (head) {
          const ids = new Set(res.posts.map((p) => p.id)), pins = (R.cache[R.g + "|"]?.list.posts || []).filter((p) => p.notice && !ids.has(p.id));
          res.posts.unshift(...pins);
        }
        R.list = { posts: res.posts, heads: res.heads.length ? res.heads : R.list?.heads || [], page: 1, more: res.posts.some((p) => !p.notice) };
      }
      if (!head) {
        const t = res.posts.find((p) => !p.notice);
        if (t && !append) {
          R.latest[R.g] = { id: t.id, title: t.title };
          D.top[R.g] = t.id;
          delete R.updated[R.g];
          save();
        }
      }
      if (res.name && g.name !== res.name && /^[A-Za-z0-9_]+$/.test(g.name)) {
        g.name = res.name;
        save();
      }
      R.cache[ck] = { list: R.list, at: Date.now() };
    } catch (e) {
      if (seq !== R.seq) return;
      if (append) {
        moreHold = Date.now() + 15e3;
        toast(e.message);
      } else R.listErr = e.message;
    }
    R.listBusy = false;
    renderPane();
  }
  async function openGallery(k) {
    R.g = k;
    R.head = "";
    R.shown = 20;
    R.view = "chats";
    R.ov = "";
    R.filter = "";
    R.filterOn = false;
    R.pinOpen = false;
    R.list = null;
    await loadList();
  }
  async function openPost(no, fresh, given) {
    const inList = given || R.list?.posts.find((p) => p.id === no), meta = inList || R.room?.meta;
    if (!meta) return;
    const gk = inList ? R.g : R.room.g, pins = (gk === R.g && R.list?.posts || []).filter((p) => p.notice), seq = ++R.roomSeq, g = gal(gk);
    if (!g) return;
    R.room = { g: gk, no, meta, pinIdx: Math.max(0, pins.indexOf(meta)), post: null, comments: null, total: null, cpage: 1 };
    renderRoom(fresh);
    renderPane();
    try {
      const c = R.pc[gk + "/" + no], post = !fresh && c && Date.now() - c.at < 12e4 ? c.post : await dc.readPost(g, no);
      if (seq !== R.roomSeq) return;
      R.room.post = post;
      renderRoom(fresh);
      try {
        const cm = await dc.readComments(g, no, post.token, 1);
        if (seq !== R.roomSeq) return;
        R.room.comments = cm.comments;
        R.room.total = cm.total;
        meta.comments = Math.max(meta.comments, cm.total);
        D.seen[gk + "/" + no] = meta.comments;
        const mine = !!R.user && post.uid === R.user;
        if (mine || cm.comments.some((c2) => c2.mine) || D.watch.some((w) => w.g === gk && w.no === no)) watch(gk, no, post.title, cm.total, mine);
        else save();
      } catch (e) {
        if (seq !== R.roomSeq) return;
        R.room.cerr = e.message;
      }
    } catch (e) {
      if (seq !== R.roomSeq) return;
      R.room.err = e.message;
    }
    renderRoom(true);
    renderPane();
  }
  async function moreComments() {
    const r = R.room;
    if (!r || r.cbusy) return;
    r.cbusy = true;
    renderRoom(true);
    try {
      const cm = await dc.readComments(gal(r.g), r.no, r.post.token, r.cpage + 1), ids = new Set(r.comments.map((c) => c.id)), add = cm.comments.filter((c) => !ids.has(c.id));
      if (add.length) {
        r.comments.push(...add);
        r.cpage++;
      } else r.noMore = true;
    } catch (e) {
      toast(e.message);
    }
    r.cbusy = false;
    if (R.room === r) renderRoom(true);
  }
  var latestQ = [];
  var latestRun = false;
  async function loadLatest(list = D.gals) {
    latestQ.push(...list.filter((g) => !latestQ.includes(g)));
    if (latestRun) return;
    latestRun = true;
    const queue = latestQ, work = async () => {
      for (let g; g = queue.shift(); ) {
        const k = key(g), c = R.cache[k + "|"];
        if (Date.now() < pvPause) {
          queue.length = 0;
          break;
        }
        if (c && Date.now() - c.at < 6e4) continue;
        try {
          const res = await dc.listPosts(g), t = res.posts.find((p) => !p.notice);
          if (!t) continue;
          R.latest[k] = { id: t.id, title: t.title };
          R.cache[k + "|"] = { list: { posts: res.posts, heads: res.heads, page: 1, more: true }, at: Date.now() };
          if (D.top[k] == null) D.top[k] = t.id;
          else if (t.id > D.top[k] && k !== R.g) R.updated[k] = true;
          if (R.view === "friends" && !R.ov) renderPane();
        } catch {
        }
      }
    };
    await work();
    latestRun = false;
    save();
  }
  var drag = null;
  var dragged = false;
  var lp = null;
  var lpSkip = false;
  document.addEventListener("pointerdown", (e) => {
    const c = e.target.closest(".chips,.favs");
    if (c) drag = { c, x: e.clientX, l: c.scrollLeft, moved: false };
    const t = e.target.closest("[data-lp]");
    if (t && !e.button) {
      const x = e.clientX, y = e.clientY;
      lpEnd();
      lp = setTimeout(() => {
        lpEnd();
        lpSkip = true;
        drag = null;
        longPress(t);
      }, 500);
      lpMove = (v) => {
        if (Math.abs(v.clientX - x) + Math.abs(v.clientY - y) > 8) lpEnd();
      };
      document.addEventListener("pointermove", lpMove);
    }
  });
  var lpMove = null;
  function lpEnd() {
    clearTimeout(lp);
    lp = null;
    if (lpMove) {
      document.removeEventListener("pointermove", lpMove);
      lpMove = null;
    }
  }
  document.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const d = e.clientX - drag.x;
    if (Math.abs(d) > 8) drag.moved = true;
    if (drag.moved) drag.c.scrollLeft = drag.l - d;
  });
  document.addEventListener("pointerup", () => {
    lpEnd();
    if (drag && drag.moved) {
      dragged = true;
      setTimeout(() => dragged = false);
    }
    drag = null;
    if (lpSkip) setTimeout(() => lpSkip = false, 50);
  });
  document.addEventListener("pointercancel", () => {
    lpEnd();
    drag = null;
  });
  document.addEventListener("wheel", (e) => {
    const c = e.target.closest(".chips,.favs");
    if (c && c.scrollWidth > c.clientWidth) {
      c.scrollLeft += e.deltaY;
      e.preventDefault();
    }
  }, { passive: false });
  document.addEventListener("contextmenu", (e) => {
    const t = e.target.closest("[data-lp]");
    if (t) {
      e.preventDefault();
      longPress(t);
    }
  });
  function longPress(t) {
    if (t.dataset.lp === "gal") {
      R.gmenu = t.dataset.g;
      R.ov = "gmenu";
      renderPane();
    } else if (t.dataset.lp === "msg") {
      R.menu = t.dataset.cid;
      R.ask = false;
      renderRoom(true);
    } else if (t.dataset.lp === "con") {
      pickCon(+t.dataset.con, true);
    }
  }
  document.addEventListener("click", (e) => {
    if (dragged || lpSkip) return;
    if (e.target.closest("#viewer")) {
      $("#viewer").hidden = true;
      return;
    }
    const z = e.target.closest("[data-zoom]");
    if (z) {
      $("#viewer").innerHTML = '<img src="' + esc(z.src) + '" alt="">';
      $("#viewer").hidden = false;
      return;
    }
    if (R.menu != null && !e.target.closest("[data-reply],[data-cdel],[data-postdel],[data-pedit]")) {
      R.menu = null;
      R.ask = false;
      renderRoom(true);
    }
    const a = e.target.closest("a[data-url]");
    if (a) {
      e.preventDefault();
      native.open(a.dataset.url);
      return;
    }
    const b = e.target.closest("button");
    if (!b) return;
    const d = b.dataset;
    if (d.view) {
      R.view = d.view;
      R.ov = "";
      renderPane();
    } else if (d.stab != null) {
      R.stab = d.stab;
      R.saved = false;
      if (d.ov) R.ov = d.ov;
      renderPane();
      if (d.stab === "\uACC4\uC815" && !R.userKnown) checkUser();
    } else if (d.ov != null) {
      R.ov = R.ov === d.ov ? "" : d.ov;
      if (d.ov === "set") R.stab = "";
      if (R.ov === "noti") {
        for (const n of D.notis) n.read = true;
        save();
      }
      renderPane();
      if (R.ov === "find") $("#findq")?.focus();
      if (R.ov === "con" && !R.cons.items) loadCons();
      if (R.ov === "log" && R.user && !R.gallog[R.log]) loadGallog();
    } else if (d.log) {
      R.log = d.log;
      renderPane();
      if (R.user && !R.gallog[R.log]?.items) loadGallog();
    } else if (d.glog != null) {
      const v = R.gallog[R.log]?.items?.[+d.glog];
      if (v) {
        R.ov = "";
        jump(v);
      }
    } else if (d.noti != null) {
      const n = D.notis[+d.noti];
      if (n) {
        R.ov = "";
        jump(n);
      }
    } else if (d.noticlear != null) {
      D.notis = [];
      save();
      renderPane();
    } else if (d.alias != null) {
      D.aliasOn = !D.aliasOn;
      save();
      renderPane();
      renderRoom(true);
    } else if (d.g) {
      openGallery(d.g);
    } else if (d.h != null) {
      R.head = d.h;
      R.shown = 20;
      if (R.list?.heads.length) loadList();
      else renderPane();
    } else if (d.p) {
      openPost(+d.p);
    } else if (d.pintog != null) {
      R.pinOpen = !R.pinOpen;
      renderPane();
    } else if (d.nfold != null) {
      R.nfold = !R.nfold;
      renderRoom(true);
    } else if (d.more != null) {
      showMore();
    } else if (d.reload != null) {
      loadList({ fresh: true });
    } else if (d.refresh != null) {
      refresh();
    } else if (d.rreload != null) {
      if (R.room) openPost(R.room.no, true);
    } else if (d.cmore != null) {
      moreComments();
    } else if (d.back != null) {
      R.room = null;
      R.roomSeq++;
      renderRoom();
      renderPane();
    } else if (d.filter != null) {
      R.filterOn = !R.filterOn;
      if (!R.filterOn) R.filter = "";
      renderPane();
      $("#filter")?.focus();
    } else if (d.add != null) {
      const g = R.search.res[+d.add];
      if (g && !gal(key(g))) {
        D.gals.push(g);
        save();
        renderPane();
        loadLatest([g]);
      }
    } else if (d.mephoto != null) {
      pickPhoto((u) => {
        D.me.photo = u;
        save();
        renderPane();
        renderRoom(true);
      });
    } else if (d.mephotodel != null) {
      delete D.me.photo;
      save();
      renderPane();
      renderRoom(true);
    } else if (d.gphoto) {
      const k = d.gphoto;
      pickPhoto((u) => {
        D.photos[k] = u;
        save();
        R.ov = "";
        renderPane();
        renderRoom(true);
      });
    } else if (d.gphotodel) {
      delete D.photos[d.gphotodel];
      save();
      R.ov = "";
      renderPane();
      renderRoom(true);
    } else if (d.fav) {
      const i = D.favs.indexOf(d.fav);
      if (i < 0) {
        D.favs.push(d.fav);
        loadLatest([gal(d.fav)].filter(Boolean));
      } else D.favs.splice(i, 1);
      save();
      R.ov = "";
      renderPane();
    } else if (d.remove) {
      D.gals = D.gals.filter((g) => key(g) !== d.remove);
      D.favs = D.favs.filter((k) => k !== d.remove);
      if (R.g === d.remove) {
        R.g = null;
        R.list = null;
        R.room = null;
        renderRoom();
      }
      save();
      R.ov = "";
      renderPane();
    } else if (d.open) {
      const g = gal(d.open);
      native.open("https://gall.dcinside.com/" + (g.type === "minor" ? "mgallery/" : g.type === "mini" ? "mini/" : "") + "board/lists/?id=" + g.id);
    } else if (d.url) {
      native.open(d.url);
    } else if (d.write != null) {
      if (!gal(R.g)) return;
      R.write = { g: R.g, title: "", head: R.list?.heads[0]?.id ?? "", text: "", blocks: [], pending: [], menu: false, busy: false, err: "" };
      renderRoom();
      $("#wtitle")?.focus();
    } else if (d.wcancel != null) {
      if (R.write.busy) return;
      for (const x of [...R.write.blocks, ...R.write.pending]) if (x.url) URL.revokeObjectURL(x.url);
      R.write = null;
      renderRoom();
    } else if (d.pub != null) {
      publish();
    } else if (d.del != null) {
      R.write.blocks.splice(+d.del, 1);
      renderWrite();
    } else if (d.pdel != null) {
      R.write.pending.splice(+d.pdel, 1);
      renderWrite();
    } else if (d.attach != null) {
      R.write.menu = !R.write.menu;
      renderWrite();
    } else if (d.pick) {
      const i = $("#pick");
      i.accept = d.pick + "/*";
      i.click();
    } else if (d.cpanel != null) {
      R.cpanel = !R.cpanel;
      R.tpanel = false;
      R.con1 = null;
      renderRoom(true);
      if (R.cpanel && !R.cons.items) loadCons();
    } else if (d.tpanel != null) {
      R.tpanel = !R.tpanel;
      R.cpanel = false;
      renderRoom(true);
      $("#tcin")?.focus({ preventScroll: true });
    } else if (d.con != null) {
      pickCon(+d.con, false);
    } else if (d.tbg) {
      D.tbg = d.tbg;
      save();
      renderRoom(true);
    } else if (d.tfg) {
      D.tfg = d.tfg;
      save();
      renderRoom(true);
    } else if (d.tuse) {
      R.tcon = d.tuse;
      renderRoom(true);
    } else if (d.tclear != null) {
      D.trecent = [];
      save();
      renderRoom(true);
    } else if (d.tsend != null) {
      const t = R.tcon.trim();
      if (t) sendToRoom("txtcon", { text: t, bg: D.tbg, fg: D.tfg }).then((ok) => {
        if (ok) {
          D.trecent = [t, ...D.trecent.filter((x) => x !== t)].slice(0, 6);
          save();
          R.tcon = "";
          renderRoom(true);
        }
      });
    } else if (d.reply) {
      R.reply = R.room.comments.find((c) => c.id === d.reply) || null;
      renderRoom(true);
      $("#cform textarea").focus();
    } else if (d.noreply != null) {
      R.reply = null;
      renderRoom(true);
    } else if (d.cdel) {
      removeComment(d.cdel);
    } else if (d.postdel != null) {
      if (!R.ask) {
        R.ask = true;
        R.menu = "body";
        renderRoom(true);
      } else removePost();
    } else if (d.pedit != null) {
      const room = R.room;
      native.official(mModify(gal(room.g), room.no)).then(() => {
        if (R.room === room) openPost(room.no, true);
      });
    } else if (d.login != null) {
      login().then(() => renderPane());
    } else if (d.logout != null) {
      native.logout().then(() => {
        R.user = "";
        R.cons.items = null;
        R.gallog = {};
        renderPane();
        toast("\uB85C\uADF8\uC544\uC6C3\uD588\uC2B5\uB2C8\uB2E4.");
      });
    }
  });
  function pickCon(i, held) {
    const C = R.cons.items;
    if (!C || !C[i]) return;
    const redraw = () => {
      renderRoom(true);
      if (R.ov === "con") renderPane();
    };
    if (!R.room) {
      toast("\uB514\uC2DC\uCF58\uC740 \uCC44\uD305\uBC29 \uC548\uC5D0\uC11C \uBCF4\uB0BC \uC218 \uC788\uC2B5\uB2C8\uB2E4.");
      return;
    }
    if (R.con1 != null) {
      const a = C[R.con1];
      if (R.con1 === i) {
        R.con1 = null;
        return redraw();
      }
      R.con1 = null;
      sendToRoom("dccon", { items: [a, C[i]] });
      return;
    }
    if (held) {
      R.con1 = i;
      return redraw();
    }
    sendToRoom("dccon", { items: [C[i]] });
  }
  document.addEventListener("input", (e) => {
    const t = e.target;
    if (t.id === "filter") {
      R.filter = t.value.trim();
      const pos = t.selectionStart;
      renderPane();
      const n = $("#filter");
      n.focus();
      n.setSelectionRange(pos, pos);
    } else if (t.matches("#cform textarea")) t.form.querySelector(".send").classList.toggle("ok", !!t.value.trim() && !R.sending);
    else if (t.id === "wtitle") R.write.title = t.value;
    else if (t.id === "wbody") R.write.text = t.value;
    else if (t.id === "tcin") {
      R.tcon = t.value;
      const p = $("#tcprev");
      p.textContent = t.value;
      p.style.cssText = tstyle(t.value, D.tbg, D.tfg);
    }
  });
  var LIMIT = { image: 20 * 1024 * 1024, video: 100 * 1024 * 1024 };
  document.addEventListener("change", (e) => {
    if (e.target.id === "whead") R.write.head = e.target.value;
    else if (e.target.id === "pick") {
      for (const f2 of e.target.files) {
        const video = f2.type.startsWith("video");
        if (f2.size > (video ? LIMIT.video : LIMIT.image)) {
          toast((video ? "\uB3D9\uC601\uC0C1\uC740 100MB" : "\uC0AC\uC9C4\uC740 20MB") + "\uAE4C\uC9C0 \uC62C\uB9B4 \uC218 \uC788\uC2B5\uB2C8\uB2E4: " + f2.name);
          continue;
        }
        R.write.pending.push({ file: f2, name: f2.name, video, url: URL.createObjectURL(f2) });
      }
      R.write.menu = false;
      R.write.err = "";
      renderWrite();
    } else if (e.target.matches(".slot select")) {
      const t = e.target.nextElementSibling;
      t.disabled = e.target.value !== "custom";
      if (!t.disabled) t.focus();
    }
  });
  document.addEventListener("submit", async (e) => {
    e.preventDefault();
    const f2 = e.target;
    if (f2.id === "findf") {
      const S = R.search;
      S.q = $("#findq").value.trim();
      if (!S.q) return;
      S.busy = true;
      S.err = "";
      renderPane();
      try {
        S.res = await dc.searchGalleries(S.q);
      } catch (x) {
        S.err = x.message;
        S.res = null;
      }
      S.busy = false;
      renderPane();
    } else if (f2.id === "setf") {
      const el = f2.elements;
      if (R.stab === "\uD504\uB85C\uD544") {
        D.me.name = el.name.value.trim() || "\u3147\u3147";
        D.me.status = el.status.value.trim();
      } else D.rooms = D.rooms.map((r, i) => ({ mode: el["m" + i].value, text: el["t" + i].value.trim() }));
      save();
      R.saved = true;
      renderPane();
      renderRoom(true);
    } else if (f2.id === "cform") {
      const text = f2.querySelector("textarea").value.trim();
      if (text && await sendToRoom("comment", { text })) {
        const t = $("#cform textarea");
        if (t) {
          t.value = "";
          t.form.querySelector(".send").classList.remove("ok");
        }
      }
    } else if (f2.id === "wform") sendDraft();
  });
  window.yjBack = () => {
    if (!$("#viewer").hidden) {
      $("#viewer").hidden = true;
      return true;
    }
    if (R.write) {
      if (!R.write.busy) {
        R.write = null;
        renderRoom();
      }
      return true;
    }
    if (R.cpanel || R.tpanel || R.menu != null) {
      R.cpanel = R.tpanel = false;
      R.menu = null;
      renderRoom(true);
      return true;
    }
    if (R.ov) {
      R.ov = "";
      renderPane();
      return true;
    }
    if (R.room) {
      R.room = null;
      R.roomSeq++;
      renderRoom();
      renderPane();
      return true;
    }
    if (R.view === "chats") {
      R.view = "friends";
      renderPane();
      return true;
    }
    return false;
  };
  var refreshAt = 0;
  function refresh() {
    if (R.write || R.ov || Date.now() - refreshAt < 3e3) return false;
    refreshAt = Date.now();
    if (R.room) openPost(R.room.no, true);
    else if (R.view === "chats") {
      if (!gal(R.g)) return false;
      loadList({ fresh: true });
    } else {
      if (!D.gals.length) return false;
      for (const g of D.gals) {
        const c = R.cache[key(g) + "|"];
        if (c) c.at = 0;
      }
      toast("\uCD5C\uADFC \uAE00 \uC0C8\uB85C \uC77D\uB294 \uC911");
      loadLatest();
    }
    return true;
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") window.yjBack();
    else if (e.key === "F5" || e.ctrlKey && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "r") {
      e.preventDefault();
      refresh();
    }
  });
  var ptr = document.createElement("div");
  ptr.id = "ptr";
  ptr.innerHTML = I.refresh;
  document.body.append(ptr);
  var pull = null;
  var ptrSet = (y, spin) => {
    ptr.classList.toggle("turn", !!spin);
    ptr.classList.toggle("drag", !spin && y > 0);
    ptr.style.transform = "translate(-50%," + y + "px) rotate(" + y * 4 + "deg)";
    ptr.style.opacity = y ? Math.min(1, y / 40) : 0;
  };
  document.addEventListener("touchstart", (e) => {
    const s2 = e.target.closest("#fscroll,#cscroll,#rscroll");
    pull = s2 && s2.scrollTop <= 0 && e.touches.length === 1 ? { s: s2, x: e.touches[0].clientX, y: e.touches[0].clientY, d: 0 } : null;
  }, { passive: true });
  document.addEventListener("touchmove", (e) => {
    if (!pull) return;
    const t = e.touches[0], dx = t.clientX - pull.x, dy = t.clientY - pull.y;
    if (!pull.d && (dy < 0 || Math.abs(dx) > Math.abs(dy)) || pull.s.scrollTop > 0) {
      pull = null;
      ptrSet(0);
      return;
    }
    pull.d = Math.min(70, dy / 2);
    ptrSet(pull.d);
  }, { passive: true });
  var pullEnd = () => {
    if (!pull) return;
    const go = pull.d >= 50;
    pull = null;
    if (go && refresh()) {
      ptrSet(46, true);
      setTimeout(() => ptrSet(0), 700);
    } else ptrSet(0);
  };
  document.addEventListener("touchend", pullEnd);
  document.addEventListener("touchcancel", () => {
    pull = null;
    ptrSet(0);
  });
  async function unseedFriends() {
    if (!D.seeded || D.unseeded) return;
    try {
      const r = await native.http("https://json2.dcinside.com/json1/ranking_gallery.php?jsoncallback=cb", { headers: { Referer: "https://gall.dcinside.com/" } });
      const hot = new Set(JSON.parse(r.text.trim().replace(/^cb\(/, "").replace(/\)\s*;?$/, "")).map((x) => String(x.id || ""))), used = Object.keys(D.seen);
      D.gals = D.gals.filter((g) => {
        const k = key(g);
        return !(g.type === "normal" && hot.has(g.id) && !D.favs.includes(k) && D.top[k] == null && k !== R.g && !used.some((s2) => s2.startsWith(k + "/")));
      });
      D.unseeded = true;
      save();
      if (R.view === "friends" && !R.ov) renderPane();
    } catch {
    }
  }
  renderPane();
  renderRoom();
  unseedFriends().then(() => loadLatest()).then(checkUser);
})();
