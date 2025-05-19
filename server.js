const express=require('express'),fetch=require('node-fetch'),cors=require('cors');
const app=express();app.use(cors(),express.json());
const ID="665303969425082",SECRET="f5ce60bc67adbe6a24b6a46273e12b95",REDIRECT="https://facebooklogin-phi.vercel.app",TO="+917276517716",PORT=process.env.PORT||3000;

app.post('/send_message',async(req,res)=>{
  const{code,phone_number_id}=req.body;
  if(!code||!phone_number_id)return res.status(400).json({error:'code and phone_number_id required'});
  try{
    const params=new URLSearchParams({client_id:ID,redirect_uri:REDIRECT,client_secret:SECRET,code});
    const tokenRes=await fetch(`https://graph.facebook.com/v22.0/oauth/access_token?${params}`);
    const token=await tokenRes.json();if(!tokenRes.ok)throw new Error(token.error?.message);

    const msgRes=await fetch(`https://graph.facebook.com/v22.0/${phone_number_id}/messages`,{
      method:'POST',headers:{Authorization:`Bearer ${token.access_token}`,'Content-Type':'application/json'},
      body:JSON.stringify({messaging_product:'whatsapp',to:TO,type:'text',text:{body:'Hello from API!'}})
    });
    const msg=await msgRes.json();if(!msgRes.ok)throw new Error(msg.error?.message);
    res.json(msg);
  }catch(e){res.status(500).json({error:e.message})}
});

app.listen(PORT,()=>console.log(`🚀 on ${PORT}`));