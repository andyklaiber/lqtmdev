const _ = require('lodash');

module.exports = {
    getFees,
    updateRacePaymentOptions
}

function getFees(priceInDollars){
    let cents = priceInDollars * 100;

    let onlineFee = cents * .06;

    let ccFee = Math.round((cents + onlineFee + 30)/( 1 - .029 ));

    return { stripeFee: ccFee - onlineFee - cents, regFee: onlineFee };
}

function updateRacePaymentOptions(paymentOptions, percentDiscount=false){
        
    _.forEach(paymentOptions, (payOpt, idx)=>{
        let fees;
        if(percentDiscount){
            paymentOptions[idx].discounted=true;
            paymentOptions[idx].orig = parseInt(paymentOptions[idx].amount);
            paymentOptions[idx].amount = payOpt.amount - payOpt.amount * percentDiscount;
            fees = getFees(paymentOptions[idx].amount);
        }else{
            fees = getFees(payOpt.amount);
        }
        _.merge(paymentOptions[idx], fees);
    });
    return paymentOptions;
} 