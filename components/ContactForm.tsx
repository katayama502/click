'use client';

import { useState } from 'react';

type FormState = 'idle' | 'submitting' | 'success' | 'error';

export default function ContactForm() {
  const [state, setState] = useState<FormState>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(form: HTMLFormElement): Record<string, string> {
    const errs: Record<string, string> = {};
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const message = (form.elements.namedItem('message') as HTMLTextAreaElement).value;
    const agree = (form.elements.namedItem('agree') as HTMLInputElement).checked;

    if (!name.trim()) errs.name = '氏名を入力してください';
    if (!email.trim()) {
      errs.email = 'メールアドレスを入力してください';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = '有効なメールアドレスを入力してください';
    }
    if (!message.trim()) {
      errs.message = 'お問い合わせ内容を入力してください';
    } else if (message.length > 2000) {
      errs.message = '2,000文字以内で入力してください';
    }
    if (!agree) errs.agree = 'プライバシーポリシーへの同意が必要です';
    return errs;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setState('submitting');
    // Simulate sending (no real backend)
    await new Promise((r) => setTimeout(r, 800));
    setState('success');
  };

  if (state === 'success') {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-[var(--green-l)] rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-[var(--green)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-[var(--ink)] mb-2">送信完了しました</h3>
        <p className="text-[var(--gray)] text-sm">
          お問い合わせありがとうございます。<br />
          担当者より2営業日以内にご連絡いたします。
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FormField
          label="所属・会社名"
          name="company"
          placeholder="例: 株式会社〇〇"
          error={errors.company}
        />
        <FormField
          label="お名前 *"
          name="name"
          placeholder="例: 山田 太郎"
          error={errors.name}
          required
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FormField
          label="メールアドレス *"
          name="email"
          type="email"
          placeholder="例: taro@example.com"
          error={errors.email}
          required
        />
        <FormField
          label="電話番号"
          name="phone"
          type="tel"
          placeholder="例: 03-0000-0000"
          error={errors.phone}
        />
      </div>
      <FormField
        label="利用人数の目安"
        name="users"
        placeholder="例: 10〜50名"
        error={errors.users}
      />
      <div>
        <label className="block text-sm font-semibold text-[var(--ink)] mb-1.5">
          お問い合わせ内容 *
        </label>
        <textarea
          name="message"
          rows={4}
          placeholder="ご質問・ご要望をお書きください（2,000文字以内）"
          maxLength={2000}
          required
          className={`w-full border rounded-xl px-4 py-3 text-sm text-[var(--ink)] outline-none resize-none transition-colors
            ${errors.message ? 'border-red-400 focus:border-red-500' : 'border-[var(--line)] focus:border-[var(--green)]'}`}
        />
        {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
      </div>
      <div>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="agree"
            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[var(--green)] focus:ring-[var(--green)]"
          />
          <span className="text-sm text-[var(--gray)]">
            <a href="#" className="text-[var(--green)] hover:underline">プライバシーポリシー</a>
            に同意します *
          </span>
        </label>
        {errors.agree && <p className="text-red-500 text-xs mt-1 ml-7">{errors.agree}</p>}
      </div>
      <button
        type="submit"
        disabled={state === 'submitting'}
        className="w-full py-3.5 bg-[var(--green)] hover:bg-[var(--green-d)] disabled:bg-[var(--green-d)] text-white font-semibold rounded-xl transition-colors"
      >
        {state === 'submitting' ? '送信中...' : '送信する'}
      </button>
    </form>
  );
}

function FormField({
  label,
  name,
  type = 'text',
  placeholder,
  error,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-[var(--ink)] mb-1.5">{label}</label>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        required={required}
        className={`w-full border rounded-xl px-4 py-3 text-sm text-[var(--ink)] outline-none transition-colors
          ${error ? 'border-red-400 focus:border-red-500' : 'border-[var(--line)] focus:border-[var(--green)]'}`}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
