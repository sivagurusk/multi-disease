const axios = require('axios');
(async()=>{
  try{
    const base = process.env.API_URL || 'http://localhost:5000';
    let r;
    try {
      r = await axios.post(`${base}/api/auth/register`,{
        name:'Test',email:'test@example.com',password:'password'
      });
      console.log('register:',r.data);
    } catch (err) {
      console.log('register error (likely exists):', err.response ? err.response.data : err.message);
      console.error(err);
    }
    r = await axios.post(`${base}/api/auth/login`,{
      email:'test@example.com',password:'password'
    });
    console.log('login token',r.data.token);
    const token=r.data.token;
    r=await axios.post(`${base}/api/predict`,{symptoms:['fever','cough']},{headers:{Authorization:'Bearer '+token}});
    console.log('prediction',r.data);
    // also test numeric symptom codes (fever=1, cough=121 etc.)
    r=await axios.post(`${base}/api/predict`,{symptoms:[1,121,'2']},{headers:{Authorization:'Bearer '+token}});
    console.log('numeric input prediction',r.data);
    // add a sample to dataset and trigger retrain
    r=await axios.post(`${base}/api/train/add`,
      { disease:'Flu', symptoms:['fever','cough','chills'] },
      { headers:{Authorization:'Bearer '+token} }
    );
    console.log('train add response', r.data);
  }catch(e){console.error(e.response?e.response.data:e.message)}
})();