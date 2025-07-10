import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import PartyDetail from './party-detail'
import type { Party } from '../lib/types'

export default function PartyList() {
  const [parties, setParties] = useState<Party[]>([])
  const [search, setSearch] = useState('')
  const [selectedParty, setSelectedParty] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('parties').select('*').then(({ data }) => setParties(data || []))
  }, [])

  const filtered = parties.filter(p =>
    p.name_en?.toLowerCase().includes(search.toLowerCase()) ||
    p.name_ar?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder='Search parties...'
      />
      <ul>
        {filtered.map(p => (
          <li key={p.id}>
            <button onClick={() => setSelectedParty(p.id)}>
              {p.name_en} / {p.name_ar}
            </button>
          </li>
        ))}
      </ul>
      {selectedParty && <PartyDetail partyId={Number(selectedParty)} />}
    </div>
  )
}