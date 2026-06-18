"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { districts } from "@/lib/districts";

interface Customer {
  id: string | number;
  name: string;
}

interface Entry {
  id: string | number;
  district: string;
  customer_id: string | number;
  weight: number | string;
  entry_date: string;
}

export default function DispatchPage() {
  const [selectedDate, setSelectedDate] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState<Record<string, boolean>>({});
  const [dispatchWeights, setDispatchWeights] = useState<Record<string, number>>({});
  const [previousBalances, setPreviousBalances] = useState<Record<string, number>>({});

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      loadEntries();
      loadDispatches();
      loadPreviousBalances();
    } else {
      setEntries([]);
      setDispatchStatus({});
      setDispatchWeights({});
      setPreviousBalances({});
    }
  }, [selectedDate]);

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

  async function loadEntries() {
    setLoading(true);
    const { data, error } = await supabase
      .from("entries")
      .select("*")
      .eq("entry_date", selectedDate);

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setEntries(data || []);
    setLoading(false);
  }

  async function loadDispatches() {
    const { data, error } = await supabase
      .from("district_dispatches")
      .select("*")
      .eq("dispatch_date", selectedDate);

    if (error) {
      console.error(error);
      return;
    }

    const statusMap: Record<string, boolean> = {};
    const weightMap: Record<string, number> = {};

    data?.forEach((dispatch: any) => {
      statusMap[dispatch.district] = dispatch.dispatched || false;
      weightMap[dispatch.district] = Number(dispatch.dispatched_weight) || 0;
    });

    setDispatchStatus(statusMap);
    setDispatchWeights(weightMap);
  }

  async function loadPreviousBalances() {
    if (!selectedDate) return;

    const { data: entryData, error: entryError } = await supabase
      .from("entries")
      .select("*")
      .lt("entry_date", selectedDate);

    if (entryError) {
      console.error(entryError);
      return;
    }

    const { data: dispatchData, error: dispatchError } = await supabase
      .from("district_dispatches")
      .select("*")
      .lt("dispatch_date", selectedDate);

    if (dispatchError) {
      console.error(dispatchError);
      return;
    }

    const balanceMap: Record<string, number> = {};

    districts.forEach((district) => {
      const totalEntries =
        entryData
          ?.filter((e) => e.district === district)
          .reduce((sum, e) => sum + Number(e.weight || 0), 0) || 0;

      const totalDispatches =
        dispatchData
          ?.filter((d) => d.district === district)
          .reduce((sum, d) => sum + Number(d.dispatched_weight || 0), 0) || 0;

      balanceMap[district] = totalEntries - totalDispatches;
    });

    setPreviousBalances(balanceMap);
  }

  async function saveDispatch(
    district: string,
    total: number,
    overrideStatus?: boolean,
    overrideWeight?: number
  ) {
    const dispatched = overrideStatus !== undefined ? overrideStatus : dispatchStatus[district] || false;
    const dispatchedWeight = overrideWeight !== undefined ? overrideWeight : dispatchWeights[district] || 0;

    const openingBalance = previousBalances[district] || 0;
    const availableWeight = total;
    const balance = availableWeight - dispatchedWeight;

    if (dispatchedWeight > availableWeight) {
      alert("Dispatch weight cannot exceed available weight");
      return;
    }

    const { error } = await supabase
      .from("district_dispatches")
      .upsert(
        {
          dispatch_date: selectedDate,
          district,
          dispatched,
          opening_balance: openingBalance,
          total_available: availableWeight,
          dispatched_weight: dispatchedWeight,
          balance,
        },
        {
          onConflict: "dispatch_date,district",
        }
      );

    if (error) {
      alert(error.message);
      return;
    }

    console.log(
      `Saved ${district}. Balance = ${balance}`
    );

    await loadDispatches();
    await loadPreviousBalances();
  }

  const { districts: districtList, matrix } = useMemo(() => {
    const uniqueDistricts = districts;

    const dataMatrix: Record<string, Record<string | number, number>> = {};

    entries.forEach((entry) => {
      const dist = entry.district;
      const cid = entry.customer_id;
      const weight = Number(entry.weight) || 0;

      if (!dataMatrix[dist]) dataMatrix[dist] = {};
      if (!dataMatrix[dist][cid]) dataMatrix[dist][cid] = 0;

      dataMatrix[dist][cid] += weight;
    });

    return {
      districts: uniqueDistricts,
      matrix: dataMatrix,
    };
  }, [entries]);

  return (
    <main style={{ padding: "20px" }}>
      <h1>Dispatch Matrix</h1>
      <br />

      <label>Select Date:</label>
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
      />

      <br />
      <br />

      {loading && <p>Loading...</p>}

      {!loading && selectedDate && entries.length === 0 && (
        <p>
          No new entries for this date. Previous balances (if any) are shown
          below.
        </p>
      )}

      {districtList.length > 0 && !loading && (
        <table
          border={1}
          cellPadding={12}
          style={{
            borderCollapse: "collapse",
            width: "100%",
            textAlign: "center",
          }}
        >
          <thead>
            <tr>
              <th>District</th>
              {customers.map((customer) => (
                <th key={customer.id}>{customer.name}</th>
              ))}
              <th>Previous Balance</th>
              <th>Today's Entry</th>
              <th>Available</th>
              <th>Dispatched?</th>
              <th>Dispatch Weight</th>
              <th>Balance</th>
            </tr>
          </thead>

          <tbody>
            {districtList.map((district) => {
              const rowTotal = customers.reduce((sum, customer) => {
                return sum + (matrix[district]?.[customer.id] || 0);
              }, 0);

              const previousBalance = previousBalances[district] || 0;
              const currentBalance = rowTotal + previousBalance - (dispatchWeights[district] || 0);

              return (
                <tr
                  key={district}
                  style={{
                    backgroundColor:
                      currentBalance > 0 ? "#8B0000" : "transparent",
                    color:
                      currentBalance > 0 ? "white" : "inherit",
                    fontWeight:
                      currentBalance > 0 ? "bold" : "normal",
                  }}
                >
                  <td>
                    <strong>{district}</strong>
                  </td>

                  {customers.map((customer) => {
                    const weight = matrix[district]?.[customer.id] || 0;
                    return (
                      <td key={customer.id}>{weight > 0 ? weight : "-"}</td>
                    );
                  })}

                  <td>
                    {previousBalance}
                  </td>
                  <td>
                    {rowTotal}
                  </td>
                  <td>
                    {rowTotal + previousBalance}
                  </td>

                  <td>
                    <input
                      type="checkbox"
                      checked={dispatchStatus[district] || false}
                      onChange={async (e) => {
                        const checked = e.target.checked;
                        setDispatchStatus({
                          ...dispatchStatus,
                          [district]: checked,
                        });

                        await saveDispatch(
                          district,
                          rowTotal + previousBalance,
                          checked
                        );
                      }}
                      style={{
                        transform: "scale(1.2)",
                      }}
                    />
                  </td>

                  <td>
                    <input
                      type="number"
                      value={dispatchWeights[district] || ""}
                      onChange={(e) =>
                        setDispatchWeights({
                          ...dispatchWeights,
                          [district]: Number(e.target.value) || 0,
                        })
                      }
                      onBlur={(e) =>
                        saveDispatch(
                          district,
                          rowTotal + previousBalance,
                          undefined,
                          Number(e.target.value) || 0
                        )
                      }
                      style={{
                        width: "100px",
                        backgroundColor:
                          currentBalance > 0 ? "#8B0000" : "white",
                        color:
                          currentBalance > 0 ? "yellow" : "black",
                        fontWeight: "bold",
                        border: "1px solid #000",
                      }}
                    />
                  </td>

                  <td>
                    {currentBalance}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </main>
  );
}