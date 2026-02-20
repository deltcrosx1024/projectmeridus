'use client';

import { useState, useEffect } from 'react';

export default function PrivacyPolicy() {
  const [language, setLanguage] = useState<'en' | 'ja'>('en');
  
  useEffect(() => {
    const stored = localStorage.getItem('language');
    if (stored === 'ja' || stored === 'en') {
      setLanguage(stored);
    }
  }, []);
  
  const content = language === 'ja' ? {
    title: 'プライバシーポリシー',
    lastUpdated: '最終更新日',
    introduction: 'はじめに',
    introductionText: 'DeltCrosX DevHub（以下「当サービス」）は、ユーザーのプライバシーを重要視しています。このプライバシーポリシーは、当サービスがどのように情報を収集、使用、保護するかについて説明します。',
    
    dataCollect: '収集する情報',
    dataCollectText: '当サービスは、OAuth認証を通じてGitHubおよびDiscordのアカウント情報を収集する可能性があります。収集する情報には、ユーザー名、メールアドレス、公開プロフィール情報が含まれます。',
    
    useData: '情報の使用',
    useDataText: '収集した情報は、当サービスの提供、改善、カスタマイズに使用されます。また、サービスの向上のための分析にも使用される場合があります。',
    
    dataProtection: 'データの保護',
    dataProtectionText: '当サービスは、ユーザーのデータを保護するために合理的なセキュリティ対策を実施しています。ただし、インターネット上での数据传输は100%安全であることを保証することはできません。',
    
    thirdParty: '第三者への開示',
    thirdPartyText: '当サービスは、法令要求された場合または当サービスの利用規約違反調査のために、ユーザーの情報を開示する場合があります。',
    
    cookies: 'Cookieの使用',
    cookiesText: '当サービスは、用户体验の向上のためにCookieを使用する場合があります。Cookieは、ブラウザに保存される小さなファイルです。',
    
    children: '子供向け',
    childrenText: '当サービスは、13歳以下の子供を対象としていません。',
    
    changes: '変更',
    changesText: 'このプライバシーポリシーを変更する場合があります。変更については、当サービスに 게시一篇 게시します。',
    
    contact: 'お問い合わせ',
    contactText: 'このプライバシーポリシーに関するご質問は、【contact@meridus.dev】までお問い合わせください。',
  } : {
    title: 'Privacy Policy',
    lastUpdated: 'Last Updated',
    introduction: 'Introduction',
    introductionText: 'DeltCrosX DevHub (the "Service") respects your privacy. This Privacy Policy explains how we collect, use, and protect your information.',
    
    dataCollect: 'Information We Collect',
    dataCollectText: 'The Service may collect account information from GitHub and Discord through OAuth authentication. The information collected may include username, email address, and public profile information.',
    
    useData: 'How We Use Your Information',
    useDataText: 'We use the information collected to provide, improve, and customize the Service. We may also use the information for analytics to improve the Service.',
    
    dataProtection: 'Data Protection',
    dataProtectionText: 'We implement reasonable security measures to protect your data. However, we cannot guarantee the security of information transmitted over the internet.',
    
    thirdParty: 'Third-Party Disclosure',
    thirdPartyText: 'We may disclose your information if required by law or to investigate violations of our Terms of Service.',
    
    cookies: 'Cookies',
    cookiesText: 'The Service may use cookies to improve your user experience. Cookies are small files stored on your browser.',
    
    children: 'Children',
    childrenText: 'The Service is not intended for children under 13 years of age.',
    
    changes: 'Changes',
    changesText: 'We may change this Privacy Policy from time to time. We will post any changes to the Service.',
    
    contact: 'Contact',
    contactText: 'If you have any questions about this Privacy Policy, please contact us at contact@meridus.dev.',
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      padding: '120px 20px 60px',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h1 style={{ 
        fontSize: '2.5rem', 
        marginBottom: '1rem',
        fontFamily: 'var(--font-aldrich)'
      }}>
        {content.title}
      </h1>
      
      <p style={{ color: '#888', marginBottom: '2rem' }}>
        {content.lastUpdated}: 2026-02-20
      </p>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#e6edf3' }}>
          {content.introduction}
        </h2>
        <p style={{ lineHeight: '1.8', color: '#8b949e' }}>
          {content.introductionText}
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#e6edf3' }}>
          {content.dataCollect}
        </h2>
        <p style={{ lineHeight: '1.8', color: '#8b949e' }}>
          {content.dataCollectText}
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#e6edf3' }}>
          {content.useData}
        </h2>
        <p style={{ lineHeight: '1.8', color: '#8b949e' }}>
          {content.useDataText}
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#e6edf3' }}>
          {content.dataProtection}
        </h2>
        <p style={{ lineHeight: '1.8', color: '#8b949e' }}>
          {content.dataProtectionText}
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#e6edf3' }}>
          {content.thirdParty}
        </h2>
        <p style={{ lineHeight: '1.8', color: '#8b949e' }}>
          {content.thirdPartyText}
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#e6edf3' }}>
          {content.cookies}
        </h2>
        <p style={{ lineHeight: '1.8', color: '#8b949e' }}>
          {content.cookiesText}
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#e6edf3' }}>
          {content.children}
        </h2>
        <p style={{ lineHeight: '1.8', color: '#8b949e' }}>
          {content.children}
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#e6edf3' }}>
          {content.changes}
        </h2>
        <p style={{ lineHeight: '1.8', color: '#8b949e' }}>
          {content.changesText}
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#e6edf3' }}>
          {content.contact}
        </h2>
        <p style={{ lineHeight: '1.8', color: '#8b949e' }}>
          {content.contactText}
        </p>
      </section>
    </div>
  );
}
