const _ = require('lodash');

module.exports = {
    getFees,
    updateRacePaymentOptions
}

function getFees(priceInDollars){
    let cents = priceInDollars * 100;

    let onlineFee = cents * .04;
    if(onlineFee > 600){
        onlineFee = 600
    }

    let totalCharge = Math.round((cents + onlineFee + 30)/( 1 - .029 ));

    return { stripeFee: totalCharge - onlineFee - cents, regFee: onlineFee, priceInCents:cents };
}

function updateRacePaymentOptions(paymentOptions, fractionDiscount=false, paymentTypes=[]){
        
    _.forEach(paymentOptions, (payOpt, idx)=>{
        let applyDiscount = true && fractionDiscount > 0;
        if(paymentTypes.length > 0 && !paymentTypes.includes(payOpt.type)){
            applyDiscount = false;
        }
        let fees;
        if(applyDiscount){
            paymentOptions[idx].discounted=true;
            paymentOptions[idx].orig = parseInt(paymentOptions[idx].amount);
            paymentOptions[idx].amount = payOpt.amount - payOpt.amount * fractionDiscount;
            fees = getFees(paymentOptions[idx].amount);
        }else{
            fees = getFees(payOpt.amount);
        }
        _.merge(paymentOptions[idx], fees);
    });
    return paymentOptions;
} 