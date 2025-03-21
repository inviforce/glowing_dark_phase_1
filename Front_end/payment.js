import React, { useState, useEffect } from "react";

function Payment() {
    const [amount, setAmount] = useState("");
    const [user, setUser] = useState({ name: "", email: "", contact: "" });

    useEffect(() => {
        fetchUserData();
    }, []);

    async function fetchUserData() {
        try {
            const response = await fetch("/restricted", {
                method: "GET",
                credentials: "include",
            });
            const data = await response.json();
            if (data.user) {
                setUser(data.user);
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    }

    async function createOrder() {
        if (!amount) {
            alert("Please enter an amount");
            return;
        }

        try {
            const response = await fetch("/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ amount }),
            });

            const data = await response.json();
            if (data.success) {
                openRazorpay(data.orderId);
            } else {
                alert("Error creating order");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Something went wrong");
        }
    }

    function openRazorpay(orderId) {
        const options = {
            key: process.env.REACT_APP_RAZORPAY_KEY_ID,  
            amount: amount * 100, 
            currency: "INR",
            name: "Your Company",
            description: "Payment for Order",
            order_id: orderId,
            handler: async function (response) {
                const verifyResponse = await fetch("/verify-payment", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                        amount: amount
                    }),
                });

                const verifyData = await verifyResponse.json();
                alert(verifyData.message);
            },
            prefill: {
                name: user.name, 
                email: user.email,
                contact:"9999999999", // Replace with the user's contact
            },
            theme: {
                color: "#3399cc",
            },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
    }

    return (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
            <h2>Razorpay Payment</h2>
            <input 
                type="number" 
                placeholder="Enter amount" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                style={{ padding: "10px", marginRight: "10px" }}
            />
            <button onClick={createOrder} style={{ padding: "10px" }}>Pay Now</button>
        </div>
    );
}

export default Payment;