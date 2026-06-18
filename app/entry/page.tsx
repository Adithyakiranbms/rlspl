"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { districts } from "@/lib/districts";

export default function EntryPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [date, setDate] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [district, setDistrict] = useState("");
  const [weight, setWeight] = useState("");
  
  const [entries, setEntries] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    loadCustomers();
    loadEntries();
  }, []);

  async function loadCustomers() {
    const { data } = await supabase
      .from("customers")
      .select("*")
      .order("name");

    setCustomers(data || []);
  }

  async function loadEntries() {
    const { data } = await supabase
      .from("entries")
      .select("*")
      .order("entry_date", {
        ascending: false,
      });

    setEntries(data || []);
  }

  async function saveEntry() {
    let error;

    if (editingId) {
      const result = await supabase
        .from("entries")
        .update({
          entry_date: date,
          customer_id: customerId,
          district,
          weight: Number(weight),
        })
        .eq("id", editingId);

      error = result.error;
    } else {
      const result = await supabase
        .from("entries")
        .insert([
          {
            entry_date: date,
            customer_id: customerId,
            district,
            weight: Number(weight),
          },
        ]);

      error = result.error;
    }

    if (error) {
      alert(error.message);
      return;
    }

    setDate("");
    setCustomerId("");
    setDistrict("");
    setWeight("");
    setEditingId(null);

    loadEntries();
  }

  async function deleteEntry(id: number) {
    const confirmed = confirm("Delete this entry?");

    if (!confirmed) return;

    const { error } = await supabase
      .from("entries")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadEntries();
  }

  function editEntry(entry: any) {
    setEditingId(entry.id);
    setDate(entry.entry_date);
    setCustomerId(String(entry.customer_id));
    setDistrict(entry.district);
    setWeight(String(entry.weight));
  }

  return (
    <main style={{ padding: "20px" }}>
      <h1>Daily Tonnage Entry</h1>

      <br />

      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      <br /><br />

      <select
        value={customerId}
        onChange={(e) => setCustomerId(e.target.value)}
      >
        <option value="">Select Customer</option>

        {customers.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <br /><br />

      <select
        value={district}
        onChange={(e) => setDistrict(e.target.value)}
      >
        <option value="">Select District</option>

        {districts.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>

      <br /><br />

      <input
        type="number"
        placeholder="Weight in KG"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
      />

      <br /><br />

      <button onClick={saveEntry}>
        {editingId ? "Update Entry" : "Save Entry"}
      </button>

      <br />
      <br />

      <h2>Saved Entries</h2>

      <table
        border={1}
        cellPadding={8}
        style={{
          borderCollapse: "collapse",
          width: "100%",
        }}
      >
        <thead>
          <tr>
            <th>Date</th>
            <th>Customer</th>
            <th>District</th>
            <th>Weight</th>
            <th>Edit</th>
            <th>Delete</th>
          </tr>
        </thead>

        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td>{entry.entry_date}</td>
              {/* FIXED: Now shows actual customer name instead of database UUID/ID */}
              <td>
                {customers.find((c) => c.id === entry.customer_id)?.name || entry.customer_id}
              </td>
              <td>{entry.district}</td>
              <td>{entry.weight}</td>
              <td>
                <button onClick={() => editEntry(entry)}>Edit</button>
              </td>
              <td>
                <button onClick={() => deleteEntry(entry.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}