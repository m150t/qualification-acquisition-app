'use client';
import { useState } from 'react';
import { postGoal } from '@study/sdk';
export default function GoalPage(){
  const [examDate,setExamDate]=useState(''); const [loading,setLoading]=useState(false); const [msg,setMsg]=useState('');
  async function submit(){
    try{ setLoading(true); setMsg(''); const res=await postGoal({examDate,freq:3,themes:['IAM','EC2','S3','VPC']}); setMsg(JSON.stringify(res)); }
    catch(e:any){ setMsg('Error: '+e.message); } finally{ setLoading(false); }
  }
  return (<main style={{padding:24}}>
    <h1>目標設定</h1>
    <label>試験日： <input type='date' value={examDate} onChange={e=>setExamDate(e.target.value)} /></label>
    <div style={{marginTop:12}}><button onClick={submit} disabled={!examDate||loading}>{loading?'送信中...':'WBSを作成'}</button></div>
    <p style={{marginTop:12}}>{msg}</p><p><a href='/'>←ホームへ</a></p>
  </main>);
}