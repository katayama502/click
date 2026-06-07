'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Mail, Lock, Eye, EyeOff, User, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, register } = useStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string; general?: string }>({});
  const [visible, setVisible] = useState(true);

  const switchMode = () => {
    setVisible(false);
    setTimeout(() => {
      setMode(prev => (prev === 'login' ? 'register' : 'login'));
      setErrors({});
      setEmail('');
      setName('');
      setPassword('');
      setShowPass(false);
      setVisible(true);
    }, 150);
  };

  const validate = () => {
    const errs: typeof errors = {};
    if (mode === 'register' && !name.trim()) errs.name = 'お名前を入力してください';
    if (!email.includes('@')) errs.email = '有効なメールアドレスを入力してください';
    if (password.length < 6) errs.password = 'パスワードは6文字以上で入力してください';
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    await new Promise(r => setTimeout(r, 400));

    if (mode === 'login') {
      const ok = await login(email, password);
      if (ok) {
        router.replace('/workspace');
      } else {
        setErrors({ general: 'メールアドレスまたはパスワードが間違っています' });
        setLoading(false);
      }
    } else {
      register(email, name, password);
      router.replace('/workspace');
    }
  };

  const inputClass = (hasError?: string) =>
    `w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors ${
      hasError ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white hover:border-gray-300'
    }`;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {/* Brand gradient top accent bar */}
      <div className="h-1 bg-gradient-to-r from-brand-400 via-brand to-brand-600 fixed top-0 left-0 right-0 z-50" />

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 bg-brand rounded-xl flex items-center justify-center shadow-sm">
            <span className="text-white font-black text-lg leading-none">C</span>
          </div>
          <span className="text-xl font-bold text-gray-900 tracking-tight">Click</span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
          {/* Header */}
          <div
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(6px)',
              transition: 'opacity 0.15s ease, transform 0.15s ease',
            }}
          >
            <h1 className="text-xl font-bold text-gray-900 mb-1">
              {mode === 'login' ? 'ログイン' : 'アカウント作成'}
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              {mode === 'login' ? 'アカウントにサインインしてください' : '無料ではじめましょう'}
            </p>

            {/* General error */}
            {errors.general && (
              <div className="mb-4 px-3 py-2.5 bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg">
                {errors.general}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Name (register only) */}
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">お名前</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className={inputClass(errors.name)}
                      placeholder="山田 太郎"
                    />
                  </div>
                  {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">メールアドレス</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className={inputClass(errors.email)}
                    placeholder="you@example.com"
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-gray-600">パスワード</label>
                  {mode === 'login' && (
                    <button type="button" className="text-xs text-brand hover:underline" tabIndex={-1}>
                      パスワードを忘れた方
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className={`${inputClass(errors.password)} pr-10`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {errors.password
                  ? <p className="mt-1 text-xs text-red-500">{errors.password}</p>
                  : mode === 'register' && <p className="mt-1 text-xs text-gray-400">6文字以上</p>
                }
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all duration-200 active:scale-[0.99] shadow-lg shadow-brand/20 flex items-center justify-center gap-2 text-sm mt-2"
              >
                {loading ? (
                  <><Loader2 size={14} className="animate-spin" />処理中...</>
                ) : mode === 'login' ? 'ログイン' : 'アカウントを作成'}
              </button>
            </form>

            {/* Demo login divider */}
            <div className="mt-5">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-white text-gray-400">またはデモで試す</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setVisible(false);
                  setTimeout(() => {
                    setMode('register');
                    setErrors({});
                    setEmail('demo@click.example.com');
                    setName('デモユーザー');
                    setPassword('demo123456');
                    setShowPass(false);
                    setVisible(true);
                  }, 150);
                }}
                className="mt-3 w-full border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <span className="text-base">🎮</span>
                デモアカウントで試す
              </button>
            </div>

            {/* Mode toggle */}
            <p className="mt-5 text-center text-xs text-gray-500">
              {mode === 'login' ? 'アカウントをお持ちでない方は' : 'すでにアカウントをお持ちの方は'}{' '}
              <button onClick={switchMode} className="text-brand hover:underline font-semibold">
                {mode === 'login' ? '新規登録' : 'ログイン'}
              </button>
            </p>
          </div>
        </div>

        {/* Tagline */}
        <p className="mt-4 text-center text-xs text-gray-400">
          ノーコードで、アイデアをアプリに。
        </p>
      </div>
    </div>
  );
}
