'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { SpendingData } from '@/lib/types'

interface SpendingChartProps {
  month: string
  spendingData: SpendingData[]
}

export function SpendingChart(props: SpendingChartProps) {
  return (
    <div className="w-full" style={{ height: '300px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={props.spendingData} margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5
        }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="dayOfMonth" />
          <YAxis tickFormatter={value => `$${value}`} />
          <Tooltip formatter={value => [`$${value}`, `${props.month}'s Spend`]} />
          <Line 
            type="monotone" 
            dataKey="amount" 
            stroke="#3B82F6" 
            strokeWidth={2} 
            dot={{ r: 4 }} 
            activeDot={{ r: 6 }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}