(() => {
  "use strict";

  const C = window.BRFTA_CONFIG;
  if (!C) {
    alert("주문 설정 파일을 불러오지 못했습니다.");
    return;
  }

  const el = id => document.getElementById(id);

  const form = el("form");
  const R = el("recipients");
  const senderName = el("senderName");
  const senderPhone = el("senderPhone");
  const dest = el("dest");
  const qty = el("qty");
  const goodsTotal = el("goodsTotal");
  const shippingTotal = el("shippingTotal");
  const total = el("total");
  const modal = el("modal");
  const review = el("review");
  const delModal = el("delModal");
  const submitOrderBtn = el("submitOrderBtn");

  let seq = 1;
  let pending = null;
  let submitting = false;

  const won = n => Number(n || 0).toLocaleString("ko-KR") + "원";

  function phone(v) {
    const d = String(v || "").replace(/\D/g, "").slice(0, 11);
    if (d.length < 4) return d;
    if (d.length < 8) return d.slice(0, 3) + "-" + d.slice(3);
    return d.slice(0, 3) + "-" + d.slice(3, 7) + "-" + d.slice(7);
  }

  function validPhone(v) {
    return /^010-\d{4}-\d{4}$/.test(v);
  }

  function tpl(id) {
    return `
      <section class="card recipient" data-id="${id}">
        <div class="head">
          <h2>배송지 <span class="num"></span></h2>
          <button type="button" class="btn light del">삭제</button>
        </div>

        <div class="grid">
          <label>받는 사람 이름 *
            <input class="rname" placeholder="받는 사람 이름">
            <small></small>
          </label>

          <label>휴대전화번호 *
            <input class="rphone" inputmode="numeric" maxlength="13" placeholder="010-0000-0000">
            <small></small>
          </label>
        </div>

        <div class="addr">
          <button type="button" class="btn light addrbtn">주소 검색</button>
          <div class="addrbox">주소를 검색하여 선택해주세요.</div>
          <input class="postalcode" type="hidden">
          <input class="baseaddr" type="hidden">
        </div>

        <label class="detail">상세주소 (선택)
          <input class="detailinput" placeholder="동·호수 등 필요한 경우만 입력">
        </label>

        <div class="products">
          ${C.products.map(p => `
            <div class="product" data-p="${p.id}">
              <div>
                <div class="pname">${p.name}</div>
                <div class="muted">${p.price ? won(p.price) : "가격 추후 설정"}</div>
                ${p.notice ? `<div class="product-notice">${p.notice}</div>` : ""}
              </div>
              <div class="qty">
                <button type="button" class="minus">−</button>
                <output>0</output>
                <button type="button" class="plus">+</button>
              </div>
            </div>
          `).join("")}
        </div>

        <small class="carderr"></small>
      </section>
    `;
  }

  function add() {
    R.insertAdjacentHTML("beforeend", tpl(seq++));
    renum();
  }

  function renum() {
    const cards = [...document.querySelectorAll(".recipient")];
    cards.forEach((c, i) => {
      c.querySelector(".num").textContent = i + 1;
      c.querySelector(".del").style.visibility = cards.length === 1 ? "hidden" : "visible";
    });
    calc();
  }

  function totals() {
    let q = 0;
    let goods = 0;

    document.querySelectorAll(".product").forEach(e => {
      const n = Number(e.querySelector("output").value || 0);
      const p = C.products.find(x => x.id === e.dataset.p);
      q += n;
      goods += n * Number(p?.price || 0);
    });

    const shipping = q * Number(C.shippingFeePerBox || 0);
    return { q, goods, shipping, grand: goods + shipping };
  }

  function calc() {
    const x = totals();
    const d = document.querySelectorAll(".recipient").length;

    dest.textContent = d + "곳";
    qty.textContent = x.q + "박스";
    goodsTotal.textContent = won(x.goods);
    shippingTotal.textContent = won(x.shipping);
    total.textContent = won(x.grand);
  }

  function err(input, msg) {
    input.classList.add("field-invalid");
    const l = input.closest("label");

    if (l) {
      l.classList.add("invalid");
      const s = l.querySelector("small");
      if (s) s.textContent = msg;
    }
    return input;
  }

  function clearValidation() {
    document.querySelectorAll(".addrerr").forEach(x => x.remove());
    document.querySelectorAll(".invalid").forEach(x => x.classList.remove("invalid"));
    document.querySelectorAll(".field-invalid").forEach(x => x.classList.remove("field-invalid"));
    document.querySelectorAll("small").forEach(x => x.textContent = "");
  }

  function validate() {
    clearValidation();
    let first = null;

    function mark(input, msg) {
      const x = err(input, msg);
      if (!first) first = x;
    }

    if (!senderName.value.trim()) {
      mark(senderName, "주문자 이름을 입력해주세요.");
    }

    if (!validPhone(senderPhone.value)) {
      mark(senderPhone, "올바른 휴대전화번호를 입력해주세요.");
    }

    document.querySelectorAll(".recipient").forEach(c => {
      const n = c.querySelector(".rname");
      const p = c.querySelector(".rphone");
      const addr = c.querySelector(".addr");
      const products = c.querySelector(".products");
      const carderr = c.querySelector(".carderr");

      if (!n.value.trim()) {
        mark(n, "받는 사람 이름을 입력해주세요.");
      }

      if (!validPhone(p.value)) {
        mark(p, "올바른 휴대전화번호를 입력해주세요.");
      }

      if (!c.querySelector(".baseaddr").value) {
        addr.classList.add("invalid");
        const m = document.createElement("small");
        m.className = "addrerr";
        m.textContent = "주소를 검색하여 선택해주세요.";
        addr.appendChild(m);
        if (!first) first = addr;
      }

      const selected = [...c.querySelectorAll("output")]
        .reduce((s, o) => s + Number(o.value || 0), 0);

      if (selected < 1) {
        products.classList.add("invalid");
        carderr.textContent = "상품을 최소 1개 이상 선택해주세요.";
        if (!first) first = products;
      }
    });

    if (first) {
      first.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }
    return true;
  }

  function displayAddress(c) {
    const postal = c.querySelector(".postalcode").value.trim();
    const base = c.querySelector(".baseaddr").value.trim();
    return (postal ? `[${postal}] ` : "") + base;
  }

  function reviewOrder() {
    let h = `<p><b>주문자:</b> ${senderName.value} / ${senderPhone.value}</p>`;

    document.querySelectorAll(".recipient").forEach((c, i) => {
      const items = [...c.querySelectorAll(".product")]
        .map(e => ({
          q: Number(e.querySelector("output").value || 0),
          p: C.products.find(x => x.id === e.dataset.p)
        }))
        .filter(x => x.q > 0);

      const detail = c.querySelector(".detailinput").value.trim();

      h += `
        <div class="review-card">
          <button type="button" class="btn light edit" data-i="${i}">수정</button>
          <b>배송지 ${i + 1}</b>
          <p>
            ${c.querySelector(".rname").value} / ${c.querySelector(".rphone").value}<br>
            ${displayAddress(c)}${detail ? " " + detail : ""}
          </p>
          ${items.map(x => `${x.p.name} × ${x.q} = ${won(x.p.price * x.q)}`).join("<br>")}
        </div>
      `;
    });

    const x = totals();

    h += `
      <div class="review-totals">
        <p><span>총 상품수량</span><b>${x.q}박스</b></p>
        <p><span>상품금액</span><b>${won(x.goods)}</b></p>
        <p><span>배송비</span><b>${won(x.shipping)}</b></p>
        <p><span>최종 주문금액</span><b>${won(x.grand)}</b></p>
      </div>
    `;

    review.innerHTML = h;
    modal.classList.remove("hidden");
  }

  function buildPayload() {
    const x = totals();

    const recipients = [...document.querySelectorAll(".recipient")].map(c => ({
      recipient_name: c.querySelector(".rname").value.trim(),
      recipient_phone: c.querySelector(".rphone").value,
      postal_code: c.querySelector(".postalcode").value,
      base_address: c.querySelector(".baseaddr").value,
      detail_address: c.querySelector(".detailinput").value.trim(),
      items: [...c.querySelectorAll(".product")]
        .map(e => {
          const p = C.products.find(x => x.id === e.dataset.p);
          return {
            product_code: p.id,
            product_name: p.name,
            unit_price: Number(p.price || 0),
            quantity: Number(e.querySelector("output").value || 0)
          };
        })
        .filter(item => item.quantity > 0)
    }));

    return {
      orderer_name: senderName.value.trim(),
      orderer_phone: senderPhone.value,
      payment_method: "bank_transfer",
      product_amount: x.goods,
      shipping_fee: x.shipping,
      total_amount: x.grand,
      recipients
    };
  }

  async function submitOrder() {
    if (submitting) return;

    submitting = true;
    submitOrderBtn.disabled = true;
    const oldText = submitOrderBtn.textContent;
    submitOrderBtn.textContent = "접수 중...";

    try {
      const response = await fetch(C.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(buildPayload())
      });

      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error("서버 응답을 확인할 수 없습니다.");
      }

      if (!response.ok || !result.success) {
        throw new Error(result.message || "주문 접수에 실패했습니다.");
      }

      modal.classList.add("hidden");

      let msg =
        "주문이 정상적으로 접수되었습니다.\n\n" +
        "주문번호: " + result.order_number;

      if (
        C.bank &&
        C.bank.name &&
        C.bank.account &&
        C.bank.name !== "추후 입력" &&
        C.bank.account !== "추후 입력"
      ) {
        msg +=
          "\n\n입금계좌\n" +
          C.bank.name + " " + C.bank.account +
          "\n예금주: " + (C.bank.holder || "");
      }

      alert(msg);

      // 성공 후 중복 접수를 막는다.
      submitOrderBtn.disabled = true;
      submitOrderBtn.textContent = "접수 완료";

    } catch (error) {
      alert(
        "주문 접수 중 오류가 발생했습니다.\n\n" +
        (error?.message || "잠시 후 다시 시도해주세요.")
      );

      submitting = false;
      submitOrderBtn.disabled = false;
      submitOrderBtn.textContent = oldText;
    }
  }

  document.addEventListener("input", e => {
    if (e.target.matches("#senderPhone,.rphone")) {
      e.target.value = phone(e.target.value);
    }
  });

  document.addEventListener("click", e => {
    if (e.target.id === "add") {
      add();
      return;
    }

    if (e.target.matches(".plus,.minus")) {
      const o = e.target.parentElement.querySelector("output");
      const n = Number(o.value || 0) + (e.target.matches(".plus") ? 1 : -1);
      o.value = Math.max(0, Math.min(9, n));
      calc();
      return;
    }

    if (e.target.matches(".del")) {
      pending = e.target.closest(".recipient");
      delModal.classList.remove("hidden");
      return;
    }

    if (e.target.id === "cancelDel") {
      pending = null;
      delModal.classList.add("hidden");
      return;
    }

    if (e.target.id === "okDel" && pending) {
      pending.remove();
      pending = null;
      delModal.classList.add("hidden");
      renum();
      return;
    }

    if (e.target.matches(".addrbtn")) {
      const c = e.target.closest(".recipient");

      if (typeof daum === "undefined" || !daum.Postcode) {
        alert("주소 검색 서비스를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
        return;
      }

      new daum.Postcode({
        oncomplete: function(data) {
          let addr = "";
          let extraAddr = "";

          if (data.userSelectedType === "R") {
            addr = data.roadAddress;

            if (data.bname !== "" && /[동|로|가]$/g.test(data.bname)) {
              extraAddr += data.bname;
            }

            if (data.buildingName !== "" && data.apartment === "Y") {
              extraAddr += (extraAddr !== "" ? ", " + data.buildingName : data.buildingName);
            }

            if (extraAddr !== "") {
              addr += " (" + extraAddr + ")";
            }
          } else {
            addr = data.jibunAddress;
          }

          const postal = data.zonecode || "";
          const finalAddr = (postal ? `[${postal}] ` : "") + addr;

          c.querySelector(".postalcode").value = postal;
          c.querySelector(".baseaddr").value = addr;
          c.querySelector(".addrbox").textContent = finalAddr;
          c.querySelector(".addr").classList.remove("invalid");

          const ae = c.querySelector(".addrerr");
          if (ae) ae.remove();

          const detail = c.querySelector(".detailinput");
          if (detail) detail.focus();
        }
      }).open();

      return;
    }

    if (e.target.id === "back") {
      modal.classList.add("hidden");
      return;
    }

    if (e.target.matches(".edit")) {
      const i = Number(e.target.dataset.i);
      modal.classList.add("hidden");
      document.querySelectorAll(".recipient")[i]
        .scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    if (e.target.id === "submitOrderBtn") {
      submitOrder();
    }
  });

  form.addEventListener("submit", e => {
    e.preventDefault();
    if (validate()) {
      reviewOrder();
    }
  });

  add();
})();
