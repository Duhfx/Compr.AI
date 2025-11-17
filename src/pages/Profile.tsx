// src/pages/Profile.tsx
// Página nativa de perfil do usuário (substitui o modal)

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Save, Loader2, ArrowLeft, LogOut } from 'lucide-react';
import { useUserProfile } from '../hooks/useUserProfile';
import { useDeviceId } from '../hooks/useDeviceId';
import { useAuth } from '../contexts/AuthContext';
import { BottomTabBar } from '../components/layout/BottomTabBar';
import toast, { Toaster } from 'react-hot-toast';

export const Profile = () => {
  const navigate = useNavigate();
  const deviceId = useDeviceId();
  const { profile, loading: profileLoading, updateProfile } = useUserProfile();
  const { signOut } = useAuth();

  const [nickname, setNickname] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar nickname atual
  useEffect(() => {
    if (profile) {
      setNickname(profile.nickname);
      setError(null);
    }
  }, [profile]);

  const handleSave = async () => {
    if (!nickname.trim()) {
      setError('Por favor, insira um nome');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await updateProfile(nickname.trim());

      toast.success('Perfil atualizado com sucesso!');

      // Voltar após salvar
      setTimeout(() => {
        navigate(-1);
      }, 1000);
    } catch (err) {
      console.error('Erro ao salvar perfil:', err);
      setError(err instanceof Error ? err.message : 'Erro ao salvar perfil');
      toast.error('Erro ao salvar perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    if (confirm('Deseja realmente sair?')) {
      try {
        await signOut();
        navigate('/');
        toast.success('Você saiu da sua conta');
      } catch (error) {
        console.error('Erro ao sair:', error);
        toast.error('Erro ao sair');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-screen-sm mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <h1 className="text-[20px] font-semibold text-gray-900 dark:text-white">
              Meu Perfil
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-screen-sm mx-auto px-4 py-6 pb-28 space-y-6">
        {/* Profile Icon */}
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
            <User className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Device ID Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
          <label className="block text-[13px] font-medium text-gray-500 dark:text-gray-400 mb-2">
            ID do Dispositivo
          </label>
          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <code className="text-xs text-gray-600 dark:text-gray-400 font-mono break-all">
              {deviceId || 'Carregando...'}
            </code>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Este ID identifica seu dispositivo de forma única
          </p>
        </div>

        {/* Nickname Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
          <label htmlFor="nickname" className="block text-[13px] font-medium text-gray-500 dark:text-gray-400 mb-2">
            Nome de exibição <span className="text-red-500">*</span>
          </label>
          <input
            id="nickname"
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Ex: João Silva"
            disabled={profileLoading || saving}
            maxLength={50}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="words"
            spellCheck="false"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Este nome será exibido para outros membros das listas compartilhadas
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={profileLoading || saving || !nickname.trim()}
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Salvar Alterações
            </>
          )}
        </button>

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          className="w-full py-3 px-4 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 border border-red-200 dark:border-red-800"
        >
          <LogOut className="w-5 h-5" />
          Sair da Conta
        </button>
      </div>

      {/* Bottom Tab Bar */}
      <BottomTabBar />
    </div>
  );
};
