import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import apiClient from '../../lib/apiClient';
import { Plus, Edit, Trash2 } from 'lucide-react';

const PostForm = ({ post, onSave, onCancel }) => {
    const [title, setTitle] = useState(post?.title || '');
    const [slug, setSlug] = useState(post?.slug || '');
    const [excerpt, setExcerpt] = useState(post?.excerpt || '');
    const [content, setContent] = useState(post?.content || '');
    const [isPublished, setIsPublished] = useState(post?.is_published || false);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ ...post, title, slug, excerpt, content, is_published: isPublished });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-dark-card-bg p-6 rounded-2xl shadow-soft-lg">
            <h2 className="text-2xl font-black text-text-primary dark:text-dark-text-primary">
                {post ? 'Editar' : 'Crear'} Publicación
            </h2>
            <div>
                <label className="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary">Título</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full mt-1 p-2 border rounded-lg dark:bg-dark-bg dark:border-dark-border-color" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary">Slug</label>
                <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full mt-1 p-2 border rounded-lg dark:bg-dark-bg dark:border-dark-border-color" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary">Extracto</label>
                <textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} className="w-full mt-1 p-2 border rounded-lg dark:bg-dark-bg dark:border-dark-border-color" rows="3"></textarea>
            </div>
            <div>
                <label className="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary">Contenido (HTML)</label>
                <textarea value={content} onChange={(e) => setContent(e.target.value)} className="w-full mt-1 p-2 border rounded-lg dark:bg-dark-bg dark:border-dark-border-color" rows="10"></textarea>
            </div>
             <div className="flex items-center">
                <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} id="isPublished" className="h-4 w-4 text-primary rounded" />
                <label htmlFor="isPublished" className="ml-2 block text-sm text-text-secondary dark:text-dark-text-secondary">Publicado</label>
            </div>
            <div className="flex justify-end gap-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg text-text-secondary dark:text-dark-text-secondary hover:bg-gray-200 dark:hover:bg-dark-bg">
                    Cancelar
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark">
                    Guardar
                </button>
            </div>
        </form>
    );
};


export default function AdminBlog() {
    const [posts, setPosts] = useState([]);
    const [editingPost, setEditingPost] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();

    const fetchPosts = async () => {
        try {
            const response = await apiClient.get('/blog/posts');
            setPosts(response.data || []);
        } catch (error) {
            console.error("Error fetching posts", error);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);
    
    const handleSave = async (postData) => {
        try {
            if (postData.id) {
                await apiClient.put(`/admin/blog/${postData.id}`, postData);
            } else {
                await apiClient.post('/admin/blog', postData);
            }
            setShowForm(false);
            setEditingPost(null);
            fetchPosts();
        } catch (error) {
            console.error("Error saving post", error);
        }
    };
    
    const handleDelete = async (postId) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar esta publicación?')) {
            try {
                // The backend does not have a delete endpoint yet, so this will fail.
                // I will add it as a comment for now.
                // await apiClient.delete(`/admin/blog/${postId}`);
                console.log(`(Simulado) Eliminar post con ID: ${postId}`);
                fetchPosts();
            } catch (error) {
                console.error("Error deleting post", error);
            }
        }
    };

    return (
        <div className="min-h-screen bg-bg-light dark:bg-dark-bg py-12">
            <div className="container mx-auto px-6">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl font-black text-text-primary dark:text-dark-text-primary">Administrar Blog</h1>
                    <button onClick={() => { setEditingPost(null); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark">
                        <Plus size={20} />
                        Crear Publicación
                    </button>
                </div>

                {showForm && (
                    <div className="mb-8">
                        <PostForm 
                            post={editingPost} 
                            onSave={handleSave}
                            onCancel={() => { setShowForm(false); setEditingPost(null); }}
                        />
                    </div>
                )}

                <div className="bg-white dark:bg-dark-card-bg p-8 rounded-2xl shadow-soft-lg">
                    <h2 className="text-2xl font-black text-text-primary dark:text-dark-text-primary mb-6">Publicaciones Existentes</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b dark:border-dark-border-color">
                                    <th className="py-3 px-6">Título</th>
                                    <th className="py-3 px-6">Slug</th>
                                    <th className="py-3 px-6">Estado</th>
                                    <th className="py-3 px-6">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {posts.map(post => (
                                    <tr key={post.id} className="border-b dark:border-dark-border-color">
                                        <td className="py-4 px-6">{post.title}</td>
                                        <td className="py-4 px-6">{post.slug}</td>
                                        <td className="py-4 px-6">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                post.is_published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {post.is_published ? 'Publicado' : 'Borrador'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 flex gap-2">
                                            <button onClick={() => { setEditingPost(post); setShowForm(true); }} className="p-2 hover:bg-gray-200 dark:hover:bg-dark-bg rounded-full">
                                                <Edit size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(post.id)} className="p-2 hover:bg-gray-200 dark:hover:bg-dark-bg rounded-full text-red-500">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
