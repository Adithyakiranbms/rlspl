"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Customer {
  id: number;
  name: string;
}

export default function CustomerPage() {
  const [customerName, setCustomerName] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("name");

    if (error) {
      console.error(error);
      return;
    }

    setCustomers(data || []);
  }

  async function addCustomer() {
    if (!customerName.trim()) {
      alert("Enter customer name");
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("customers")
      .insert([
        {
          name: customerName.trim(),
        },
      ]);

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Customer Added");

    setCustomerName("");
    loadCustomers();
  }

  async function deleteCustomer(id: number) {
    console.log("Deleting ID:", id);

    const { data, error } = await supabase
      .from("customers")
      .delete()
      .eq("id", id)
      .select();

    console.log("Deleted rows:", data);
    console.log("Error:", error);

    if (error) {
      alert(error.message);
      return;
    }

    if (!data || data.length === 0) {
      alert("No rows deleted");
      return;
    }

    alert("Customer deleted");

    await loadCustomers();
  }

  return (
    <main style={{ padding: "20px" }}>
      <h1>Customer Management</h1>

      <br />

      <input
        type="text"
        placeholder="Customer Name"
        value={customerName}
        onChange={(e) => setCustomerName(e.target.value)}
        style={{
          padding: "8px",
          width: "250px",
        }}
      />

      <button
        onClick={addCustomer}
        disabled={loading}
        style={{
          marginLeft: "10px",
          padding: "8px 16px",
        }}
      >
        {loading ? "Saving..." : "Add Customer"}
      </button>

      <br />
      <br />

      <h2>Customer List</h2>

      <table
        border={1}
        cellPadding={10}
        style={{
          borderCollapse: "collapse",
          minWidth: "400px",
        }}
      >
        <thead>
          <tr>
            <th>ID</th>
            <th>Customer Name</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id}>
              <td>{customer.id}</td>
              <td>{customer.name}</td>
              <td>
                <button onClick={() => deleteCustomer(customer.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}

          {customers.length === 0 && (
            <tr>
              <td colSpan={3} style={{ textAlign: "center" }}>
                No customers found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}