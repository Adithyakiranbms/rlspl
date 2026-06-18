"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function CustomersPage() {
  const [customerName, setCustomerName] = useState("");

  async function addCustomer() {
    if (!customerName.trim()) {
      alert("Enter customer name");
      return;
    }

    const { error } = await supabase
      .from("customers")
      .insert([{ name: customerName }]);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Customer Added Successfully");
    setCustomerName("");
  }

  return (
    <main style={{ padding: "20px" }}>
      <h1>Add Customer</h1>

      <br />

      <input
        type="text"
        placeholder="Customer Name"
        value={customerName}
        onChange={(e) => setCustomerName(e.target.value)}
        style={{
          padding: "8px",
          width: "300px"
        }}
      />

      <button
        onClick={addCustomer}
        style={{
          marginLeft: "10px",
          padding: "8px 20px"
        }}
      >
        Add Customer
      </button>
    </main>
  );
}
