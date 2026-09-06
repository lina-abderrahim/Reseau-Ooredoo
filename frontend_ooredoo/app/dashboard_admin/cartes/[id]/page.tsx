'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Map, User, Calendar, CheckCircle, XCircle,
  Clock, FileText, StickyNote, X, Send, Globe, Wifi, Radio, Link2
} from 'lucide-react';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';

const ReadOnlyMap = dynamic(() => import('@/components/ReadOnlyMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-50 animate-pulse flex items-center justify-center">
      <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Chargement de la carte...</p>
    </div>
  )
});

interface Carte {
  id: number;
  nom: string;
  description: string;
  statut: string;
  createdAt: string;
  commentaire_refus?: string;
  type_commentaire?: string;
  user?: { id: number; name: string; email: string } | null;
  polygones?: { id: number; coordinates: string; qualite: string }[];
  service_technologie?: {
    id: number;
    technology?: { nom_technologie: string };
    service?: { nom_service: string };
  } | null;
}

interface NoteOnMap {
  id: string;
  lat: number;
  lng: number;
  texte: string;
}

const QUALITE_COLOR_MAP: Record<string, string> = {
  bonne:    '#be1526',
  moyenne:  '#ff0921',
  mauvaise: '#d66064',
};

const QUALITE_LABEL_MAP: Record<string, string> = {
  bonne:    'Très bonne',
  moyenne:  'Bonne',
  mauvaise: 'Limitée',
};

