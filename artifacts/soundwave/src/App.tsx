import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import {
  AudioLines,
  Bookmark,
  BookmarkCheck,
  Check,
  ChevronRight,
  CircleMinus,
  Clock3,
  Heart,
  Headphones,
  Library,
  ListMusic,
  Music2,
  Pause,
  Pencil,
  Play,
  Plus,
  Search,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';

type Track = {
  id: string;
  title: string;
  artist: string;
  album: string;
  mood: string;
  duration: number;
  color: string;
  src: string;
};

type Playlist = { id: string; name: string; trackIds: string[] };
type Page = 'home' | 'search' | 'library' | 'favorites' | 'playlist';
type Modal =
  | { type: 'create' }
  | { type: 'rename'; playlistId: string }
  | { type: 'add'; trackId: string }
  | null;

const tracks: Track[] = [
  { id: 'tidepool', title: 'Tidepool Sketch', artist: 'nle.cc Studio', album: 'Little Weather', mood: 'Soft piano', duration: 228, color: 'linear-gradient(145deg,#d99b73,#b75e54 58%,#5b8175)', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 'open-window', title: 'Open Window', artist: 'nle.cc Studio', album: 'Rooms of Air', mood: 'Ambient', duration: 246, color: 'linear-gradient(145deg,#a6bd9b,#668878 58%,#3c645a)', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 'slow-orbit', title: 'Slow Orbit', artist: 'nle.cc Studio', album: 'Small Planets', mood: 'Warm synth', duration: 212, color: 'linear-gradient(145deg,#dfbd7f,#c97d61 58%,#8a695f)', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  { id: 'blue-hour', title: 'Blue Hour, Softly', artist: 'nle.cc Studio', album: 'After the Rain', mood: 'Piano & strings', duration: 264, color: 'linear-gradient(145deg,#91b2b0,#587f86 56%,#405c67)', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
  { id: 'paper-moon', title: 'Paper Moon', artist: 'nle.cc Studio', album: 'Little Weather', mood: 'Muted guitar', duration: 195, color: 'linear-gradient(145deg,#dbc08f,#cb8b6b 55%,#876c58)', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
  { id: 'still-garden', title: 'Still Garden', artist: 'nle.cc Studio', album: 'Green Things', mood: 'Field tones', duration: 237, color: 'linear-gradient(145deg,#aabd85,#759271 54%,#4c7062)', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3' },
];

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
};

function readStorage<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function Cover({ track, size = 'small' }: { track: Track; size?: 'small' | 'large' }) {
  return (
    <span className={`cover ${size}`} style={{ '--cover': track.color } as CSSProperties} aria-hidden="true">
      <AudioLines size={size === 'large' ? 28 : 17} strokeWidth={1.5} />
    </span>
  );
}

function EmptyState({ title, copy, action, onAction }: { title: string; copy: string; action?: string; onAction?: () => void }) {
  return (
    <div className="empty-state" data-testid="empty-state">
      <span className="empty-icon"><Music2 size={22} /></span>
      <h3>{title}</h3>
      <p>{copy}</p>
      {action && onAction && <button className="secondary-button" onClick={onAction} data-testid="button-empty-action">{action}</button>}
    </div>
  );
}

function App() {
  const [page, setPage] = useState<Page>('home');
  const [query, setQuery] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>(() => readStorage('soundwave:favorites', []));
  const [library, setLibrary] = useState<string[]>(() => readStorage('soundwave:library', []));
  const [playlists, setPlaylists] = useState<Playlist[]>(() => readStorage('soundwave:playlists', []));
  const [modal, setModal] = useState<Modal>(null);
  const [modalName, setModalName] = useState('');
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.72);
  const [toast, setToast] = useState('');
  const audioRef = useRef<HTMLAudioElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastVolume = useRef(0.72);

  useEffect(() => { localStorage.setItem('soundwave:favorites', JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => { localStorage.setItem('soundwave:library', JSON.stringify(library)); }, [library]);
  useEffect(() => { localStorage.setItem('soundwave:playlists', JSON.stringify(playlists)); }, [playlists]);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const track = tracks.find((item) => item.id === activeTrackId);
    if (track) {
      audio.src = track.src;
      audio.load();
      setCurrentTime(0);
    }
  }, [activeTrackId]);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing && activeTrackId) {
      void audio.play().catch(() => {
        setPlaying(false);
        notify('This demo audio could not start. Try again in a moment.');
      });
    } else {
      audio.pause();
    }
  }, [playing, activeTrackId]);
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);
  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const activeTrack = tracks.find((track) => track.id === activeTrackId) ?? null;
  const currentPlaylist = playlists.find((playlist) => playlist.id === selectedPlaylist) ?? null;
  const visibleTracks = useMemo(() => {
    if (page === 'favorites') return tracks.filter((track) => favorites.includes(track.id));
    if (page === 'library') return tracks.filter((track) => library.includes(track.id));
    if (page === 'playlist' && currentPlaylist) return currentPlaylist.trackIds.map((id) => tracks.find((track) => track.id === id)).filter((track): track is Track => Boolean(track));
    if (page === 'search') {
      const term = query.trim().toLowerCase();
      return term ? tracks.filter((track) => [track.title, track.artist, track.album, track.mood].some((value) => value.toLowerCase().includes(term))) : tracks;
    }
    return tracks;
  }, [page, favorites, library, currentPlaylist, query]);

  function notify(message: string) {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2400);
  }

  function openPage(nextPage: Page) {
    setPage(nextPage);
    if (nextPage !== 'playlist') setSelectedPlaylist(null);
  }

  function openPlaylist(id: string) {
    setSelectedPlaylist(id);
    setPage('playlist');
  }

  function playTrack(track: Track) {
    if (activeTrackId === track.id) {
      setPlaying((value) => !value);
      return;
    }
    setActiveTrackId(track.id);
    setPlaying(true);
  }

  function playNext(direction: number) {
    const currentIndex = tracks.findIndex((track) => track.id === activeTrackId);
    const nextIndex = currentIndex < 0 ? 0 : (currentIndex + direction + tracks.length) % tracks.length;
    setActiveTrackId(tracks[nextIndex].id);
    setPlaying(true);
  }

  function toggleFavorite(trackId: string) {
    const wasLiked = favorites.includes(trackId);
    setFavorites((items) => wasLiked ? items.filter((id) => id !== trackId) : [...items, trackId]);
    notify(wasLiked ? 'Removed from favorites' : 'Added to favorites');
  }

  function toggleLibrary(trackId: string) {
    const saved = library.includes(trackId);
    setLibrary((items) => saved ? items.filter((id) => id !== trackId) : [...items, trackId]);
    notify(saved ? 'Removed from your library' : 'Saved to your library');
  }

  function createPlaylist() {
    const name = modalName.trim();
    if (!name) return;
    const playlist = { id: `pl-${Date.now()}`, name, trackIds: [] };
    setPlaylists((items) => [...items, playlist]);
    setModalName('');
    setModal(null);
    openPlaylist(playlist.id);
    notify(`“${name}” is ready for a soundtrack`);
  }

  function renamePlaylist() {
    if (modal?.type !== 'rename') return;
    const name = modalName.trim();
    if (!name) return;
    setPlaylists((items) => items.map((item) => item.id === modal.playlistId ? { ...item, name } : item));
    setModalName('');
    setModal(null);
    notify('Playlist renamed');
  }

  function addTrackToPlaylist(playlistId: string, trackId: string) {
    const playlist = playlists.find((item) => item.id === playlistId);
    if (!playlist) return;
    if (playlist.trackIds.includes(trackId)) {
      notify('That track is already in this playlist');
      return;
    }
    setPlaylists((items) => items.map((item) => item.id === playlistId ? { ...item, trackIds: [...item.trackIds, trackId] } : item));
    setModal(null);
    notify(`Added to ${playlist.name}`);
  }

  function removeTrackFromPlaylist(playlistId: string, trackId: string) {
    setPlaylists((items) => items.map((item) => item.id === playlistId ? { ...item, trackIds: item.trackIds.filter((id) => id !== trackId) } : item));
    notify('Track removed from playlist');
  }

  function startPlaylist() {
    if (visibleTracks[0]) playTrack(visibleTracks[0]);
  }

  function selectPlaylistsForTrack(trackId: string) {
    setModal({ type: 'add', trackId });
  }

  function navButton(label: string, icon: ReactNode, target: Page, count?: number) {
    const isActive = page === target;
    return (
      <button className={`nav-item ${isActive ? 'active' : ''}`} onClick={() => openPage(target)} data-testid={`nav-${target}`}>
        {icon}<span>{label}</span>{typeof count === 'number' && count > 0 && <span className="nav-count">{count}</span>}
      </button>
    );
  }

  function TrackList({ items, removableFrom }: { items: Track[]; removableFrom?: string }) {
    if (!items.length) return null;
    return (
      <div className="track-list" data-testid="track-list">
        <div className="list-header"><span>#</span><span>Track</span><span className="hide-mobile">Mood</span><span className="hide-tablet">Collection</span><span><Clock3 size={13} /></span></div>
        {items.map((track, index) => {
          const isCurrent = activeTrackId === track.id;
          return (
            <div className={`track-row ${isCurrent ? 'is-playing' : ''}`} key={track.id} data-testid={`row-track-${track.id}`}>
              <button className="track-index icon-button" aria-label={`${playing && isCurrent ? 'Pause' : 'Play'} ${track.title}`} onClick={() => playTrack(track)} data-testid={`button-play-track-${track.id}`}>
                {playing && isCurrent ? <AudioLines size={16} /> : <span>{String(index + 1).padStart(2, '0')}</span>}
              </button>
              <div className="track-main">
                <Cover track={track} />
                <div style={{ minWidth: 0 }}>
                  <div className="track-title" data-testid={`text-track-title-${track.id}`}>{track.title}</div>
                  <div className="track-artist">{track.artist} · demo</div>
                </div>
              </div>
              <div className="track-album hide-mobile">{track.mood}</div>
              <div className="track-album hide-tablet">{track.album}</div>
              <div className="track-actions">
                <button className={`icon-button ${favorites.includes(track.id) ? 'liked' : ''}`} aria-label={`${favorites.includes(track.id) ? 'Remove favorite' : 'Add favorite'} ${track.title}`} title="Favorite" onClick={() => toggleFavorite(track.id)} data-testid={`button-favorite-${track.id}`}><Heart size={15} fill={favorites.includes(track.id) ? 'currentColor' : 'none'} /></button>
                {removableFrom ? (
                  <button className="icon-button" aria-label={`Remove ${track.title} from playlist`} title="Remove from playlist" onClick={() => removeTrackFromPlaylist(removableFrom, track.id)} data-testid={`button-remove-${track.id}`}><CircleMinus size={15} /></button>
                ) : (
                  <button className="icon-button" aria-label={`${library.includes(track.id) ? 'Remove from' : 'Save to'} library`} title={library.includes(track.id) ? 'In your library' : 'Save to library'} onClick={() => toggleLibrary(track.id)} data-testid={`button-library-${track.id}`}>{library.includes(track.id) ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}</button>
                )}
                <button className="icon-button" aria-label={`Add ${track.title} to playlist`} title="Add to playlist" onClick={() => selectPlaylistsForTrack(track.id)} data-testid={`button-add-playlist-${track.id}`}><Plus size={15} /></button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  const pageTitle = page === 'search' ? 'Find a feeling' : page === 'library' ? 'Your library' : page === 'favorites' ? 'Favorites' : page === 'playlist' ? currentPlaylist?.name ?? 'Playlist' : 'Your listening room';
  const displayedTrack = activeTrack ?? tracks[0];
  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div className="soundwave-app">
      <div className="app-shell">
        <aside className="sidebar">
          <button className="brand" onClick={() => openPage('home')} data-testid="button-brand-home">
            <span className="brand-mark"><AudioLines size={18} /></span><span className="brand-word">nle.cc</span><span className="brand-note">LISTEN CLOSELY</span>
          </button>
          <div className="sidebar-label">Your space</div>
          <nav className="nav-stack">
            {navButton('Home', <Headphones size={17} />, 'home')}
            {navButton('Discover', <Search size={17} />, 'search')}
            {navButton('Your library', <Library size={17} />, 'library', library.length)}
            {navButton('Favorites', <Heart size={17} />, 'favorites', favorites.length)}
          </nav>
          <div className="sidebar-rule" />
          <div className="collection-heading"><span>Playlists</span><button className="icon-button" onClick={() => { setModalName(''); setModal({ type: 'create' }); }} aria-label="Create playlist" data-testid="button-create-playlist"><Plus size={17} /></button></div>
          <nav className="playlist-nav" aria-label="Your playlists">
            {playlists.map((playlist) => (
              <button className={`playlist-link ${page === 'playlist' && selectedPlaylist === playlist.id ? 'active' : ''}`} key={playlist.id} onClick={() => openPlaylist(playlist.id)} data-testid={`nav-playlist-${playlist.id}`}>
                <span className="playlist-dot" /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{playlist.name}</span>
              </button>
            ))}
            {playlists.length === 0 && <span style={{ padding: '7px 10px', color: '#a0a398', fontSize: 11 }}>Your mixes will live here.</span>}
          </nav>
          <div className="sidebar-bottom">A small corner of the internet<br />for listening on purpose.</div>
        </aside>

        <main className="main-area">
          <header className="topbar">
            <div className="mobile-brand"><span className="brand-mark"><AudioLines size={15} /></span>nle.cc</div>
            <div className="crumb"><span>nle.cc</span><ChevronRight size={12} /><strong>{pageTitle}</strong></div>
            <div className="top-actions"><span className="demo-pill">Instrumental demos</span><span className="avatar-dot">NL</span></div>
          </header>
          <div className="content">
            {page === 'home' && (
              <>
                <section className="home-hero">
                  <div className="hero-copy">
                    <span className="eyebrow">A little room to listen</span>
                    <h1>Find your <em>next</em><br />favorite feeling.</h1>
                    <p>Somewhere between the songs you know and the ones you haven't met yet.</p>
                  </div>
                  <div className="hero-visual" aria-hidden="true">
                    <span className="orbit one" /><span className="orbit two" /><span className="hero-sun" /><span className="hero-stem" /><span className="hero-leaf a" /><span className="hero-leaf b" /><span className="hero-orbit-dot" />
                  </div>
                </section>
                <section aria-labelledby="recent-title">
                  <div className="section-head">
                    <div><h2 className="section-title" id="recent-title">Pick up the thread</h2><p className="section-subtitle">A few places to start wandering.</p></div>
                    <button className="text-action" onClick={() => openPage('search')} data-testid="button-browse-catalog">Browse all <ChevronRight size={14} /></button>
                  </div>
                  <div className="recent-grid">
                    {tracks.slice(0, 3).map((track) => (
                      <button className="recent-card" key={track.id} onClick={() => playTrack(track)} data-testid={`card-recent-${track.id}`}>
                        <Cover track={track} /><span className="recent-info"><strong>{track.title}</strong><span>{track.mood} · demo</span></span><span className="card-play">{activeTrackId === track.id && playing ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}</span>
                      </button>
                    ))}
                  </div>
                </section>
                <section>
                  <div className="section-head"><div><h2 className="section-title">Made for the moment</h2><p className="section-subtitle">Six instrumental demos, ready to make your own.</p></div><span className="eyebrow">01 — 06</span></div>
                  <TrackList items={tracks} />
                </section>
              </>
            )}

            {page === 'search' && (
              <>
                <div className="page-heading"><div><span className="eyebrow">Explore the catalog</span><h1>Find a feeling.</h1><p>Search by title, mood, or collection.</p></div><span className="eyebrow">DEMO CATALOG · 06</span></div>
                <label className="search-bar"><Search size={19} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try “soft piano” or “Little Weather”" aria-label="Search demo catalog" data-testid="input-search" />{query && <button className="icon-button" onClick={() => setQuery('')} aria-label="Clear search" data-testid="button-clear-search"><X size={16} /></button>}</label>
                <div className="search-meta">{query ? `${visibleTracks.length} ${visibleTracks.length === 1 ? 'result' : 'results'} for “${query}”` : 'All six instrumental demos'}</div>
                {visibleTracks.length ? <TrackList items={visibleTracks} /> : <EmptyState title="Nothing in this groove" copy="Try a different title, collection, or mood. The demo catalog is small, but there are a few corners to explore." action="Clear search" onAction={() => setQuery('')} />}
              </>
            )}

            {page === 'library' && (
              <>
                <div className="page-heading"><div><span className="eyebrow">Saved for later</span><h1>Your library.</h1><p>A pocket-sized home for tracks you want close.</p></div><span className="eyebrow">{library.length} SAVED</span></div>
                {visibleTracks.length ? <TrackList items={visibleTracks} /> : <EmptyState title="Make some room for music" copy="Save a track with the bookmark icon and it will be waiting here next time." action="Explore demos" onAction={() => openPage('search')} />}
                {playlists.length > 0 && (
                  <section style={{ marginTop: 40 }}>
                    <div className="section-head"><div><h2 className="section-title">Your playlists</h2><p className="section-subtitle">Little collections, made by you.</p></div><button className="text-action" onClick={() => { setModalName(''); setModal({ type: 'create' }); }} data-testid="button-library-create-playlist">Create new <Plus size={14} /></button></div>
                    <div className="recent-grid">
                      {playlists.map((playlist) => <button className="recent-card" key={playlist.id} onClick={() => openPlaylist(playlist.id)} data-testid={`card-playlist-${playlist.id}`}><span className="cover small" style={{ '--cover': 'linear-gradient(145deg,#edb37d,#cf765e 55%,#52796c)' } as CSSProperties}><ListMusic size={18} /></span><span className="recent-info"><strong>{playlist.name}</strong><span>{playlist.trackIds.length} {playlist.trackIds.length === 1 ? 'track' : 'tracks'}</span></span><ChevronRight className="card-play" size={16} /></button>)}
                    </div>
                  </section>
                )}
              </>
            )}

            {page === 'favorites' && (
              <>
                <div className="page-heading"><div><span className="eyebrow">Your own little radio</span><h1>Favorites.</h1><p>Tracks you want to come back to.</p></div><span className="eyebrow">{favorites.length} LIKED</span></div>
                {visibleTracks.length ? <><button className="primary-button" onClick={startPlaylist} style={{ marginBottom: 22 }} data-testid="button-play-favorites"><Play size={15} fill="currentColor" /> Play favorites</button><TrackList items={visibleTracks} /></> : <EmptyState title="The good ones go here" copy="Tap the heart on any demo track and it will find a home in your favorites." action="Find something" onAction={() => openPage('search')} />}
              </>
            )}

            {page === 'playlist' && currentPlaylist && (
              <>
                <section className="playlist-hero">
                  <div className="playlist-cover"><ListMusic size={35} strokeWidth={1.4} /></div>
                  <div className="playlist-description">
                    <span className="eyebrow">Your playlist</span>
                    <h1>{currentPlaylist.name}</h1>
                    <p>{currentPlaylist.trackIds.length} {currentPlaylist.trackIds.length === 1 ? 'track' : 'tracks'} · made by you</p>
                    <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
                      <button className="primary-button" onClick={startPlaylist} disabled={!visibleTracks.length} data-testid="button-play-playlist"><Play size={15} fill="currentColor" /> Play playlist</button>
                      <button className="secondary-button" onClick={() => { setModalName(currentPlaylist.name); setModal({ type: 'rename', playlistId: currentPlaylist.id }); }} data-testid="button-rename-playlist"><Pencil size={14} /> Rename</button>
                    </div>
                  </div>
                </section>
                {visibleTracks.length ? <TrackList items={visibleTracks} removableFrom={currentPlaylist.id} /> : <EmptyState title="A playlist with potential" copy="Add a demo track to start shaping this collection." action="Explore demos" onAction={() => openPage('search')} />}
                <div className="section-spacer" />
                <button className="text-action" onClick={() => openPage('search')} data-testid="button-add-from-catalog"><Plus size={14} /> Add tracks from catalog</button>
              </>
            )}
            {page === 'playlist' && !currentPlaylist && <EmptyState title="That playlist wandered off" copy="It may have been removed from this browser." action="Go home" onAction={() => openPage('home')} />}
          </div>
        </main>
      </div>

      <nav className="mobile-nav" aria-label="Main navigation">
        <button className={page === 'home' ? 'active' : ''} onClick={() => openPage('home')} data-testid="mobile-nav-home"><Headphones size={18} />Home</button>
        <button className={page === 'search' ? 'active' : ''} onClick={() => openPage('search')} data-testid="mobile-nav-search"><Search size={18} />Discover</button>
        <button className={page === 'library' ? 'active' : ''} onClick={() => openPage('library')} data-testid="mobile-nav-library"><Library size={18} />Library</button>
        <button className={page === 'favorites' ? 'active' : ''} onClick={() => openPage('favorites')} data-testid="mobile-nav-favorites"><Heart size={18} />Loved</button>
      </nav>

      <section className="player" aria-label="Audio player">
        <div className="player-track">
          <Cover track={displayedTrack} />
          <div className="player-meta"><strong data-testid="text-player-title">{activeTrack?.title ?? 'Pick a track to begin'}</strong><span data-testid="text-player-artist">{activeTrack ? `${activeTrack.artist} · demo` : 'Instrumental demo catalog'}</span></div>
          <button className={`icon-button player-heart ${activeTrack && favorites.includes(activeTrack.id) ? 'liked' : ''}`} onClick={() => activeTrack && toggleFavorite(activeTrack.id)} aria-label={activeTrack ? 'Toggle favorite' : 'No track selected'} disabled={!activeTrack} data-testid="button-player-favorite"><Heart size={16} fill={activeTrack && favorites.includes(activeTrack.id) ? 'currentColor' : 'none'} /></button>
        </div>
        <div className="player-center">
          <div className="transport">
            <button className="icon-button" aria-label="Previous track" onClick={() => playNext(-1)} data-testid="button-previous"><SkipBack size={17} fill="currentColor" /></button>
            <button className="icon-button main-play" aria-label={playing ? 'Pause' : 'Play'} onClick={() => activeTrack ? setPlaying((value) => !value) : playTrack(tracks[0])} data-testid="button-player-toggle">{playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}</button>
            <button className="icon-button" aria-label="Next track" onClick={() => playNext(1)} data-testid="button-next"><SkipForward size={17} fill="currentColor" /></button>
          </div>
          <div className="progress-line"><span data-testid="text-current-time">{formatTime(currentTime)}</span><input className="range" aria-label="Seek track" type="range" min="0" max={duration || activeTrack?.duration || 1} value={Math.min(currentTime, duration || activeTrack?.duration || 1)} onChange={(event) => { const next = Number(event.target.value); if (audioRef.current) audioRef.current.currentTime = next; setCurrentTime(next); }} style={{ '--progress': `${progress}%` } as CSSProperties} data-testid="input-seek" /><span data-testid="text-duration">{formatTime(duration || activeTrack?.duration || 0)}</span></div>
        </div>
        <div className="volume-area">
          <button className="icon-button" aria-label={volume === 0 ? 'Unmute' : 'Mute'} onClick={() => { if (volume > 0) { lastVolume.current = volume; setVolume(0); } else setVolume(lastVolume.current || 0.72); }} data-testid="button-mute">{volume === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}</button>
          <input className="range" type="range" min="0" max="1" step="0.01" value={volume} aria-label="Volume" onChange={(event) => setVolume(Number(event.target.value))} style={{ '--progress': `${volume * 100}%` } as CSSProperties} data-testid="input-volume" />
        </div>
      </section>
      <audio ref={audioRef} preload="none" onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)} onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)} onDurationChange={(event) => setDuration(event.currentTarget.duration)} onEnded={() => playNext(1)} onError={() => { if (activeTrackId) notify('Demo audio is temporarily unavailable.'); }} data-testid="audio-player" />

      {toast && <div className="toast" role="status" data-testid="status-toast">{toast}</div>}
      {modal && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(null); }} data-testid="modal-backdrop">
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            {modal.type === 'add' ? (
              <>
                <div className="modal-head"><div><h2 id="modal-title">Add to a playlist</h2><p>Choose a collection for this track.</p></div><button className="icon-button" onClick={() => setModal(null)} aria-label="Close" data-testid="button-close-modal"><X size={17} /></button></div>
                <div className="playlist-pick-list">
                  {playlists.map((playlist) => {
                    const alreadyAdded = playlist.trackIds.includes(modal.trackId);
                    return <button className="playlist-pick" key={playlist.id} onClick={() => addTrackToPlaylist(playlist.id, modal.trackId)} data-testid={`button-pick-playlist-${playlist.id}`}><span className="playlist-dot" /><span>{playlist.name}</span><span style={{ marginLeft: 'auto', color: '#929a8f', fontSize: 11 }}>{playlist.trackIds.length} tracks</span>{alreadyAdded && <Check size={16} />}</button>;
                  })}
                  {playlists.length === 0 && <EmptyState title="Start with a playlist" copy="Create a collection, then add this track to it." />}
                </div>
                <div className="modal-actions"><button className="secondary-button" onClick={() => { setModalName(''); setModal({ type: 'create' }); }} data-testid="button-create-from-add"><Plus size={14} /> New playlist</button></div>
              </>
            ) : (
              <>
                <div className="modal-head"><div><h2 id="modal-title">{modal.type === 'create' ? 'Make a new playlist' : 'Give it a new name'}</h2><p>{modal.type === 'create' ? 'Start a collection for wherever the day goes.' : 'A good name sets the whole mood.'}</p></div><button className="icon-button" onClick={() => setModal(null)} aria-label="Close" data-testid="button-close-modal"><X size={17} /></button></div>
                <form onSubmit={(event) => { event.preventDefault(); modal.type === 'create' ? createPlaylist() : renamePlaylist(); }}>
                  <label htmlFor="playlist-name">Playlist name</label>
                  <input id="playlist-name" autoFocus maxLength={48} value={modalName} onChange={(event) => setModalName(event.target.value)} placeholder="A name that sounds like you" data-testid="input-playlist-name" />
                  <div className="modal-actions"><button className="secondary-button" type="button" onClick={() => setModal(null)} data-testid="button-cancel-modal">Cancel</button><button className="primary-button" type="submit" disabled={!modalName.trim()} data-testid="button-save-playlist">{modal.type === 'create' ? 'Create playlist' : 'Save name'}</button></div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
