'use client';

import { useState, useEffect } from 'react';

export default function CodeOfConduct() {
  const [language, setLanguage] = useState<'en' | 'ja'>('en');
  
  useEffect(() => {
    const stored = localStorage.getItem('language');
    if (stored === 'ja' || stored === 'en') {
      setLanguage(stored);
    }
  }, []);
  
  const content = language === 'ja' ? {
    title: '行動規範',
    lastUpdated: '最終更新日',
    
    introduction: 'はじめに',
    introductionText: 'この行動規範は、DeltCrosX DevHub（以下「当サービス」）のコミュニティにおける私たちの期待される行動と、受け入れられない行為の基準を設定します。この規範は、Discord_bot、GitHub統合、ウェブサイト，以及び関連するすべてのコミュニケーションやアクティビティに適用されます。',
    
    pledge: '私たちの誓約',
    pledgeText: '的开发者とコミュニティの一員として、私たちはすべての人々、私たちのコミュニティへの参加を歓迎し、ハラスメントのない体験を提供することを誓います。私たちは、、年齢、体格、障害、民族、性自認、経験レベル、教育、社会経済的地位、国籍、外見、人種、宗教、または性的アイデンティティに関係なく、すべての人にとって安全な環境を構築することを誓います。',
    
    standards: '私たちの基準',
    standardsText1: 'ポジティブな環境を作り出すことに貢献する行動例：',
    standardsList1: [
      '他者への共感と優しさを示す',
      '異なる視点や経験を尊重する',
      '建設的なフィードバックをprofessionally提供する',
      'コミュニティの他のメンバーに対して責任を示す',
      'ハラスメントや軽蔑的なコメントにした場合、それ遭遇に注意を払う',
    ],
    standardsText2: '許容できない行動の例：',
    standardsList2: [
      '性的な言葉や画像の使用、および любые 性的な注目や脅迫',
      '-personal攻撃、嫌がらせ、または軽蔑的なコメント',
      '公開または私的ないやがらせ',
      '個人の情報を公開すること（「去」）他者の明示的な許可なく',
      'その他の不当な行為',
    ],
    
    enforcement: '執行責任',
    enforcementText: 'コミュニティのリーダーは、この行動規範に従わない、あらゆる受け入れられない行為、コメント、コミット、wiki編集、イシュー、およびその他の活動に対して責任を負います。 他们は、不適切な行為の報告を調査し、適切な措置を講じることで、コミュニティにとって安全な環境を確保する権限と責任を持ちます。',
    
    scope: '適用範囲',
    scopeText: 'この行動規範は、個人が当サービスおよびそのコミュニティを公式に代表している場合、すべての公共スペースに適用されます。 个人またはチームとして当サービスを代表することは、公式のソーシャルメディアアカウント的使用によっても、オンラインディスカッションへの参加によっても、oonlineイベントやミートアップへの参加によっても行われる可能性があります。',
    
    reporting: '報告と執行',
    reportingText: '虐待的、脅迫的、またはその他の受け入れられない行動の事例は、contact@meridus.devまで報告することができます。 すべての苦情は、迅速かつ公正に調査され、状況に対して適切に対応されます。',
    
    enforcementGuidelines: '執行ガイドライン',
    enforcementGuidelinesText: 'コミュニティリーダーは、この行動規範に違反する行動の重大性を判断する際に、以下のガイドラインに従います：',
    enforcementList: [
      { title: '修正', text: '軽微な違反に対して、コミュニティリーダーは警告を発し、是正を求める場合があります。' },
      { title: '警告', text: '警告を発行し、状況の改善を求めます。繰り返し違反した場合、一定期間の参加禁止処分があります。' },
      { title: '一時停止', text: '一時的に参加禁止処分を受ける場合があります。' },
      { title: '恒久的な追放', text: '恒久的にコミュニティから追放される場合があります。' },
    ],
    
    attribution: '帰属',
    attributionText: 'この行動規範は、https://www.contributor-covenant.org/version/2/1/code_of_conduct.html で入手可能な Contributor Covenant バージョン2.1 に改変 版です。',
    
    contact: 'お問い合わせ',
    contactText: 'この行動規範に関するご質問やご提案は、contact@meridus.devまでお問い合わせください。',
  } : {
    title: 'Code of Conduct',
    lastUpdated: 'Last Updated',
    
    introduction: 'Introduction',
    introductionText: 'This Code of Conduct outlines our expectations for all members of our community, as well as the consequences for unacceptable behavior. This code applies to our Discord bot, GitHub integration, website, and all related communication and activities.',
    
    pledge: 'Our Pledge',
    pledgeText: 'In the interest of fostering an open and welcoming environment, we as contributors and leaders pledge to make participation in our community a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.',
    
    standards: 'Our Standards',
    standardsText1: 'Examples of behavior that contributes to a positive environment:',
    standardsList1: [
      'Demonstrating empathy and kindness toward other people',
      'Being respectful of differing opinions, viewpoints, and experiences',
      'Giving and gracefully accepting constructive feedback',
      'Focusing on what is best for the community',
      'Showing empathy towards other community members',
    ],
    standardsText2: 'Examples of unacceptable behavior:',
    standardsList2: [
      'The use of sexualized language or imagery, and sexual attention or advances of any kind',
      'Trolling, insulting or derogatory comments, and personal or political attacks',
      'Public or private harassment',
      'Publishing others\' private information without their explicit permission',
      'Other conduct which could reasonably be considered inappropriate',
    ],
    
    enforcement: 'Enforcement Responsibilities',
    enforcementText: 'Community leaders are responsible for clarifying and enforcing our standards of acceptable behavior and will take appropriate and fair corrective action in response to any behavior that they deem inappropriate, threatening, offensive, or harmful. They have the right and responsibility to remove, edit, or reject comments, commits, code, wiki edits, issues, and other contributions that are not aligned to this Code of Conduct.',
    
    scope: 'Scope',
    scopeText: 'This Code of Conduct applies within all community spaces, and also applies when an individual is officially representing the community in public spaces. Examples of representing our community include using an official e-mail address, posting via an official social media account, or acting as an appointed representative at an online or offline event.',
    
    reporting: 'Reporting & Enforcement',
    reportingText: 'Instances of abusive, harassing, or otherwise unacceptable behavior may be reported to the community leaders responsible for enforcement at contact@meridus.dev. All complaints will be reviewed and investigated promptly and fairly. All community leaders are obligated to respect the privacy and security of the reporter of any incident.',
    
    enforcementGuidelines: 'Enforcement Guidelines',
    enforcementGuidelinesText: 'Community leaders will follow these Community Impact Guidelines in determining the consequences for any action they deem in violation of this Code of Conduct:',
    enforcementList: [
      { title: 'Correction', text: 'Community Impact: A minor violation that does not justify removal from the community.' },
      { title: 'Warning', text: 'Community Impact: A violation through a single incident or series of actions.' },
      { title: 'Temporary Ban', text: 'Community Impact: A serious violation of community standards.' },
      { title: 'Permanent Ban', text: 'Community Impact: Demonstrating a pattern of violation of community standards.' },
    ],
    
    attribution: 'Attribution',
    attributionText: 'This Code of Conduct is adapted from the Contributor Covenant, version 2.1, available at https://www.contributor-covenant.org/version/2/1/code_of_conduct.html.',
    
    contact: 'Contact',
    contactText: 'If you have questions or suggestions regarding this Code of Conduct, please contact us at contact@meridus.dev.',
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      padding: '120px 20px 60px',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontFamily: 'var(--font-aldrich)',
          color: '#e6edf3'
        }}>
          {content.title}
        </h1>
        <button
          onClick={() => setLanguage(language === 'en' ? 'ja' : 'en')}
          style={{
            padding: '8px 16px',
            background: '#21262d',
            border: '1px solid #30363d',
            borderRadius: '6px',
            color: '#8b949e',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          {language === 'en' ? '日本語' : 'English'}
        </button>
      </div>
      
      <p style={{ color: '#888', marginBottom: '2rem' }}>
        {content.lastUpdated}: 2026-03-11
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
          {content.pledge}
        </h2>
        <p style={{ lineHeight: '1.8', color: '#8b949e' }}>
          {content.pledgeText}
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#e6edf3' }}>
          {content.standards}
        </h2>
        <p style={{ lineHeight: '1.8', color: '#8b949e', marginBottom: '1rem' }}>
          {content.standardsText1}
        </p>
        <ul style={{ lineHeight: '2', color: '#8b949e', paddingLeft: '1.5rem', marginBottom: '1rem' }}>
          {content.standardsList1.map((item, index) => (
            <li key={index} style={{ marginBottom: '0.5rem' }}>{item}</li>
          ))}
        </ul>
        <p style={{ lineHeight: '1.8', color: '#8b949e', marginBottom: '1rem' }}>
          {content.standardsText2}
        </p>
        <ul style={{ lineHeight: '2', color: '#8b949e', paddingLeft: '1.5rem' }}>
          {content.standardsList2.map((item, index) => (
            <li key={index} style={{ marginBottom: '0.5rem' }}>{item}</li>
          ))}
        </ul>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#e6edf3' }}>
          {content.enforcement}
        </h2>
        <p style={{ lineHeight: '1.8', color: '#8b949e' }}>
          {content.enforcementText}
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#e6edf3' }}>
          {content.scope}
        </h2>
        <p style={{ lineHeight: '1.8', color: '#8b949e' }}>
          {content.scopeText}
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#e6edf3' }}>
          {content.reporting}
        </h2>
        <p style={{ lineHeight: '1.8', color: '#8b949e' }}>
          {content.reportingText}
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#e6edf3' }}>
          {content.enforcementGuidelines}
        </h2>
        <p style={{ lineHeight: '1.8', color: '#8b949e', marginBottom: '1rem' }}>
          {content.enforcementGuidelinesText}
        </p>
        <div style={{ display: 'grid', gap: '1rem' }}>
          {content.enforcementList.map((item, index) => (
            <div key={index} style={{ 
              padding: '1rem', 
              background: '#161b22', 
              borderRadius: '8px',
              border: '1px solid #30363d'
            }}>
              <h3 style={{ color: '#e6edf3', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
                {item.title}
              </h3>
              <p style={{ color: '#8b949e', lineHeight: '1.6', margin: 0 }}>
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#e6edf3' }}>
          {content.attribution}
        </h2>
        <p style={{ lineHeight: '1.8', color: '#8b949e' }}>
          {content.attributionText}
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
