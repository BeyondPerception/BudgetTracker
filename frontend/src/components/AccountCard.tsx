'use client'

import Link from 'next/link'

interface AccountCardProps {
  icon: React.ReactNode
  name: string
  balance: string
  subtitle: string
  type: 'credit' | 'bank'
  id: string
}

export function AccountCard({
  icon,
  name,
  balance,
  subtitle,
  type,
  id
}: AccountCardProps) {
  return (
    <Link href={`/account/${type}/${id}`}>
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 cursor-pointer hover:shadow-md transition-shadow">
        <div className="flex items-start">
          <div className={`p-2 rounded-full mr-4 ${type === 'credit' ? 'bg-blue-50 text-blue-500' : 'bg-green-50 text-green-500'}`}>
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-800">{name}</h3>
            <p className="text-sm text-gray-500">{subtitle}</p>
            <p className="text-xl font-semibold mt-2">
              $
              {balance}
            </p>
            {type === 'credit' && <p className="text-xs text-gray-500 mt-1">Balance</p>}
          </div>
        </div>
      </div>
    </Link>
  )
}