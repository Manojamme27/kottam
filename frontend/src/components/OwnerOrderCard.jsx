import axios from 'axios';
import React, { useState } from 'react';
import { MdPhone } from "react-icons/md";
import { serverUrl } from '../App';
import { useDispatch } from 'react-redux';
import { updateOrderStatus } from '../redux/userSlice.js';
import { FiPrinter } from 'react-icons/fi';

// SAME DELIVERY FEE LOGIC
const calculateDeliveryFee = (amount) => {
    if (amount < 100) return 0;
    if (amount >= 100 && amount <= 199) return 30;
    if (amount >= 200 && amount <= 499) return 40;
    if (amount >= 500) return 50;
    return 0;
};

function OwnerOrderCard({ data }) {

    const dispatch = useDispatch();
    const [availableBoys, setAvailableBoys] = useState([]);

    const customer = data?.customer || {};


    // 🔥 ALWAYS NORMALIZE shopOrders
   const shopOrders = Array.isArray(data?.shopOrders)
  ? data.shopOrders
  : [];

if (shopOrders.length === 0) {
  return null; // ⛔ do NOT block render
}

// 🔥 OWNER ALWAYS HAS EXACTLY ONE SHOP ORDER
const shopOrder = shopOrders[0];



    const assignedBoy = shopOrder?.assignedDeliveryBoy || null;

    const subtotal = Number(shopOrder?.subtotal || 0);
    const deliveryFee = calculateDeliveryFee(subtotal);
    const total = subtotal + deliveryFee;

    const isFinalStatus = ["cancelled", "delivered"].includes(
        shopOrder?.status?.toLowerCase()
    );

    // ================================
    // UPDATE STATUS (OWNER)
    // ================================
const handleUpdateStatus = async (orderId, shopId, status) => {
  try {
    const result = await axios.post(
      `${serverUrl}/api/order/update-status/${orderId}/${shopId}`,
      { status },
      { withCredentials: true }
    );

    // ✅ Sync redux using backend-confirmed status
    dispatch(
      updateOrderStatus({
        orderId,
        shopId,
        status: result.data.shopOrder?.status || status,
      })
    );

    // ✅ Sync available delivery boys
    if (result.data.availableBoys) {
      setAvailableBoys(result.data.availableBoys);
    }

  } catch (error) {
    console.error("Update status failed:", error);
  }
};


    // ================================
    // PRINT RECEIPT
    // ================================
    const handlePrint = () => {
        const printContent = `
        <html>
        <head>
            <title>Order Receipt</title>
            <style>
                body { font-family: Arial; width: 300px; margin: auto; padding: 10px; color: #333; }
                h2 { text-align: center; color: #ff4d2d; margin: 0 0 10px 0; }
                .section-title { font-weight: bold; margin-top: 10px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
                .info { font-size: 14px; margin-bottom: 4px; }
                table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 14px; }
                th, td { padding: 5px 0; }
                th { border-bottom: 1px solid #ccc; }
                td { border-bottom: 1px dashed #ddd; }
                .totals { margin-top: 10px; font-size: 15px; }
                .totals div { display: flex; justify-content: space-between; margin: 3px 0; }
                .grand-total { font-weight: bold; font-size: 18px; color: #ff4d2d; border-top: 1px dashed #999; padding-top: 6px; }
                .footer { text-align: center; margin-top: 15px; font-size: 13px; border-top: 1px solid #eee; padding-top: 8px; color: #555; }
            </style>
        </head>

        <body>
            <h2>KOTTAM - Order Receipt</h2>
            <div class="info"><strong>Order ID:</strong> #${data._id?.slice(-6)}</div>
            <div class="info"><strong>Date:</strong> ${new Date(data.createdAt).toLocaleDateString()}</div>

            <div class="section-title">Customer Details</div>
            <div class="info"><strong>Name:</strong> ${user.fullName || "N/A"}</div>
            <div class="info"><strong>Mobile:</strong> ${user.mobile || "-"}</div>
            <div class="info"><strong>Address:</strong> ${data.deliveryAddress?.text || "N/A"}</div>

            <div class="section-title">Order Items</div>

            <table>
                <thead>
                    <tr><th>Item</th><th>Qty</th><th>₹Price</th><th>Total</th></tr>
                </thead>
                <tbody>
                    ${Array.isArray(shopOrder.shopOrderItems)
  ? shopOrder.shopOrderItems.map(
      (item) => `
        <tr>
          <td>${item.item?.name || "-"}</td>
          <td>${item.quantity}</td>
          <td>₹${item.price}</td>
          <td>₹${item.price * item.quantity}</td>
        </tr>`
    ).join("")
  : ""}

                </tbody>
            </table>

            <div class="section-title">Bill Summary</div>
            <div class="totals">
                <div><span>Subtotal:</span> <span>₹${subtotal}</span></div>
                <div><span>Delivery Fee:</span> <span>₹${deliveryFee}</span></div>
                <div class="grand-total"><span>Total:</span> <span>₹${total}</span></div>
            </div>

            <div class="footer">Thank you for ordering with KOTTAM 🍽️</div>
        </body>
        </html>
        `;

        const win = window.open("", "_blank");
        win.document.write(printContent);
        win.document.close();
        setTimeout(() => win.print(), 300);
    };

    return (
        <div
            className={`rounded-xl shadow-md p-5 mb-5 border transition-all duration-300 ${
                shopOrder?.status === "cancelled"
                    ? "bg-gray-100 border-gray-300 opacity-75 cursor-not-allowed"
                    : "bg-white border-orange-100 hover:shadow-lg"
            }`}
        >
         
            {/* CUSTOMER INFO */}
<div className="flex justify-between flex-wrap gap-3">
  <div>
    <h2 className="text-lg font-bold text-gray-800">
      {customer?.name || "Customer"}
    </h2>

    <p className="flex items-center gap-2 text-sm text-gray-600 mt-1">
      <MdPhone />
      <span>{customer?.mobile || "-"}</span>
    </p>
  </div>


                <div className="text-left text-sm text-gray-600">
                    <p><strong>Order ID:</strong> #{data._id?.slice(-6)}</p>
                    <p>
                        <strong>Payment:</strong>{" "}
                        {data.paymentMethod === "online"
                            ? data.payment ? "Paid ✅" : "Unpaid ❌"
                            : "COD 💵"}
                    </p>
                    <p>{new Date(data.createdAt).toLocaleDateString("en-GB")}</p>
                </div>
            </div>

            {/* ADDRESS */}
            <div className="bg-orange-50 p-3 rounded-lg mt-4 text-sm text-gray-700">
                <p>
                    <strong>Delivery Address:</strong>{" "}
                    {data.deliveryAddress?.text || "N/A"}
                </p>
            </div>

            {/* ITEMS */}
            <div className="overflow-x-auto mt-4">
                <table className="w-full text-sm text-left border-collapse table-fixed">
                    <thead>
                        <tr className="border-b text-gray-700">
                            <th className="py-2">Item</th>
                            <th className="py-2 text-center">Qty</th>
                            <th className="py-2 text-center">Price</th>
                            <th className="py-2 text-center">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.isArray(shopOrder?.shopOrderItems) &&
  shopOrder.shopOrderItems.map((item, i) => (

                            <tr key={i} className="border-b last:border-0">
                                <td className="py-2">{item.item?.name || "Unknown"}</td>
                                <td className="py-2 text-center">{item.quantity}</td>
                                <td className="py-2 text-center">₹{item.price}</td>
                                <td className="py-2 text-center">
                                    ₹{item.price * item.quantity}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* TOTALS */}
            <div className="mt-5 bg-orange-50 rounded-lg px-4 py-3">
                <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{subtotal}</span>
                </div>

                <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>₹{deliveryFee}</span>
                </div>

                <div className="flex justify-between text-lg font-semibold mt-2">
                    <span>Total</span>
                    <span className="text-[#ff4d2d]">₹{total}</span>
                </div>
            </div>

            {/* STATUS */}
            <div className="mt-5 flex flex-wrap justify-between border-t pt-4">
                <div className="flex flex-col gap-2">
                    <span>
                        Status:{" "}
                        <span className="font-bold capitalize text-[#ff4d2d]">
                            {shopOrder?.status || "N/A"}
                        </span>
                    </span>

                    {!isFinalStatus && (
                        <select
                            className="border-2 border-[#ff4d2d] rounded px-3 py-1"
                            onChange={(e) => {
  if (!shopOrder?.shop?._id) return;
  handleUpdateStatus(data._id, shopOrder.shop._id, e.target.value);
}}

                        >
                            <option value="">Change Status</option>
                            <option value="pending">Pending</option>
                            <option value="preparing">Preparing</option>
                            <option value="out of delivery">Out Of Delivery</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    )}
                </div>

                <button
                    onClick={handlePrint}
                    className="bg-[#ff4d2d] text-white px-5 py-2 rounded-lg shadow flex items-center gap-2"
                >
                    <FiPrinter /> Print
                </button>
            </div>

            {/* DELIVERY BOY INFO */}
            {shopOrder?.status === "out of delivery" && (
                <div className="mt-3 p-3 border rounded bg-orange-50">
                    {assignedBoy ? (
                        <p>
                            Assigned Delivery Boy:{" "}
                            <strong>
                                {assignedBoy.fullName || "Unknown"} ({assignedBoy.mobile || "-"})
                            </strong>
                        </p>
                    ) : availableBoys?.length > 0 ? (
                        <>
                            <p>Available Delivery Boys:</p>
                            {availableBoys.map((b, i) => (
                                <div key={i}>
                                    {b.fullName} - {b.mobile}
                                </div>
                            ))}
                        </>
                    ) : (
                        <p>Waiting for delivery boy...</p>
                    )}
                </div>
            )}
        </div>
    );
}

export default OwnerOrderCard;



