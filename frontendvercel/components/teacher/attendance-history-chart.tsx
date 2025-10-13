"use client"

import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface AttendanceData {
  session: number
  date: string
  expected: number
  attended: number
}

interface AttendanceHistoryChartProps {
  data: AttendanceData[]
}

export function AttendanceHistoryChart({ data }: AttendanceHistoryChartProps) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#C2A68C" opacity={0.2} />
        <XAxis dataKey="session" label={{ value: "Session", position: "insideBottom", offset: -5 }} stroke="#5D866C" />
        <YAxis label={{ value: "Students", angle: -90, position: "insideLeft" }} stroke="#5D866C" />
        <Tooltip
          contentStyle={{
            backgroundColor: "#E6D8C3",
            border: "2px solid #C2A68C",
            borderRadius: "8px",
          }}
          labelFormatter={(value) => `Session ${value}`}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="expected"
          stroke="#C2A68C"
          strokeWidth={2}
          name="Expected Students"
          dot={{ fill: "#C2A68C", r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="attended"
          stroke="#5D866C"
          strokeWidth={3}
          name="Attended Students"
          dot={{ fill: "#5D866C", r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
