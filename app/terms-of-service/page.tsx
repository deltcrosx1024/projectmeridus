import { useLanguage } from '@/app/contexts/LanguageContext';

export default function TermsOfService() {
  const { language } = useLanguage();
  
  const content = language === 'ja' ? {
    title: '利用規約',
    lastUpdated: '最終更新日',
    introduction: 'はじめに',
    introductionText: 'DeltCrosX DevHub（以下「当サービス」）へようこそ。当サービスへのアクセスまたは使用により、本利用規約に同意したものと見なされます。当サービスの一部機能には、追加の条項が適用される場合があります。',
    
    acceptance: '同意',
    acceptanceText: '当サービスにアクセスまたは使用することにより、本利用規約に同意します。当利用規約の条件に同意しない場合は、当サービスへのアクセスまたは使用しないでください。',
    
    changes: '変更',
    changesText: '私たちは、理由を問わずいつでも、本利用規約を修正する権利を留保します。変更については、当サービスに 게시一篇 게시するものとします。重要な変更については、合理的な事前通知を提供します。',
    
    userAccounts: 'ユーザーアカウント',
    userAccountsText: '当サービスの一部機能には、アカウントの作成と登録が必要な場合があります。アカウントのセキュリティを確保し、アカウントのすべての活動に責任を持っていただく必要があります。',
    
    intellectualProperty: '知的財産権',
    intellectualPropertyText: '当サービスおよび関連するすべてのコンテンツ、、機能性は、DeltCrosX DevHubまたはそのライセンサーの財産であり、著作権、商標、およびその他の法律で保護されています。',
    
    termination: '終了',
    terminationText: '私たちは、理由を問わず、アカウントを削除し、理由なしにサービスへのアクセスをブロックする権利を留保します。',
    
    disclaimer: '否認',
    disclaimerText: '当サービスは「現状有姿」で提供されます。法律で認められた範囲において、暗示的な 商品性、特定目的への適合性、非侵害を含むがこれに限定されない、すべての明示または黙示の保証を否認します。',
    
    limitation: '責任の制限',
    limitationText: 'DeltCrosX DevHubは、本利用規約または当サービスに関連して、如何なる間接的、偶発的、特別な、派生的、または懲罰的損害についても責任を負いません。',
    
    governingLaw: '準拠法',
    governingLawText: '本利用規約は、抵触法規を考慮せずに、日本の法律に従って解釈されます。',
    
    contact: 'お問い合わせ',
    contactText: '本利用規約に関するご質問は、【contact@meridus.dev】までお問い合わせください。',
  } : {
    title: 'Terms of Service',
    lastUpdated: 'Last Updated',
    introduction: 'Introduction',
    introductionText: 'Welcome to DeltCrosX DevHub (the "Service"). By accessing or using the Service, you agree to be bound by these Terms of Service. Some features of the Service may have additional terms that apply.',
    
    acceptance: 'Acceptance',
    acceptanceText: 'By accessing or using the Service, you agree to be bound by these Terms of Service. If you do not agree to these Terms, please do not access or use the Service.',
    
    changes: 'Changes',
    changesText: 'We reserve the right to modify these Terms of Service at any time for any reason. We will post any changes to the Service. We will provide reasonable notice for any material changes.',
    
    userAccounts: 'User Accounts',
    userAccountsText: 'Some features of the Service may require you to create and register an account. You are responsible for maintaining the security of your account and for all activities under your account.',
    
    intellectualProperty: 'Intellectual Property',
    intellectualPropertyText: 'The Service and all related content, features, and functionality are owned by DeltCrosX DevHub or its licensors and are protected by copyright, trademark, and other laws.',
    
    termination: 'Termination',
    terminationText: 'We reserve the right to delete your account and block access to the Service for any reason, without notice.',
    
    disclaimer: 'Disclaimer',
    disclaimerText: 'The Service is provided "as is". To the extent permitted by law, we disclaim all warranties, express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement.',
    
    limitation: 'Limitation of Liability',
    limitationText: 'DeltCrosX DevHub shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to these Terms of Service or the Service.',
    
    governingLaw: 'Governing Law',
    governingLawText: 'These Terms of Service shall be governed by and construed in accordance with the laws of Japan, without regard to conflict of law provisions.',
    
    contact: 'Contact',
    contactText: 'If you have any questions about these Terms of Service, please contact us at contact@meridus.dev.',
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
          {content.acceptance}
        </h2>
        <p style={{ lineHeight: '1.8', color: '#8b949e' }}>
          {content.acceptanceText}
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
          {content.userAccounts}
        </h2>
        <p style={{ lineHeight: '1.8', color: '#8b949e' }}>
          {content.userAccountsText}
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#e6edf3' }}>
          {content.intellectualProperty}
        </h2>
        <p style={{ lineHeight: '1.8', color: '#8b949e' }}>
          {content.intellectualPropertyText}
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#e6edf3' }}>
          {content.termination}
        </h2>
        <p style={{ lineHeight: '1.8', color: '#8b949e' }}>
          {content.terminationText}
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#e6edf3' }}>
          {content.disclaimer}
        </h2>
        <p style={{ lineHeight: '1.8', color: '#8b949e' }}>
          {content.disclaimerText}
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#e6edf3' }}>
          {content.limitation}
        </h2>
        <p style={{ lineHeight: '1.8', color: '#8b949e' }}>
          {content.limitationText}
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#e6edf3' }}>
          {content.governingLaw}
        </h2>
        <p style={{ lineHeight: '1.8', color: '#8b949e' }}>
          {content.governingLawText}
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
