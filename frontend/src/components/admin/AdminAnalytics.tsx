import {useEffect,useState} from "react";
import "./AdminAnalytics.css";

type Item={label:string;count:number};
type Data={summary:{total:number;resolved:number;open:number;citizenConfirmed:number;citizenReopened:number};statusCounts:Item[];governmentStatusCounts:Item[];severityCounts:Item[];categoryCounts:Item[];priorityCounts:Item[];hotspots:(Item&{hotspot:string})[];anomaly:{status:string;message:string;recent7Days:number;previous7Days:number;categoryAnomalies:{label:string;recentCount:number;previousCount:number}[]}};

const Bars=({title,items}:{title:string;items:Item[]})=><div className="an-panel"><h3>{title}</h3>{items.map(x=><div className="an-row" key={x.label}><div><span>{x.label}</span><b>{x.count}</b></div><i><em style={{width:`${Math.max((x.count/Math.max(...items.map(y=>y.count),1))*100,4)}%`}}/></i></div>)}</div>;

export default function AdminAnalytics(){
 const[data,setData]=useState<Data|null>(null);const[loading,setLoading]=useState(true);const[error,setError]=useState("");
 const load=async()=>{try{setLoading(true);const token=localStorage.getItem("token");const r=await fetch("http://localhost:5000/api/analytics/overview",{headers:{Authorization:`Bearer ${token}`}});const d=await r.json();if(!r.ok)throw new Error(d.message||"Analytics failed");setData(d);}catch(e){setError(e instanceof Error?e.message:"Analytics failed");}finally{setLoading(false);}};
 useEffect(()=>{load()},[]);
 if(loading)return <div className="an-page"><h2>Loading Civic Intelligence...</h2></div>;
 if(error||!data)return <div className="an-page"><div className="an-error">⚠ {error||"Analytics unavailable"}<button onClick={load}>Retry</button></div></div>;
 return <div className="an-page">
  <div className="an-head"><div><span>CIVICFIX AI</span><h2>Analytics & Civic Intelligence</h2><p>Trends, ward hotspots and emerging issue signals.</p></div><button onClick={load}>↻ Refresh</button></div>
  <div className="an-summary">{[["Total Complaints",data.summary.total],["Resolved",data.summary.resolved],["Open",data.summary.open],["Citizen Confirmed",data.summary.citizenConfirmed],["Citizen Reopened",data.summary.citizenReopened]].map(([a,b])=><div key={String(a)}><span>{a}</span><strong>{b}</strong></div>)}</div>
  <div className="an-alert"><div><span>ANOMALY DETECTION</span><h3>{data.anomaly.status}</h3></div><p>{data.anomaly.message}<br/><b>Last 7 days: {data.anomaly.recent7Days} | Previous 7 days: {data.anomaly.previous7Days}</b></p></div>
  {data.anomaly.categoryAnomalies.length>0&&<div className="an-panel"><h3>Emerging Categories</h3>{data.anomaly.categoryAnomalies.map(x=><div className="an-emerging" key={x.label}><b>{x.label}</b><span>Recent {x.recentCount}</span><span>Previous {x.previousCount}</span><strong>Spike</strong></div>)}</div>}
  <div className="an-two"><Bars title="Complaint Categories / Areas" items={data.categoryCounts}/><Bars title="Severity" items={data.severityCounts}/></div>
  <div className="an-two"><Bars title="CivicFix Status" items={data.statusCounts}/><Bars title="Government Status" items={data.governmentStatusCounts}/></div>
  <div className="an-panel"><h3>🔥 Hotspots by Ward / Area</h3><div className="an-hotspots">{data.hotspots.map(x=><div key={x.label}><b>{x.label}</b><strong>{x.count}</strong><small>{x.hotspot}</small></div>)}</div></div>
  <Bars title="Priority Distribution" items={data.priorityCounts}/>
 </div>;
}
