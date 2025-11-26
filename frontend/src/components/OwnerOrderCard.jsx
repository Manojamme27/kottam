import axios from "axios";
import React, { useState, useEffect } from "react";
import { MdPhone } from "react-icons/md";
import { FiPrinter } from "react-icons/fi";
import { useDispatch } from "react-redux";
import { serverUrl } from "../App";
import { updateOrderStatus } from "../redux/userSlice";

// Delivery Fee Logic
const calculateDeliveryFee = (amount) => {
  if (amount < 100) return 0;
  if (amount >= 100 && amount <= 199) return 30;
  if (amount >= 200 && amount <= 499) return 40;
  if (amount >= 500) return 50;
  return 0;
};

function OwnerOrderCard({ data }) {
  const dispatch = useDispatch();

  // 🔥 IMPORTANT FIX — shopOrders is an ARRAY → owner only sees index 0
  const shopOrder = data?.shopOrders?.[0] || null;

  const user = data?.user || {};

  if (!shopOrder) return null; // safety — prevents undefined.map crash

  // Local reactive state
  const [orderStatus, setOrderStatus] = useState(shopOrder?.status);
  const [availableBoys, setAvailableBoys] = useState([]);
  const [assignedBoy, setAssignedBoy] = useState(
    shopOrder?.assignedDeliveryBoy || null
  );

  const subtotal = Number(shopOrder?.subtotal || 0);
  const deliveryFee = calculateDeliveryFee(subtotal);
  const total = subtotal + deliveryFee;

  const isFinalStatus = ["cancelled", "delivered"].includes(
    orderStatus?.toLowerCase()
  );

  // 🔥 Keep component updated if redux updates order in real-time (socket)
  useEffect(() => {
    if (shopOrder?.status !== orderStatus) {
      setOrderStatus(shopOrder?.status);
    }
    setAssignedBoy(shopOrder?.assignedDeliveryBoy || null);
  }, [shopOrder]);

  // Update status handler
  const handleUpdateStatus = async (orderId, shopId, status) => {
    if (!status) return;

    setOrderStatus(status); // instant UI response

    try {
      const res = await axios.post(
        `${serverUrl}/api/order/update-status/${orderId}/${shopId}`,
        { status },
        { withCredentials: true }
      );

      // Sync redux
      dispatch(updateOrderStatus({ orderId, shopId, status }));

      if (res.data?.assignedDeliveryBoy) {
        setAssignedBoy(res.data.assignedDeliveryBoy);
      }

      if (res.data?.availableBoys) {
        setAvailableBoys(res.data.availableBoys);
      }
    } catch (err) {
      console.log(err);
    }
  };

  // Print Receipt
  const handlePrint = () => {
    const printContent = `
    <html>
    <head>
    <title>Order Receipt</title>
    <style>
      body { font-family: Arial; width: 300px; margin: auto; padding: 10px; }
      h2 { text-align: center; color: #ff4d2d; }
      table { width: 100%; margin-top: 8px; border-collapse: collapse; }
      td { border-bottom: 1px dashed #ddd; padding: 4px 0; }
    </style>
    </head>

    <body>
    <h2>KOTTAM - Order Receipt</h2>

    <div><strong>Order ID:</strong> #${data._id?.slice(-6)}</div>
    <div><strong>Date:</strong> ${new Date(data.createdAt).toLocaleDateString()}</div>

    <h3>Customer Details</h3>
    <div><strong>Name:</strong> ${user.fullName || "N/A"}</div>
    <div><strong>Mobile:</strong> ${user.mobile || "-"}</div>
    <div><strong>Address:</strong> ${data.deliveryAddress?.text || "N/A"}</div>

    <h3>Order Items</h3>

    <table>
      ${shopOrder.shopOrderItems
        .map(
          (item) => `
          <tr>
            <td>${item.item?.name}</td>
            <td>x${item.quantity}</td>
            <td>₹${item.price * item.quantity}</td>
          </tr>`
        )
        .join("")}
    </table>

    <h3>Bill Summary</h3>
    <div>Subtotal: ₹${subtotal}</div>
    <div>Delivery Fee: ₹${deliveryFee}</div>
    <div><strong>Total: ₹${total}</strong></div>

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
      className={`rounded-xl shadow-md p-5 mb-5 border transition-all ${
        orderStatus === "cancelled"
          ? "bg-gray-100 border-gray-300 opacity-75"
          : "bg-white border-orange-100 hover:shadow-lg"
      }`}
    >
      {/* CUSTOMER DETAILS */}
      <div className="flex justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold">{user.fullName}</h2>
          <p className="text-sm text-gray-500">{user.email}</p>
          <p className="flex items-center gap-2 text-sm text-gray-600 mt-1">
            <MdPhone /> {user.mobile}
          </p>
        </div>

        <div className="text-sm text-gray-600">
          <p><strong>Order ID:</strong> #{data._id?.slice(-6)}</p>
          <p>
            <strong>Payment:</strong>{" "}
            {data.paymentMethod === "online"
              ? data.payment
                ? "Paid ✅"
                : "Unpaid ❌"
              : "COD 💵"}
          </p>
          <p>{new Date(data.createdAt).toLocaleDateString("en-GB")}</p>
        </div>
      </div>

      {/* ADDRESS */}
      <div className="bg-orange-50 p-3 rounded-lg mt-4 text-sm text-gray-700">
        <p>
          <strong>Delivery Address:</strong> {data.deliveryAddress?.text}
        </p>
      </div>

      {/* ITEMS */}
      <div className="overflow-x-auto mt-4">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b text-gray-700">
              <th>Item</th>
              <th className="text-center">Qty</th>
              <th className="text-center">Price</th>
              <th className="text-center">Total</th>
            </tr>
          </thead>

          <tbody>
            {shopOrder.shopOrderItems.map((item, i) => (
              <tr key={i} className="border-b">
                <td>{item.item?.name}</td>
                <td className="text-center">{item.quantity}</td>
                <td className="text-center">₹{item.price}</td>
                <td className="text-center">₹{item.price * item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* TOTALS */}
      <div className="mt-5 bg-orange-50 rounded-lg px-4 py-3">
        <div className="flex justify-between">
          <span>Subtotal</span> <span>₹{subtotal}</span>
        </div>
        <div className="flex justify-between">
          <span>Delivery Fee</span> <span>₹{deliveryFee}</span>
        </div>
        <div className="flex justify-between text-lg font-semibold mt-2">
          <span>Total</span>
          <span className="text-[#ff4d2d]">₹{total}</span>
        </div>
      </div>

      {/* STATUS */}
      <div className="mt-5 flex justify-between border-t pt-4">
        <div className="flex flex-col gap-2">
          <span>
            Status:{" "}
            <span className="font-bold capitalize text-[#ff4d2d]">
              {orderStatus}
            </span>
          </span>

          {!isFinalStatus && (
            <select
              className="border-2 border-[#ff4d2d] rounded px-3 py-1"
              value={orderStatus}
              onChange={(e) =>
                handleUpdateStatus(
                  data._id,
                  shopOrder?.shop?._id,
                  e.target.value
                )
              }
            >
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
      {orderStatus === "out of delivery" && (
        <div className="mt-3 p-3 border rounded bg-orange-50">
          {assignedBoy ? (
            <p>
              Assigned Delivery Boy:{" "}
              <strong>
                {assignedBoy.fullName} ({assignedBoy.mobile})
              </strong>
            </p>
          ) : availableBoys.length > 0 ? (
            <>
              <p>Available Delivery Boys:</p>
              {availableBoys.map((b, i) => (
                <div key={i}>
                  {b.fullName} - {b.mobile}
                </div>
              ))}
            </>
          ) : (
            <p>Waiting for delivery boy…</p>
          )}
        </div>
      )}
    </div>
  );
}

export default OwnerOrderCard;
