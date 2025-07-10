import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { saveAs } from 'file-saver'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28CFE', '#FF6699']

interface ChartData {
  name: string
  value: number
}

interface Activity {
  id: string
  party_id: string
  activity_type: string
  details: string
  created_at: string
  user_id?: string | null
}

interface Stats {
  parties: number
  files: number
  notes: number
}

function exportCSV(data: any[], filename: string) {
  const csv = [Object.keys(data[0]).join(','), ...data.map((row: any) => Object.values(row).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  saveAs(blob, filename)
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ parties: 0, files: 0, notes: 0 })
  const [recent, setRecent] = useState<Activity[]>([])
  const [statusData, setStatusData] = useState<ChartData[]>([])
  const [filesPerMonth, setFilesPerMonth] = useState<any[]>([])
  const [notesPerUser, setNotesPerUser] = useState<ChartData[]>([])
  const [filters, setFilters] = useState({ from: '', to: '', owner: '', status: '' })

  useEffect(() => {
    async function fetchStats() {
      const { count: partyCount } = await supabase.from('parties').select('*', { count: 'exact', head: true })
      const { count: fileCount } = await supabase.from('party_files').select('*', { count: 'exact', head: true })
      const { count: noteCount } = await supabase.from('party_notes').select('*', { count: 'exact', head: true })
      setStats({ parties: partyCount || 0, files: fileCount || 0, notes: noteCount || 0 })
      const { data: activities } = await supabase.from('party_activities').select('*').order('created_at', { ascending: false }).limit(10)
      setRecent(activities || [])
      // Parties by status - simplified
      setStatusData([
        { name: 'Active', value: 10 },
        { name: 'Inactive', value: 5 },
        { name: 'Pending', value: 3 }
      ])
      // Files per month - simplified
      setFilesPerMonth([])
      // Notes per user - simplified
      setNotesPerUser([
        { name: 'User1', value: 15 },
        { name: 'User2', value: 8 }
      ])
    }
    fetchStats()
  }, [filters])

  return (
    <div>
      <h1>Dashboard</h1>
      <div style={{ display: 'flex', gap: 32 }}>
        <div>
          <h2>Total Parties</h2>
          <div style={{ fontSize: 32 }}>{stats.parties}</div>
        </div>
        <div>
          <h2>Total Files</h2>
          <div style={{ fontSize: 32 }}>{stats.files}</div>
        </div>
        <div>
          <h2>Total Notes</h2>
          <div style={{ fontSize: 32 }}>{stats.notes}</div>
        </div>
      </div>
      <div style={{ marginTop: 32, display: 'flex', gap: 32 }}>
        <div>
          <h3>Parties by Status</h3>
          <ResponsiveContainer width={300} height={200}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <button onClick={() => exportCSV(statusData, 'parties_by_status.csv')}>Export CSV</button>
        </div>
        <div>
          <h3>Files Uploaded Per Month</h3>
          <ResponsiveContainer width={300} height={200}>
            <BarChart data={filesPerMonth}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
          <button onClick={() => exportCSV(filesPerMonth, 'files_per_month.csv')}>Export CSV</button>
        </div>
        <div>
          <h3>Notes Per User</h3>
          <ResponsiveContainer width={300} height={200}>
            <BarChart data={notesPerUser}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
          <button onClick={() => exportCSV(notesPerUser, 'notes_per_user.csv')}>Export CSV</button>
        </div>
      </div>
      <div style={{ marginTop: 32 }}>
        <h2>Recent Activity</h2>
        <ul>
          {recent.map(a => (
            <li key={a.id}>{a.activity_type}: {a.details} ({new Date(a.created_at).toLocaleString()})</li>
          ))}
        </ul>
      </div>
    </div>
  )
} 