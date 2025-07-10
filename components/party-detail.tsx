import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useUserRole } from '../hooks/useUserRole'
import { PartyNote, PartyTag, PartyActivity, PartyFile } from '../lib/types';
import { User } from '@supabase/supabase-js';

export default function PartyDetail({ partyId }: { partyId: number }) {
  const [user, setUser] = useState<User | null>(null)
  const role = useUserRole()
  const [notes, setNotes] = useState<PartyNote[]>([])
  const [tags, setTags] = useState<PartyTag[]>([])
  const [activities, setActivities] = useState<PartyActivity[]>([])
  const [noteInput, setNoteInput] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [ownerId, setOwnerId] = useState<string | null>(null)
  const [users, setUsers] = useState<{ id: string; full_name: string | null }[]>([])
  const [files, setFiles] = useState<PartyFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Get current user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!partyId) return;
    const partyIdStr = partyId.toString();
    // Fetch notes, tags, activities, and party owner
    supabase.from('party_notes').select('*').eq('party_id', partyIdStr).then(({ data }) => setNotes(data as unknown as PartyNote[] || []))
    supabase.from('party_tags').select('*').eq('party_id', partyIdStr).then(({ data }) => setTags(data as unknown as PartyTag[] || []))
    supabase.from('party_activities').select('*').eq('party_id', partyIdStr).then(({ data }) => setActivities(data as unknown as PartyActivity[] || []))
    supabase.from('parties').select('owner_id').eq('id', partyIdStr).single().then(({ data }) => setOwnerId(data?.owner_id || null))
    supabase.from('profiles').select('id, full_name').then(({ data }) => setUsers((data || []).map(u => ({ id: u.id, full_name: u.full_name ?? null }))))
    supabase.from('party_files').select('*').eq('party_id', partyIdStr).then(({ data }) => setFiles(data as unknown as PartyFile[] || []))
  }, [partyId])

  const addNote = async () => {
    if (!noteInput || !user) return
    await supabase.from('party_notes').insert({ party_id: partyId.toString(), user_id: user.id, note: noteInput })
    setNoteInput('')
    supabase.from('party_notes').select('*').eq('party_id', partyId.toString()).then(({ data }) => setNotes(data as unknown as PartyNote[] || []))
  }

  const addTag = async () => {
    if (!tagInput) return
    await supabase.from('party_tags').insert({ party_id: partyId.toString(), tag: tagInput })
    setTagInput('')
    supabase.from('party_tags').select('*').eq('party_id', partyId.toString()).then(({ data }) => setTags(data as unknown as PartyTag[] || []))
  }

  const changeOwner = async (newOwnerId: string) => {
    await supabase.from('parties').update({ owner_id: newOwnerId }).eq('id', partyId.toString())
    setOwnerId(newOwnerId)
  }

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0]
    if (!file || !user) return
    const filePath = `${partyId}/${Date.now()}_${file.name}`
    const { error } = await supabase.storage.from('party-files').upload(filePath, file)
    if (error) return alert('Upload error: ' + error.message)
    const { data: { publicUrl } } = supabase.storage.from('party-files').getPublicUrl(filePath)
    await supabase.from('party_files').insert({
      party_id: partyId.toString(),
      user_id: user.id,
      file_name: file.name,
      file_url: publicUrl
    })
    supabase.from('party_files').select('*').eq('party_id', partyId.toString()).then(({ data }) => setFiles(data as unknown as PartyFile[] || []))
  }

  const deleteFile = async (file: PartyFile) => {
    if (!user) return;
    // Only allow if user is uploader, party owner, or admin
    if (
      user.id === file.user_id ||
      user.id === ownerId ||
      role === 'admin'
    ) {
      // Remove from storage
      const filePath = file.file_url.split('/party-files/')[1]
      await supabase.storage.from('party-files').remove([filePath])
      // Remove from DB
      await supabase.from('party_files').delete().eq('id', file.id)
      supabase.from('party_files').select('*').eq('party_id', partyId.toString()).then(({ data }) => setFiles(data as unknown as PartyFile[] || []))
    } else {
      alert('You do not have permission to delete this file.')
    }
  }

  return (
    <div>
      <h2>Party Details</h2>
      <div>
        <label>Owner:</label>
        <select value={ownerId || ''} onChange={e => changeOwner(e.target.value)}>
          <option value="">Unassigned</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
        </select>
      </div>
      <div>
        <h3>Notes</h3>
        <ul>
          {notes.map(n => <li key={n.id}>{n.note}</li>)}
        </ul>
        <input value={noteInput} onChange={e => setNoteInput(e.target.value)} placeholder="Add note..." />
        <button onClick={addNote}>Add Note</button>
      </div>
      <div>
        <h3>Tags</h3>
        <ul>
          {tags.map(t => <li key={t.id}>{t.tag}</li>)}
        </ul>
        <input value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="Add tag..." />
        <button onClick={addTag}>Add Tag</button>
      </div>
      <div>
        <h3>Activity Log</h3>
        <ul>
          {activities.map(a => <li key={a.id}>{a.activity_type}: {a.details}</li>)}
        </ul>
      </div>
      <div>
        <h3>Files</h3>
        <input type="file" ref={fileInputRef} onChange={uploadFile} />
        <ul>
          {files.map(f => (
            <li key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Preview logic */}
              {f.file_name.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                <img src={f.file_url} alt={f.file_name} style={{ width: 40, height: 40, objectFit: 'cover' }} />
              ) : f.file_name.match(/\.pdf$/i) ? (
                <span style={{ fontSize: 24, marginRight: 8 }}>📄</span>
              ) : null}
              <a href={f.file_url} target="_blank" rel="noopener noreferrer">{f.file_name}</a>
              {user && (user.id === f.user_id || user.id === ownerId || role === 'admin') && (
                <button onClick={() => deleteFile(f)} style={{ marginLeft: 8, color: 'red' }}>Delete</button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}