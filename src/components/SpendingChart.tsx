import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
export function SpendingChart() {
  // Mock data for monthly spending
  const spendingData = [{
    month: 'Jan',
    amount: 2400
  }, {
    month: 'Feb',
    amount: 1398
  }, {
    month: 'Mar',
    amount: 3200
  }, {
    month: 'Apr',
    amount: 2780
  }, {
    month: 'May',
    amount: 1890
  }, {
    month: 'Jun',
    amount: 2390
  }, {
    month: 'Jul',
    amount: 3490
  }];
  return <div className="w-full" style={{
    height: '300px'
  }}>
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={spendingData} margin={{
        top: 5,
        right: 30,
        left: 20,
        bottom: 5
      }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis tickFormatter={value => `$${value}`} />
        <Tooltip formatter={value => [`$${value}`, 'Spending']} />
        <Line type="monotone" dataKey="amount" stroke="#3B82F6" strokeWidth={2} dot={{
          r: 4
        }} activeDot={{
          r: 6
        }} />
      </LineChart>
    </ResponsiveContainer>
  </div>;
}