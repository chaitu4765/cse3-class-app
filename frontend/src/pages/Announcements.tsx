import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import Sidebar from '../components/Sidebar';
import GlassCard from '../components/GlassCard';
import MobileMenu from '../components/MobileMenu';
import api from '../api/axios';

interface Announcement {
  id: string;
  title: string;
  message: string;
  createdAt: string;
}

const Announcements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if user is admin based on userType
    const userType = localStorage.getItem('userType');
    // Only admins (not students) can create announcements
    setIsAdmin(userType !== 'student');

    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await api.get('/announcements');
      setAnnouncements(response.data.announcements || response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!title || !content) {
      setError('Please fill in all fields');
      return;
    }

    setSubmitting(true);

    try {
      await api.post('/announcements', { title, message: content });
      setTitle('');
      setContent('');
      setSuccess('Announcement created successfully');
      // Refresh announcements
      await fetchAnnouncements();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) {
      return;
    }

    setDeleting(id);
    setError('');
    setSuccess('');

    try {
      await api.delete(`/announcements/${id}`);
      setSuccess('Announcement deleted successfully');
      // Refresh announcements
      await fetchAnnouncements();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete announcement');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-brand-light">
      <Sidebar />
      <MobileMenu />
      <div className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center md:text-left mb-12">
            <div className="inline-block px-4 py-1.5 mb-4 rounded-full bg-brand-muted border border-brand-dark/20">
              <span className="text-primary text-[10px] font-black uppercase tracking-[0.3em]">Class Updates</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-primary tracking-tight leading-none">
              Broadcasts<span className="opacity-10">.</span>
            </h1>
          </div>
          <p className="text-primary/40 font-black uppercase tracking-widest text-[10px]">Important updates and broadcasts</p>

          {/* Only show create form to admin users */}
          {isAdmin && (
            <GlassCard className="p-8 mb-12 border-primary/10">
              <div className="p-4 bg-primary/10 rounded-2xl mb-6 w-fit text-primary">
                <span className="text-2xl">📢</span>
              </div>
              <h2 className="text-4xl font-black text-secondary tracking-tight mb-4 uppercase">Post Announcement</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-primary/80 mb-2 font-medium">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter announcement title"
                    className="w-full"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-primary/80 mb-2 font-medium">Content</label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Enter announcement content"
                    className="w-full min-h-[120px]"
                    disabled={submitting}
                  />
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/50 text-red-600 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="bg-green-500/10 border border-green-500/50 text-green-600 px-4 py-3 rounded-lg">
                    {success}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Creating...' : 'Create Announcement'}
                </button>
              </form>
            </GlassCard>
          )}

          <div className="space-y-6">
            <h2 className="text-xl font-black text-primary mb-6 uppercase tracking-widest flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-accent"></span> Feed History
            </h2>
            {loading ? (
              <GlassCard className="p-8 text-center">
                <p className="text-text-secondary/60">Loading announcements...</p>
              </GlassCard>
            ) : announcements.length > 0 ? (
              announcements.map((announcement) => (
                <GlassCard key={announcement.id} className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-primary">{announcement.title}</h3>
                      <span className="text-sm text-text-secondary/50 block mt-1">
                        {new Date(announcement.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(announcement.id)}
                        disabled={deleting === announcement.id}
                        className="ml-4 px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deleting === announcement.id ? 'Deleting...' : 'Delete'}
                      </button>
                    )}
                    "
                  </div>
                  <p className="text-text-secondary">{announcement.message}</p>
                </GlassCard>
              ))
            ) : (
              <GlassCard className="p-8 text-center">
                <p className="text-text-secondary/60">No announcements yet</p>
              </GlassCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Announcements;