export default function AdminCarteDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [carte, setCarte] = useState<Carte | null>(null);
  const [loading, setLoading] = useState(true);
  const [publierLoading, setPublierLoading] = useState(false);
  const [demandeLiee, setDemandeLiee] = useState<any>(null);

  const [etapeRefus, setEtapeRefus] = useState<null | 'choix' | 'rapport' | 'note'>(null);
  const [rapport, setRapport] = useState('');
  const [refusLoading, setRefusLoading] = useState(false);

  const [notes, setNotes] = useState<NoteOnMap[]>([]);
  const [notesConfirmees, setNotesConfirmees] = useState<NoteOnMap[]>([]);
  const [pendingNote, setPendingNote] = useState<{ lat: number; lng: number } | null>(null);
  const [noteTexte, setNoteTexte] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteInputPos, setNoteInputPos] = useState({ x: 0, y: 0 });

  useEffect(() => { fetchCarte(); }, [id]);

  const fetchCarte = async () => {
    try {
      const response = await fetch(`http://localhost:3000/cartes-couverture/${id}`);
      if (response.ok) {
        const data = await response.json();
        setCarte(data);
        if (data.statut === 'refuse' && data.type_commentaire === 'note' && data.commentaire_refus) {
          try {
            const parsedNotes = JSON.parse(data.commentaire_refus);
            setNotesConfirmees(parsedNotes);
            setNotes(parsedNotes);
          } catch (e) {
            console.error('Erreur parsing notes:', e);
          }
        }
        fetch('http://localhost:3000/demandes-cartes')
          .then(r => r.ok ? r.json() : [])
          .then(demandes => {
            const liee = Array.isArray(demandes)
              ? demandes.find((d: any) => Number(d.carte_id) === Number(data.id))
              : null;
            setDemandeLiee(liee || null);
          })
          .catch(() => setDemandeLiee(null));
      } else {
        toast.error('Erreur de chargement');
      }
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const renderCommentaireRefus = () => {
    if (!carte?.commentaire_refus) return null;
    if (carte.type_commentaire === 'note') {
      try {
        const notesList = JSON.parse(carte.commentaire_refus) as { lat: number; lng: number; texte: string }[];
        return (
          <div className="space-y-2 mt-2">
            {notesList.map((n, i) => (
              <div key={i} className="flex items-start gap-2 p-2 bg-white/60 rounded-xl border border-red-200">
                <span>📝</span>
                <p className="text-sm text-red-800 font-bold italic">{n.texte}</p>
              </div>
            ))}
          </div>
        );
      } catch {
        return <p className="text-sm text-red-800 font-medium mt-2">{carte.commentaire_refus}</p>;
      }
    }
    return <p className="text-sm text-red-800 font-medium whitespace-pre-line mt-2">{carte.commentaire_refus}</p>;
  };

  const handleAddNote = () => {
    if (!noteTexte.trim() || !pendingNote) return;
    const newNote: NoteOnMap = {
      id: Date.now().toString(),
      lat: pendingNote.lat,
      lng: pendingNote.lng,
      texte: noteTexte,
    };
    setNotes(prev => [...prev, newNote]);
    setShowNoteInput(false);
    setPendingNote(null);
    setNoteTexte('');
    toast.success('Note ajoutée');
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes(prev => prev.filter(n => n.id !== noteId));
    setNotesConfirmees(prev => prev.filter(n => n.id !== noteId));
  };

  const handleConfirmerRefusNotes = async () => {
    if (notes.length === 0) { toast.error('Veuillez ajouter au moins une note'); return; }
    const notesJson = JSON.stringify(notes.map(n => ({ lat: n.lat, lng: n.lng, texte: n.texte })));
    setRefusLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/cartes-couverture/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: 'refuse', commentaire_refus: notesJson, type_commentaire: 'note' }),
      });
      if (response.ok) {
        toast.success('Carte refusée avec notes');
        setCarte(prev => prev ? { ...prev, statut: 'refuse', commentaire_refus: notesJson, type_commentaire: 'note' } : prev);
        setNotesConfirmees([...notes]);
        setEtapeRefus(null);
      } else { toast.error('Erreur de mise à jour'); }
    } catch { toast.error('Erreur de connexion'); }
    finally { setRefusLoading(false); }
  };

  const handleConfirmerRefusRapport = async () => {
    if (!rapport.trim()) { toast.error('Veuillez saisir un rapport'); return; }
    setRefusLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/cartes-couverture/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: 'refuse', commentaire_refus: rapport, type_commentaire: 'rapport' }),
      });
      if (response.ok) {
        toast.success('Carte refusée avec rapport');
        setCarte(prev => prev ? { ...prev, statut: 'refuse', commentaire_refus: rapport, type_commentaire: 'rapport' } : prev);
        setEtapeRefus(null);
        setRapport('');
      } else { toast.error('Erreur de mise à jour'); }
    } catch { toast.error('Erreur de connexion'); }
    finally { setRefusLoading(false); }
  };

  const handleUpdateStatut = async (newStatut: string) => {
    try {
      const response = await fetch(`http://localhost:3000/cartes-couverture/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: newStatut }),
      });
      if (response.ok) {
        toast.success(
          newStatut === 'accepte' ? 'Carte acceptée' :
          newStatut === 'refuse'  ? 'Carte refusée' :
          newStatut === 'publie'  ? 'Carte publiée' : 'Statut mis à jour'
        );
        setCarte(prev => prev ? { ...prev, statut: newStatut } : prev);
        if (newStatut !== 'refuse') setEtapeRefus(null);
      } else { toast.error('Erreur lors du changement de statut'); }
    } catch { toast.error('Erreur de connexion'); }
  };

  const handlePublier = async () => {
    setPublierLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/cartes-couverture/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: 'publie' }),
      });
      if (response.ok) {
        toast.success('Carte publiée');
        setCarte(prev => prev ? { ...prev, statut: 'publie' } : prev);
      } else { toast.error('Erreur de publication'); }
    } catch { toast.error('Erreur de connexion'); }
    finally { setPublierLoading(false); }
  };

  const getStatutBadge = (statut: string) => {
    const styles: Record<string, { bg: string, text: string, icon: React.ReactNode, label: string }> = {
      en_attente: { bg: 'bg-amber-50 border-amber-200',     text: 'text-amber-700',   icon: <Clock size={14}/>,       label: 'En attente' },
      accepte:    { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', icon: <CheckCircle size={14}/>, label: 'Acceptée' },
      refuse:     { bg: 'bg-rose-50 border-rose-200',       text: 'text-rose-700',    icon: <XCircle size={14}/>,     label: 'Refusée' },
      publie:     { bg: 'bg-blue-50 border-blue-200',       text: 'text-blue-700',    icon: <Globe size={14}/>,       label: 'Publiée' },
    };
    const config = styles[statut] || styles.en_attente;
    return (
      <span className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-black uppercase tracking-widest ${config.bg} ${config.text}`}>
        {config.icon} {config.label}
      </span>
    );
  };

  const allNotes = notesConfirmees.length > 0 ? notesConfirmees : notes;

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-96 gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ED1C24]" />
      <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Chargement...</p>
    </div>
  );

  if (!carte) return (
    <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
      <Map className="mx-auto text-gray-300 mb-4" size={48} />
      <h3 className="text-xl font-black italic">CARTE INTROUVABLE</h3>
      <button onClick={() => router.push('/dashboard_admin/cartes')} className="mt-4 inline-block text-[#ED1C24] font-bold hover:underline">
        Retour à la liste
      </button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard_admin/cartes')} className="p-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-2xl shadow-sm transition-all group">
            <ArrowLeft size={20} className="text-gray-600 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-black italic uppercase tracking-tight">{carte.nom}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-gray-400 text-sm font-bold">Carte de couverture</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full" />
              <span className="text-[#ED1C24] text-sm font-black">ID #{carte.id}</span>
            </div>
          </div>
        </div>
        {getStatutBadge(carte.statut)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Panneau gauche */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Informations</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="p-2 bg-white rounded-xl shadow-sm text-[#ED1C24]"><User size={16} /></div>
                <div>
                  <p className="text-[9px] text-gray-400 font-black uppercase">Ingénieur</p>
                  <p className="font-black text-gray-900 text-sm">{carte.user?.name || 'Inconnu'}</p>
                  <p className="text-xs text-gray-400">{carte.user?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="p-2 bg-white rounded-xl shadow-sm text-[#ED1C24]"><Calendar size={16} /></div>
                <div>
                  <p className="text-[9px] text-gray-400 font-black uppercase">Date de création</p>
                  <p className="font-black text-gray-900 text-sm">
                    {new Date(carte.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="p-2 bg-white rounded-xl shadow-sm text-[#ED1C24]"><Wifi size={16} /></div>
                <div>
                  <p className="text-[9px] text-gray-400 font-black uppercase">Technologie</p>
                  <p className="font-black text-gray-900 text-sm">{carte.service_technologie?.technology?.nom_technologie || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="p-2 bg-white rounded-xl shadow-sm text-[#ED1C24]"><Radio size={16} /></div>
                <div>
                  <p className="text-[9px] text-gray-400 font-black uppercase">Service</p>
                  <p className="font-black text-gray-900 text-sm">{carte.service_technologie?.service?.nom_service || 'N/A'}</p>
                </div>
              </div>

              {carte.description && (
                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[9px] text-gray-400 font-black uppercase mb-1">Description</p>
                  <p className="text-sm text-gray-700 italic leading-relaxed">"{carte.description}"</p>
                </div>
              )}

              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-[9px] text-gray-400 font-black uppercase mb-2">Origine</p>
                {demandeLiee ? (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Link2 size={14} className="text-[#ED1C24] flex-shrink-0" />
                      <div>
                        <p className="text-xs font-black text-gray-900">Liée à une demande</p>
                        <p className="text-[10px] text-[#ED1C24] font-black">#{demandeLiee.id} — {demandeLiee.nom}</p>
                      </div>
                    </div>
                    <Link href={`/dashboard_admin/demandes/${demandeLiee.id}`}
                      className="text-[10px] font-black text-gray-400 hover:text-[#ED1C24] transition-colors underline whitespace-nowrap">
                      Voir
                    </Link>
                  </div>
                ) : (
                  <p className="text-xs font-black text-gray-500 flex items-center gap-2">
                    <span>🆓</span> Carte libre — sans demande
                  </p>
                )}
              </div>
            </div>

            {carte.polygones && carte.polygones.length > 0 && (
              <div>
                <p className="text-[9px] text-gray-400 font-black uppercase mb-2">Zones configurées</p>
                <div className="flex gap-2 flex-wrap">
                  {[...new Set(carte.polygones.map(p => p.qualite))].map((q, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-full text-[10px] font-black text-white"
                      style={{ backgroundColor: QUALITE_COLOR_MAP[q] || '#6b7280' }}>
                      {QUALITE_LABEL_MAP[q] || q}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {carte.statut === 'refuse' && carte.commentaire_refus && (
              <div className="bg-red-50 border-2 border-red-100 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  {carte.type_commentaire === 'rapport'
                    ? <FileText size={14} className="text-red-600" />
                    : <StickyNote size={14} className="text-red-600" />}
                  <p className="text-[9px] text-red-600 font-black uppercase">
                    {carte.type_commentaire === 'rapport' ? 'Rapport de refus' : 'Notes de correction'}
                  </p>
                </div>
                {renderCommentaireRefus()}
              </div>
            )}
          </div>

          {etapeRefus === 'note' && allNotes.length > 0 && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <p className="text-[9px] text-gray-400 font-black uppercase mb-3">Notes placées ({allNotes.length})</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {allNotes.map((note, idx) => (
                  <div key={note.id} className="flex items-start justify-between gap-2 p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-slate-800 mt-1.5 flex-shrink-0" />
                      <div>
                        <p className="text-[9px] text-gray-400 font-black uppercase">Point {idx + 1}</p>
                        <p className="text-xs text-gray-700 font-medium">{note.texte}</p>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteNote(note.id)} className="text-gray-400 hover:text-red-600 flex-shrink-0 mt-0.5 transition-colors">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {etapeRefus === null && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-3">
              <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Actions</h2>

              {carte.statut === 'en_attente' && (
                <>
                  <button onClick={() => handleUpdateStatut('accepte')}
                    className="w-full py-3.5 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all shadow-lg">
                    <CheckCircle size={18}/> Accepter la carte
                  </button>
                  <button onClick={() => setEtapeRefus('choix')}
                    className="w-full py-3.5 bg-[#ED1C24] text-white rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-black transition-all">
                    <XCircle size={18}/> Refuser la carte
                  </button>
                </>
              )}

              {carte.statut === 'accepte' && (
                <>
                  <button onClick={handlePublier} disabled={publierLoading}
                    className="w-full py-3.5 bg-[#ED1C24] text-white rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-black transition-all disabled:opacity-50 shadow-lg">
                    <Globe size={18}/> {publierLoading ? 'Publication...' : 'Publier la carte'}
                  </button>
                  <button onClick={() => handleUpdateStatut('en_attente')}
                    className="w-full py-3.5 bg-amber-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-amber-600 transition-all">
                    <Clock size={18}/> Repasser en attente
                  </button>
                  <button onClick={() => setEtapeRefus('choix')}
                    className="w-full py-3.5 bg-white text-rose-600 border border-rose-200 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-rose-50 transition-all">
                    <XCircle size={18}/> Refuser la carte
                  </button>
                </>
              )}

              {carte.statut === 'refuse' && (
                <>
                  <button onClick={() => handleUpdateStatut('en_attente')}
                    className="w-full py-3.5 bg-amber-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-amber-600 transition-all">
                    <Clock size={18}/> Repasser en attente
                  </button>
                  <button onClick={() => handleUpdateStatut('accepte')}
                    className="w-full py-3.5 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all">
                    <CheckCircle size={18}/> Accepter la carte
                  </button>
                </>
              )}

              {carte.statut === 'publie' && (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 text-center mb-2">
                    <p className="text-blue-700 font-black flex items-center justify-center gap-2 text-xs">
                      <Globe size={14}/> Visible publiquement
                    </p>
                  </div>
                  <button onClick={() => handleUpdateStatut('accepte')}
                    className="w-full py-3.5 bg-amber-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-amber-600 transition-all">
                    <CheckCircle size={18}/> Retirer du public
                  </button>
                  <button onClick={() => handleUpdateStatut('en_attente')}
                    className="w-full py-3.5 bg-white text-gray-600 border border-gray-200 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-gray-50 transition-all">
                    <Clock size={18}/> Revenir en attente
                  </button>
                </>
              )}
            </div>
          )}

          {etapeRefus === 'choix' && (
            <div className="bg-white rounded-3xl border border-rose-100 shadow-sm p-6 space-y-3">
              <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Type de refus</h2>
              <button onClick={() => setEtapeRefus('rapport')}
                className="w-full py-3.5 bg-gray-50 hover:bg-gray-100 text-gray-800 border border-gray-200 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all">
                <FileText size={16}/> Rapport textuel
              </button>
              <button onClick={() => setEtapeRefus('note')}
                className="w-full py-3.5 bg-gray-50 hover:bg-gray-100 text-gray-800 border border-gray-200 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all">
                <StickyNote size={16}/> Notes géolocalisées
              </button>
              <button onClick={() => setEtapeRefus(null)}
                className="w-full py-2.5 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all">
                Annuler
              </button>
            </div>
          )}

          {etapeRefus === 'rapport' && (
            <div className="bg-white rounded-3xl border border-rose-100 shadow-sm p-6 space-y-3">
              <h2 className="text-[10px] font-black text-rose-600 uppercase tracking-[0.2em]">Rapport de refus</h2>
              <textarea value={rapport} onChange={(e) => setRapport(e.target.value)}
                placeholder="Décrivez les raisons du refus..."
                className="w-full h-32 p-3 text-sm border-2 border-gray-100 rounded-2xl focus:outline-none focus:border-[#ED1C24] resize-none font-medium italic" />
              <button onClick={handleConfirmerRefusRapport} disabled={refusLoading}
                className="w-full py-3.5 bg-[#ED1C24] text-white rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-black transition-all disabled:opacity-50">
                {refusLoading ? 'Envoi...' : 'Confirmer le refus'}
              </button>
              <button onClick={() => { setEtapeRefus('choix'); setRapport(''); }}
                className="w-full py-2.5 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all">
                Retour
              </button>
            </div>
          )}

          {etapeRefus === 'note' && (
            <div className="bg-white rounded-3xl border border-rose-100 shadow-sm p-6 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#ED1C24] animate-pulse" />
                <h2 className="text-[10px] font-black text-rose-600 uppercase tracking-[0.2em]">Mode notes actif</h2>
              </div>
              <p className="text-xs text-gray-500 font-medium">Cliquez sur la carte pour ajouter des notes de correction.</p>
              <button onClick={handleConfirmerRefusNotes} disabled={refusLoading || notes.length === 0}
                className="w-full py-3.5 bg-[#ED1C24] text-white rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-black transition-all disabled:opacity-50">
                <Send size={16}/> {refusLoading ? 'Envoi...' : `Confirmer (${notes.length} note${notes.length > 1 ? 's' : ''})`}
              </button>
              <button onClick={() => {
                setNotes([]);
                setEtapeRefus(null);
                setShowNoteInput(false);
              }} className="w-full py-2.5 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all">
                Annuler
              </button>
            </div>
          )}
        </div>

        {/* Section carte */}
        <div className="lg:col-span-2 space-y-6">
          {etapeRefus === 'note' && (
            <div className="px-4 py-3 bg-[#ED1C24] text-white rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-wider shadow-lg">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              Clic court sur la carte pour épingler une note — glisser pour naviguer
            </div>
          )}

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center gap-2">
              <Map size={18} className="text-[#ED1C24]" />
              <span className="text-xs font-black uppercase tracking-widest">Aperçu géographique</span>
            </div>
            <div className="relative" style={{ height: '580px' }}>
              {/* ✅ polygons local + MVT SHP + mode note */}
              <ReadOnlyMap
                polygons={carte.polygones || []}
                carteId={carte.id}
                commentaire_refus={etapeRefus === 'note' ? undefined : carte.commentaire_refus}
                type_commentaire={etapeRefus === 'note' ? undefined : carte.type_commentaire}
                modeNote={etapeRefus === 'note'}
                notes={etapeRefus === 'note' ? notes : []}
                onMapClick={(lat, lng, x, y) => {
                  setPendingNote({ lat, lng });
                  setNoteInputPos({ x, y });
                  setNoteTexte('');
                  setShowNoteInput(true);
                }}
              />

              {etapeRefus === 'note' && showNoteInput && (
                <div className="absolute bg-white p-4 rounded-2xl shadow-2xl border border-gray-200 z-[1000] w-64 space-y-3"
                  style={{ top: `${noteInputPos.y + 10}px`, left: `${noteInputPos.x + 10}px` }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Nouvelle note</span>
                    <button onClick={() => { setShowNoteInput(false); setPendingNote(null); }} className="text-gray-400 hover:text-red-500">
                      <X size={14} />
                    </button>
                  </div>
                  <textarea value={noteTexte} onChange={(e) => setNoteTexte(e.target.value)}
                    placeholder="Décrivez le problème sur cette zone..."
                    className="w-full h-20 p-2.5 text-xs border-2 border-gray-100 rounded-xl focus:outline-none focus:border-[#ED1C24] resize-none font-medium italic" />
                  <button onClick={handleAddNote}
                    className="w-full py-2 bg-slate-900 text-white font-black rounded-xl text-xs uppercase tracking-widest hover:bg-black transition-colors">
                    Enregistrer
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}