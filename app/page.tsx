import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Click</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-600 hover:text-blue-600 transition-colors font-medium">
              機能
            </a>
            <a href="#pricing" className="text-sm text-gray-600 hover:text-blue-600 transition-colors font-medium">
              料金
            </a>
            <a href="#" className="text-sm text-gray-600 hover:text-blue-600 transition-colors font-medium">
              ドキュメント
            </a>
            <a href="#" className="text-sm text-gray-600 hover:text-blue-600 transition-colors font-medium">
              事例
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <a href="#" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-4 py-2">
              サインイン
            </a>
            <Link
              href="/builder"
              className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors px-5 py-2.5 rounded-lg shadow-sm"
            >
              無料で始める
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#F8FAFC] via-transparent to-transparent" style={{ top: '60%' }} />

        {/* Decorative blobs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute top-40 right-1/4 w-80 h-80 bg-cyan-400/20 rounded-full blur-3xl" />
        <div className="absolute top-10 right-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-white/90 text-sm font-medium mb-8">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            新機能: AI によるアプリ自動生成が登場
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-white leading-tight mb-6">
            誰でもノーコードで
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-200">
              アプリを作れる
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto mb-10 leading-relaxed">
            ドラッグ&ドロップだけで、プロ品質のアプリをすばやく構築。
            <br className="hidden md:block" />
            コーディング不要で、あなたのアイデアをすぐに形に。
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/builder"
              className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold text-lg px-8 py-4 rounded-xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              アプリを作る
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/30 text-white font-semibold text-lg px-8 py-4 rounded-xl hover:bg-white/20 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              デモを見る
            </a>
          </div>

          {/* App preview mockup */}
          <div className="relative mx-auto max-w-4xl">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-1 shadow-2xl">
              <div className="bg-gray-900 rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-700">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <div className="flex-1 bg-gray-800 rounded-md px-3 py-1 text-gray-400 text-xs ml-4">
                    app.click.dev/builder
                  </div>
                </div>
                <div className="flex h-72">
                  <div className="w-48 bg-slate-800 border-r border-gray-700 p-3">
                    <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">コンポーネント</div>
                    {['テキスト', '見出し', 'ボタン', '画像', 'カード'].map((item) => (
                      <div key={item} className="flex items-center gap-2 p-2 rounded-md hover:bg-slate-700 cursor-pointer mb-1">
                        <div className="w-4 h-4 rounded bg-blue-500/30" />
                        <span className="text-gray-300 text-xs">{item}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 bg-slate-700 flex items-center justify-center">
                    <div className="bg-white rounded-lg w-48 h-56 shadow-xl p-4 space-y-3">
                      <div className="h-4 bg-blue-100 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 rounded" />
                      <div className="h-3 bg-gray-100 rounded w-5/6" />
                      <div className="h-8 bg-blue-600 rounded-lg" />
                      <div className="h-3 bg-gray-100 rounded w-4/5" />
                      <div className="h-3 bg-gray-100 rounded" />
                    </div>
                  </div>
                  <div className="w-48 bg-slate-800 border-l border-gray-700 p-3">
                    <div className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">プロパティ</div>
                    <div className="space-y-3">
                      {['テキスト', '色', 'サイズ', '配置'].map((prop) => (
                        <div key={prop}>
                          <div className="text-gray-500 text-xs mb-1">{prop}</div>
                          <div className="h-6 bg-slate-700 rounded border border-gray-600" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-black text-blue-600 mb-2">70,000+</div>
              <div className="text-gray-600 font-medium">アプリ作成</div>
            </div>
            <div className="border-y md:border-y-0 md:border-x border-gray-100 py-8 md:py-0">
              <div className="text-4xl font-black text-blue-600 mb-2">2,500万</div>
              <div className="text-gray-600 font-medium">累計ユーザー</div>
            </div>
            <div>
              <div className="text-4xl font-black text-blue-600 mb-2">26,000+</div>
              <div className="text-gray-600 font-medium">組織導入</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block text-sm font-semibold text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full mb-4">
              機能
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
              アプリ開発を
              <span className="gradient-text"> もっとシンプルに</span>
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              Click があれば、技術的な知識がなくても本格的なアプリを作成できます。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                ),
                color: 'bg-blue-500',
                title: 'ドラッグ&ドロップ',
                description: '直感的なドラッグ&ドロップインターフェースで、コンポーネントを配置するだけでアプリが完成します。',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
                  </svg>
                ),
                color: 'bg-cyan-500',
                title: 'マルチプラットフォーム',
                description: 'Web、iOS、Androidに対応。一度作れば全てのデバイスで動くアプリを配信できます。',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                ),
                color: 'bg-purple-500',
                title: '外部連携',
                description: 'Notion、Airtable、Supabaseなど人気サービスとシームレスに連携。データ管理も簡単です。',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                ),
                color: 'bg-amber-500',
                title: 'AI統合',
                description: 'AIがアプリのデザインやコンテンツを自動生成。アイデアを入力するだけでアプリの骨格が完成します。',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
                color: 'bg-green-500',
                title: 'エンタープライズセキュリティ',
                description: 'SOC 2 Type II認定取得。SSO対応、ロールベースアクセス制御でビジネスでも安心して使えます。',
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ),
                color: 'bg-red-500',
                title: '充実のサポート',
                description: '専任のサポートチームが日本語で対応。ドキュメント、チュートリアル、コミュニティも完備。',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-blue-100 hover:shadow-lg transition-all duration-300 group"
              >
                <div className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center text-white mb-5 group-hover:scale-110 transition-transform duration-200`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-gradient-to-br from-blue-600 to-cyan-600">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              3ステップで完成
            </h2>
            <p className="text-blue-100 text-xl">シンプルなプロセスでアプリを作成</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'コンポーネントを選ぶ',
                description: 'パレットからテキスト、ボタン、フォームなど好きな要素を選択してください。',
              },
              {
                step: '02',
                title: 'ドラッグ&ドロップ',
                description: 'キャンバスにドロップして、プロパティパネルでスタイルをカスタマイズ。',
              },
              {
                step: '03',
                title: '公開する',
                description: 'ワンクリックで公開。URLを共有すれば誰でもすぐにアクセスできます。',
              },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/30">
                  <span className="text-white font-black text-2xl">{step.step}</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-blue-100">{step.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/builder"
              className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold text-lg px-8 py-4 rounded-xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200"
            >
              今すぐ試してみる
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block text-sm font-semibold text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full mb-4">
              料金プラン
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
              シンプルな料金体系
            </h2>
            <p className="text-xl text-gray-500">用途に合わせて選べる3つのプラン</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: 'Free',
                price: '¥0',
                period: '永久無料',
                description: '個人利用・小規模プロジェクトに',
                color: 'border-gray-200',
                headerBg: 'bg-gray-50',
                features: [
                  'アプリ作成 3件まで',
                  '月間アクティブユーザー 1,000人',
                  '基本コンポーネント',
                  'Clickドメインで公開',
                  'コミュニティサポート',
                ],
                cta: '無料で始める',
                ctaStyle: 'bg-gray-900 text-white hover:bg-gray-800',
              },
              {
                name: 'Standard',
                price: '¥4,980',
                period: '月額（税抜）',
                description: '成長中のチーム・スタートアップに',
                color: 'border-blue-500',
                headerBg: 'bg-gradient-to-br from-blue-600 to-cyan-600',
                badge: '人気',
                features: [
                  'アプリ作成 無制限',
                  '月間アクティブユーザー 10,000人',
                  '全コンポーネント使用可能',
                  'カスタムドメイン対応',
                  'メールサポート',
                  'チームコラボ（5名）',
                  'API連携',
                ],
                cta: 'スタンダードを始める',
                ctaStyle: 'bg-blue-600 text-white hover:bg-blue-700',
              },
              {
                name: 'Pro',
                price: '¥14,800',
                period: '月額（税抜）',
                description: '大規模組織・エンタープライズに',
                color: 'border-purple-200',
                headerBg: 'bg-gradient-to-br from-purple-600 to-blue-600',
                features: [
                  'アプリ作成 無制限',
                  '月間アクティブユーザー 無制限',
                  '全コンポーネント使用可能',
                  'カスタムドメイン対応',
                  '優先サポート（24時間）',
                  'チームコラボ（無制限）',
                  'SSO/SAML対応',
                  'SLA保証',
                  'カスタム契約',
                ],
                cta: 'Proを始める',
                ctaStyle: 'bg-purple-600 text-white hover:bg-purple-700',
              },
            ].map((plan, i) => (
              <div
                key={i}
                className={`bg-white rounded-2xl border-2 ${plan.color} overflow-hidden flex flex-col ${i === 1 ? 'shadow-2xl scale-105' : 'shadow-md'}`}
              >
                <div className={`${plan.headerBg} p-6 ${i !== 0 ? 'text-white' : 'text-gray-900'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-lg">{plan.name}</span>
                    {plan.badge && (
                      <span className="bg-white text-blue-600 text-xs font-bold px-3 py-1 rounded-full">
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-3xl font-black mb-1">{plan.price}</div>
                  <div className={`text-sm ${i !== 0 ? 'text-blue-100' : 'text-gray-500'}`}>{plan.period}</div>
                  <div className={`text-sm mt-2 ${i !== 0 ? 'text-blue-100' : 'text-gray-500'}`}>{plan.description}</div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <ul className="space-y-3 flex-1 mb-6">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-3 text-sm text-gray-600">
                        <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/builder"
                    className={`w-full text-center font-semibold py-3 px-6 rounded-xl transition-colors duration-200 ${plan.ctaStyle}`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gray-900">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
            今すぐ無料でアプリを
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              作り始めよう
            </span>
          </h2>
          <p className="text-xl text-gray-400 mb-10">
            クレジットカード不要。アカウント登録なしでもお試しいただけます。
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/builder"
              className="inline-flex items-center gap-2 bg-blue-600 text-white font-bold text-lg px-8 py-4 rounded-xl hover:bg-blue-500 transition-colors shadow-xl"
            >
              無料でアプリを作る
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-400 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">C</span>
                </div>
                <span className="text-xl font-bold text-white">Click</span>
              </div>
              <p className="text-sm leading-relaxed max-w-xs">
                誰でも簡単にアプリを作れるノーコードプラットフォーム。あなたのアイデアを今すぐ形に。
              </p>
            </div>
            {[
              {
                title: '製品',
                links: ['機能', 'テンプレート', '料金', 'ロードマップ'],
              },
              {
                title: 'リソース',
                links: ['ドキュメント', 'チュートリアル', 'ブログ', 'コミュニティ'],
              },
              {
                title: '会社',
                links: ['会社概要', '採用情報', 'プレス', 'お問い合わせ'],
              },
            ].map((col) => (
              <div key={col.title}>
                <div className="text-white font-semibold text-sm mb-4">{col.title}</div>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm hover:text-white transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm">© 2024 Click, Inc. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm hover:text-white transition-colors">プライバシーポリシー</a>
              <a href="#" className="text-sm hover:text-white transition-colors">利用規約</a>
              <a href="#" className="text-sm hover:text-white transition-colors">特定商取引法</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
