const C=BRFTA_CONFIG,R=document.querySelector("#recipients");let seq=1,pending=null;
const won=n=>Number(n).toLocaleString("ko-KR")+"원";
function phone(v){let d=v.replace(/\D/g,"").slice(0,11);if(d.length<4)return d;if(d.length<8)return d.slice(0,3)+"-"+d.slice(3);return d.slice(0,3)+"-"+d.slice(3,7)+"-"+d.slice(7)}
function validPhone(v){return /^010-\d{4}-\d{4}$/.test(v)}
function tpl(id){return `<section class="card recipient" data-id="${id}"><div class="head"><h2>배송지 <span class="num"></span></h2><button type="button" class="btn light del">삭제</button></div><div class="grid"><label>받는 사람 이름 *<input class="rname" placeholder="받는 사람 이름"><small></small></label><label>휴대전화번호 *<input class="rphone" inputmode="numeric" maxlength="13" placeholder="010-0000-0000"><small></small></label></div><div class="addr"><button type="button" class="btn light addrbtn">주소 검색</button><div class="addrbox">주소를 검색하여 선택해주세요.</div><input class="postalcode" type="hidden"><input class="baseaddr" type="hidden"></div><label class="detail">상세주소 (선택)<input class="detailinput" placeholder="동·호수 등 필요한 경우만 입력"></label><div class="products">${C.products.map(p=>`<div class="product" data-p="${p.id}"><div><div class="pname">${p.name}</div><div class="muted">${p.price?won(p.price):"가격 추후 설정"}</div>${p.notice?`<div class="product-notice">${p.notice}</div>`:""}</div><div class="qty"><button type="button" class="minus">−</button><output>0</output><button type="button" class="plus">+</button></div></div>`).join("")}</div><small class="carderr"></small></section>`}
function add(){R.insertAdjacentHTML("beforeend",tpl(seq++));renum()}
function renum(){let a=[...document.querySelectorAll(".recipient")];a.forEach((c,i)=>{c.querySelector(".num").textContent=i+1;c.querySelector(".del").style.visibility=a.length===1?"hidden":"visible"});calc()}
function totals(){let q=0,goods=0;document.querySelectorAll(".product").forEach(e=>{let n=Number(e.querySelector("output").value||0),p=C.products.find(x=>x.id===e.dataset.p);q+=n;goods+=n*Number(p.price||0)});let shipping=q*Number(C.shippingFeePerBox||0);return{q,goods,shipping,grand:goods+shipping}}
function calc(){let x=totals(),d=document.querySelectorAll(".recipient").length;dest.textContent=d+"곳";qty.textContent=x.q+"박스";goodsTotal.textContent=won(x.goods);shippingTotal.textContent=won(x.shipping);total.textContent=won(x.grand)}
function err(input,msg){
  input.classList.add("field-invalid");
  const l=input.closest("label");
  if(l){
    l.classList.add("invalid");
    const s=l.querySelector("small");
    if(s) s.textContent=msg;
  }
  return input;
}
function validate(){
 document.querySelectorAll(".addrerr").forEach(x=>x.remove());
 document.querySelectorAll(".invalid").forEach(x=>x.classList.remove("invalid"));
 document.querySelectorAll(".field-invalid").forEach(x=>x.classList.remove("field-invalid"));
 document.querySelectorAll("small").forEach(x=>x.textContent="");
 let first=null;

 function mark(input,msg){
   const x=err(input,msg);
   if(!first) first=x;
 }
 if(!senderName.value.trim()) mark(senderName,"주문자 이름을 입력해주세요.");
 if(!validPhone(senderPhone.value)) mark(senderPhone,"올바른 휴대전화번호를 입력해주세요.");

 document.querySelectorAll(".recipient").forEach(c=>{
   const n=c.querySelector(".rname");
   const p=c.querySelector(".rphone");
   const addr=c.querySelector(".addr");
   const products=c.querySelector(".products");
   const carderr=c.querySelector(".carderr");

   if(!n.value.trim()) mark(n,"받는 사람 이름을 입력해주세요.");
   if(!validPhone(p.value)) mark(p,"올바른 휴대전화번호를 입력해주세요.");

   if(!c.querySelector(".baseaddr").value){
     addr.classList.add("invalid");
     const m=document.createElement("small");
     m.className="addrerr";
     m.textContent="주소를 검색하여 선택해주세요.";
     addr.appendChild(m);
     if(!first) first=addr;
   }

   if([...c.querySelectorAll("output")].reduce((s,o)=>s+(+o.value),0)<1){
     products.classList.add("invalid");
     carderr.textContent="상품을 최소 1개 이상 선택해주세요.";
     if(!first) first=products;
   }
 });

 if(first){
   first.scrollIntoView({behavior:"smooth",block:"center"});
   return false;
 }
 return true;
}
async function submitOrder(){
  const x=totals();

  const recipients=[...document.querySelectorAll(".recipient")].map(c=>({
    recipient_name:c.querySelector(".rname").value.trim(),
    recipient_phone:c.querySelector(".rphone").value,
    postal_code:c.querySelector(".postalcode").value,
    base_address:c.querySelector(".baseaddr").value,
    detail_address:c.querySelector(".detailinput").value.trim(),
    items:[...c.querySelectorAll(".product")].map(e=>{
      const p=C.products.find(x=>x.id===e.dataset.p);
      return {
        product_code:p.id,
        product_name:p.name,
        unit_price:Number(p.price||0),
        quantity:Number(e.querySelector("output").value||0)
      };
    }).filter(item=>item.quantity>0)
  }));

  const data={
    orderer_name:senderName.value.trim(),
    orderer_phone:senderPhone.value,
    payment_method:"bank_transfer",
    product_amount:x.goods,
    shipping_fee:x.shipping,
    total_amount:x.grand,
    recipients
  };

  try{
    const response=await fetch(
      "https://brfta-order-api.brfrescofruta.workers.dev/orders",
      {
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify(data)
      }
    );

    const result=await response.json();

    if(!response.ok || !result.success){
      throw new Error(result.message || "주문 접수에 실패했습니다.");
    }

    alert(
      "주문이 정상적으로 접수되었습니다.\n\n"+
      "주문번호: "+result.order_number
    );

    modal.classList.add("hidden");

  }catch(error){
    alert(
      "주문 접수 중 오류가 발생했습니다.\n\n"+
      error.message
    );
  }
}
function reviewOrder(){let h=`<p><b>주문자:</b> ${senderName.value} / ${senderPhone.value}</p>`;document.querySelectorAll(".recipient").forEach((c,i)=>{let items=[...c.querySelectorAll(".product")].map(e=>({q:+e.querySelector("output").value,p:C.products.find(x=>x.id===e.dataset.p)})).filter(x=>x.q);h+=`<div class="review-card"><button type="button" class="btn light edit" data-i="${i}">수정</button><b>배송지 ${i+1}</b><p>${c.querySelector(".rname").value} / ${c.querySelector(".rphone").value}<br>${c.querySelector(".baseaddr").value}${c.querySelector(".detailinput").value?" "+c.querySelector(".detailinput").value:""}</p>${items.map(x=>`${x.p.name} × ${x.q} = ${won(x.p.price*x.q)}`).join("<br>")}</div>`});let x=totals();h+=`<div class="review-totals"><p>총 상품수량 <b>${x.q}박스</b></p><p>상품금액 <b>${won(x.goods)}</b></p><p>배송비 <b>${won(x.shipping)}</b> <span class="muted">(${won(C.shippingFeePerBox)} × ${x.q}박스)</span></p><p><b>최종 주문금액 ${won(x.grand)}</b></p></div>`;review.innerHTML=h;modal.classList.remove("hidden")}
document.addEventListener("input",e=>{if(e.target.matches("#senderPhone,.rphone"))e.target.value=phone(e.target.value)});
document.addEventListener("click",e=>{if(e.target.id==="add")add();if(e.target.matches(".plus,.minus")){let o=e.target.parentElement.querySelector("output"),n=+o.value+(e.target.matches(".plus")?1:-1);o.value=Math.max(0,Math.min(9,n));calc()}if(e.target.matches(".del")){pending=e.target.closest(".recipient");delModal.classList.remove("hidden")}if(e.target.id==="cancelDel")delModal.classList.add("hidden");if(e.target.id==="okDel"&&pending){pending.remove();pending=null;delModal.classList.add("hidden");renum()}if(e.target.matches(".addrbtn")){
  const c=e.target.closest(".recipient");
  if(typeof daum==="undefined" || !daum.Postcode){
    alert("주소 검색 서비스를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
    return;
  }
  new daum.Postcode({
    oncomplete:function(data){
      let addr="";
      let extraAddr="";
      if(data.userSelectedType==="R"){
        addr=data.roadAddress;
        if(data.bname!=="" && /[동|로|가]$/g.test(data.bname)) extraAddr+=data.bname;
        if(data.buildingName!=="" && data.apartment==="Y")
          extraAddr+=(extraAddr!=="" ? ", "+data.buildingName : data.buildingName);
        if(extraAddr!=="") addr+=" ("+extraAddr+")";
      }else{
        addr=data.jibunAddress;
      }
      const finalAddr=(data.zonecode ? "["+data.zonecode+"] " : "")+addr;
      c.querySelector(".postalcode").value=data.zonecode || "";
      c.querySelector(".baseaddr").value=addr;
      c.querySelector(".addrbox").textContent=finalAddr;
      c.querySelector(".addrbox").classList.remove("invalid");
      const ae=c.querySelector(".addrerr");
      if(ae) ae.remove();
      const detail=c.querySelector(".detailinput");
      if(detail) detail.focus();
    }
  }).open();
}if(e.target.id==="back")modal.classList.add("hidden");if(e.target.matches(".edit")){let i=+e.target.dataset.i;modal.classList.add("hidden");document.querySelectorAll(".recipient")[i].scrollIntoView({behavior:"smooth"})}if(e.target.id==="submitMock")submitOrder()
form.addEventListener("submit",e=>{e.preventDefault();if(validate())reviewOrder()});add();
