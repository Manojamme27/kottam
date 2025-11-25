export function calculateDeliveryCharge(total) {
    if (total >= 1000) return 50;

    if (total >= 500 && total <= 999) return 50;

    if (total >= 200 && total <= 499) return 40;

    if (total >= 100 && total <= 199) return 30;

    return 0; // Below ₹100 → no delivery charge
}
