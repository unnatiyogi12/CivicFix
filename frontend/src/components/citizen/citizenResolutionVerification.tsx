import { useState } from "react";
import "./CitizenResolutionVerification.css";

interface Complaint {
  _id:string; title:string; civicFixStatus?:string; status?:string; citizenVerification?:string;
  governmentAction?:{ resolutionNote?:string; proofUrls?:string[] };
}

export default function CitizenResolutionVerification({complaint,onUpdated}:{complaint:Complaint;onUpdated?:(c:Complaint)=>void}) {
  const [loading,setLoading]=useState(false), [message,setMessage]=useState(""), [error,setError]=useState("");
  const status=complaint.civicFixStatus || complaint.status;
  if(status!=="Resolved") return null;
  if(complaint.citizenVerification==="Confirmed") return <section className="cv-card confirmed"><b>✓ Resolution Confirmed</b><p>You confirmed that the issue is resolved.</p></section>;
  if(complaint.citizenVerification==="Rejected") return <section className="cv-card reopened"><b>↩ Complaint Reopened</b><p>Your complaint has returned to CivicFix review.</p></section>;

  const decide=async(decision:"confirm"|"reopen")=>{
    const token=localStorage.getItem("token"); if(!token){setError("Please login again.");return;}
    if(!window.confirm(decision==="confirm"?"Confirm this complaint is resolved?":"Reopen because the issue is still not resolved?")) return;
    try{
      setLoading(true);setError("");setMessage("");
      const r=await fetch(`https://civicfix-backend-ce2z.onrender.com/api/complaints/my/${complaint._id}/verification`,{method:"PATCH",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({decision})});
      const d=await r.json(); if(!r.ok) throw new Error(d.message||"Update failed");
      setMessage(d.message||"Updated"); onUpdated?.(d.complaint);
    }catch(e){setError(e instanceof Error?e.message:"Something went wrong.");}finally{setLoading(false);}
  };

  return <section className="cv-card">
    <span className="cv-label">CITIZEN VERIFICATION</span>
    <h3>Is your issue actually resolved?</h3>
    <p>Government submitted a resolution. Please verify it from your side.</p>
    {complaint.governmentAction?.resolutionNote && <div className="cv-note"><b>Government Resolution</b><p>{complaint.governmentAction.resolutionNote}</p></div>}
    {!!complaint.governmentAction?.proofUrls?.length && <div className="cv-proofs">{complaint.governmentAction.proofUrls.map((u,i)=><a key={`${u}-${i}`} href={u} target="_blank" rel="noreferrer">📎 Proof {i+1}</a>)}</div>}
    {message && <div className="cv-success">✓ {message}</div>}{error && <div className="cv-error">⚠ {error}</div>}
    <div className="cv-actions"><button disabled={loading} onClick={()=>decide("confirm")}>✓ Yes, Issue Resolved</button><button disabled={loading} onClick={()=>decide("reopen")}>↩ No, Reopen Complaint</button></div>
  </section>;
}
