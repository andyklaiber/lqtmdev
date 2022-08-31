module.exports = {
    getFees
}

function getFees(priceInDollars){
    let cents = priceInDollars * 100;

    let onlineFee = cents * .06;

    let ccFee = Math.ceil((cents + onlineFee + 30)/( 1 - .029 ));

    return { stripeFee: ccFee - onlineFee - cents, regFee: onlineFee };
}