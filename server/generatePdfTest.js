const axios=require('axios');
const fs=require('fs');
(async()=>{
  try{
    const login = await axios.post('http://localhost:5000/api/auth/login', {email:'test@example.com',password:'password'});
    const token=login.data.token;
    const body={name:'John Doe',age:35,gender:'Male',contact:'555-1234',symptoms:['fever','cough'],prediction:'Flu',accuracy:0.8,risk:'Medium',recommendation:'Rest'};
    const res=await axios.post('http://localhost:5000/api/pdf',body,{headers:{Authorization:'Bearer '+token},responseType:'arraybuffer'});
    fs.writeFileSync('d:/multi-disease/test.pdf',res.data);
    console.log('PDF saved');
  }catch(e){console.error(e.response?e.response.data:e.message)}
})();