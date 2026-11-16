const API_BASE = "https://YOUR-BACKEND-URL.onrender.com"; // Replace after deploying the backend.
const $ = (id) => document.getElementById(id);
$("year").textContent = new Date().getFullYear();
document.querySelectorAll(".tab").forEach(btn => btn.addEventListener("click", () => {
  document.querySelectorAll(".tab").forEach(x => x.classList.toggle("active", x === btn));
  $("download-panel").classList.toggle("hidden", btn.dataset.tab !== "download");
  $("pdf-panel").classList.toggle("hidden", btn.dataset.tab !== "pdf");
}));
function setStatus(el, message, error=false){el.textContent=message;el.classList.toggle("error",error)}
$("download-btn").addEventListener("click", async () => {
  const url=$("ig-url").value.trim(), status=$("download-status"), btn=$("download-btn");
  if(!url){setStatus(status,"Paste an Instagram post or Reel URL first.",true);return}
  try{
    const parsed=new URL(url);
    if(!["instagram.com","www.instagram.com","m.instagram.com"].includes(parsed.hostname)){throw new Error("Please enter a valid instagram.com link.")}
  }catch(e){setStatus(status,e.message || "Enter a valid URL.",true);return}
  if(API_BASE.includes("YOUR-BACKEND-URL")){setStatus(status,"Backend not connected yet. Follow the deployment steps and update API_BASE in app.js.",true);return}
  btn.disabled=true;setStatus(status,"Fetching supported public media…");
  try{
    const response=await fetch(`${API_BASE}/api/download`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url})});
    if(!response.ok){let msg="Could not fetch this media.";try{msg=(await response.json()).detail||msg}catch{}throw new Error(msg)}
    const blob=await response.blob(), disposition=response.headers.get("Content-Disposition")||"", match=disposition.match(/filename="?([^"]+)"?/i);
    const name=match?match[1]:"instasave-media.zip", link=document.createElement("a"), objectUrl=URL.createObjectURL(blob);
    link.href=objectUrl;link.download=name;document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(objectUrl);
    setStatus(status,"Your download is ready. Please credit the original creator where appropriate.");
  }catch(e){setStatus(status,e.message||"Something went wrong. Try a different public post.",true)}
  finally{btn.disabled=false}
});
let selected=[];
$("image-files").addEventListener("change",e=>{selected=Array.from(e.target.files||[]);renderFiles()});
function renderFiles(){
  $("file-list").textContent=selected.length?`${selected.length} image(s) selected: ${selected.map(f=>f.name).join(", ")}`:"";
  $("make-pdf").disabled=!selected.length;
}
$("make-pdf").addEventListener("click",async()=>{
  const status=$("pdf-status"),btn=$("make-pdf");if(!selected.length)return;
  btn.disabled=true;setStatus(status,"Preparing your PDF…");
  try{
    const {jsPDF}=window.jspdf;const pdf=new jsPDF({orientation:"portrait",unit:"pt",format:"a4"});
    const pageW=pdf.internal.pageSize.getWidth(),pageH=pdf.internal.pageSize.getHeight(),margin=28;
    for(let i=0;i<selected.length;i++){
      const file=selected[i];if(!file.type.startsWith("image/"))continue;
      const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)});
      const img=await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=data});
      if(i>0)pdf.addPage();
      const ratio=Math.min((pageW-margin*2)/img.width,(pageH-margin*2)/img.height);
      const w=img.width*ratio,h=img.height*ratio;
      pdf.addImage(data, file.type==="image/png"?"PNG":"JPEG",(pageW-w)/2,(pageH-h)/2,w,h,undefined,"FAST");
    }
    pdf.save("instasave-images.pdf");setStatus(status,"PDF created successfully on your device.");
  }catch(e){setStatus(status,"Could not create the PDF. Try standard JPG or PNG images.",true)}
  finally{btn.disabled=false}
});
