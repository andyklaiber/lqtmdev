module.exports = ()=>{
    if(process.env.NODE_ENV !== 'Production'){
        require('dotenv').config({ path: '.env.proddb', override: true })
    }
}